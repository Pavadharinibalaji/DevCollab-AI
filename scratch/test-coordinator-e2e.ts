import { AICoordinator } from "../lib/ai/coordinator/coordinator";
import { AIRequest } from "../lib/ai/types/request";
import { AIProvider } from "../lib/ai/providers/provider";
import { intentClassifier } from "../lib/ai/intents/intent-classifier";

// 1. Setup Mock Provider
class MockTestProvider implements AIProvider {
  readonly providerName = "Mock";
  readonly modelName = "mock-model";
  public defaultModel = "mock-model";
  public calls: Array<{ prompt: string; options?: any }> = [];
  
  constructor(
    public classificationResponse: string,
    public planningResponse: string,
    public failGenerateCount = 0
  ) {}

  async generate(prompt: string, options?: any): Promise<string> {
    this.calls.push({ prompt, options });
    if (this.failGenerateCount > 0 && !prompt.includes("Allowed intents")) {
      this.failGenerateCount--;
      throw new Error("Simulated Provider Generation Error");
    }
    
    // Check if the prompt asks for intent classification
    if (prompt.includes("Allowed intents")) {
      return this.classificationResponse;
    }
    
    // Default to planning response
    return this.planningResponse;
  }

  async routeIntent(prompt: string, intents: string[], options?: any): Promise<string> {
    return "";
  }

  async chat(messages: any[], options?: any): Promise<string> {
    return "";
  }
}

async function runE2ETests() {
  console.log("=== STARTING COORDINATOR INTEGRATION E2E TESTS ===\n");

  // TEST 1: Successful Intent Routing and PlanningAgent Execution
  {
    console.log("Test 1: Normal planning request with valid context");
    const mockProvider = new MockTestProvider(
      JSON.stringify({ intent: "planning", confidence: 0.99, reason: "Requesting roadmap creation" }),
      "### Summary\nroadmap plan successful"
    );

    const coordinator = new AICoordinator(mockProvider);
    // Force intentClassifier to use mockProvider so classification runs on LLM
    intentClassifier.setProvider(mockProvider);

    const req: AIRequest = {
      id: "req_e2e_1",
      prompt: "Create a sprint plan for next week",
      context: {
        userId: "user_test",
        projectId: "proj_1",
      },
      aiContext: {
        workspace: { workspaceId: "ws_1", name: "DevCollab Workspace", slug: "devcollab-ws", membersCount: 3 },
        project: { projectId: "proj_1", name: "DevCollab Project", slug: "devcollab-proj", status: "active" },
        repository: {},
        slack: {},
        timestamp: new Date().toISOString(),
      }
    };

    const res = await coordinator.execute(req);
    console.log("Response Success:", res.success);
    console.log("Response Content:", res.content);
    console.log("Standardized Fields (Phase 8):");
    console.log("- AgentName:", res.agentName);
    console.log("- Provider:", res.provider);
    console.log("- Confidence:", res.confidence);
    console.log("- ExecutionTime:", res.executionTimeMs, "ms");

    const success = res.success && res.content.includes("roadmap plan successful") && res.agentName === "planning";
    console.log(success ? "TEST 1 SUCCESS\n" : "TEST 1 FAILED\n");
  }

  // TEST 2: Missing Project Context Fallback
  {
    console.log("Test 2: Graceful return for missing project context");
    const mockProvider = new MockTestProvider(
      JSON.stringify({ intent: "planning", confidence: 0.99, reason: "Requesting roadmap creation" }),
      "roadmap plan successful"
    );

    const coordinator = new AICoordinator(mockProvider);
    intentClassifier.setProvider(mockProvider);

    const req: AIRequest = {
      id: "req_e2e_2",
      prompt: "generate roadmaps",
      aiContext: {
        workspace: { workspaceId: "ws_1", name: "DevCollab Workspace" },
        project: {}, // Missing projectId
        repository: {},
        slack: {},
        timestamp: new Date().toISOString(),
      }
    };

    const res = await coordinator.execute(req);
    console.log("Response Success:", res.success);
    console.log("Response Content:", res.content);
    console.log("- AgentName:", res.agentName);

    const success = res.success && res.content === "I need a project to generate a planning strategy." && res.agentName === "planning";
    console.log(success ? "TEST 2 SUCCESS\n" : "TEST 2 FAILED\n");
  }

  // TEST 3: Low Confidence Intent Classification Check
  {
    console.log("Test 3: Low confidence intent triggers clarification");
    const mockProvider = new MockTestProvider(
      JSON.stringify({ intent: "planning", confidence: 0.3, reason: "Unclear sprint request" }),
      "roadmap plan successful"
    );

    const coordinator = new AICoordinator(mockProvider);
    intentClassifier.setProvider(mockProvider);

    const req: AIRequest = {
      id: "req_e2e_3",
      prompt: "do something",
      aiContext: {
        workspace: { workspaceId: "ws_1" },
        project: { projectId: "proj_1" },
        repository: {},
        slack: {},
        timestamp: new Date().toISOString(),
      }
    };

    const res = await coordinator.execute(req);
    console.log("Response Success:", res.success);
    console.log("Response Content:", res.content);
    console.log("Error status:", res.error);

    const success = !res.success && res.error === "Needs Clarification";
    console.log(success ? "TEST 3 SUCCESS\n" : "TEST 3 FAILED\n");
  }

  // TEST 4: Classification Retry Behavior on Invalid JSON
  {
    console.log("Test 4: Invalid JSON during classification triggers retry");
    const mockProvider = new MockTestProvider(
      "invalid-non-json-output", // first classification call fails
      "### Summary\nroadmap success"
    );
    // Add second response to the mock calls queue
    const originalGenerate = mockProvider.generate.bind(mockProvider);
    let callIndex = 0;
    mockProvider.generate = async (prompt: string, options?: any) => {
      callIndex++;
      if (prompt.includes("Allowed intents")) {
        if (callIndex === 1) return "invalid-non-json-output";
        return JSON.stringify({ intent: "planning", confidence: 0.95, reason: "Planning retry match" });
      }
      return "### Summary\nroadmap success";
    };

    const coordinator = new AICoordinator(mockProvider);
    intentClassifier.setProvider(mockProvider);

    const req: AIRequest = {
      id: "req_e2e_4",
      prompt: "Create roadmap timelines",
      context: { projectId: "proj_1" },
      aiContext: {
        workspace: { workspaceId: "ws_1" },
        project: { projectId: "proj_1" },
        repository: {},
        slack: {},
        timestamp: new Date().toISOString(),
      }
    };

    const res = await coordinator.execute(req);
    console.log("Response Success:", res.success);
    console.log("Response Content:", res.content);
    console.log("Classification calls occurred:", callIndex);

    // Call index should be 3: 2 classification calls (1 fail + 1 retry) and 1 planning execution call.
    const success = res.success && res.content.includes("roadmap success") && callIndex === 3;
    console.log(success ? "TEST 4 SUCCESS\n" : "TEST 4 FAILED\n");
  }

  // TEST 5: Graceful Recovery and Provider Fallback Check
  {
    console.log("Test 5: Provider generation failure triggers fallback error response gracefully");
    const mockProvider = new MockTestProvider(
      JSON.stringify({ intent: "planning", confidence: 0.98, reason: "Planning matched" }),
      "roadmap plan success",
      1 // Fail the first generate call (simulate provider failure)
    );

    const coordinator = new AICoordinator(mockProvider);
    intentClassifier.setProvider(mockProvider);

    const req: AIRequest = {
      id: "req_e2e_5",
      prompt: "generate milestone plan",
      context: { projectId: "proj_1" },
      aiContext: {
        workspace: { workspaceId: "ws_1" },
        project: { projectId: "proj_1" },
        repository: {},
        slack: {},
        timestamp: new Date().toISOString(),
      }
    };

    // The execution should not crash, it should return a friendly response through the recovery layer
    const res = await coordinator.execute(req);
    console.log("Response Success:", res.success);
    console.log("Response Content:", res.content);
    console.log("Response Error:", res.error);

    const success = !res.success && res.error !== undefined;
    console.log(success ? "TEST 5 SUCCESS\n" : "TEST 5 FAILED\n");
  }

  intentClassifier.resetProvider();
  console.log("=== COMPLETED ALL E2E COORDINATOR TESTS ===");
}

runE2ETests().catch(console.error);
