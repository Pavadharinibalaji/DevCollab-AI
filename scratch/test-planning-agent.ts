import { PlanningAgent } from "../lib/ai/agents/planning-agent";
import { AIRequest } from "../lib/ai/types/request";
import { AIProvider } from "../lib/ai/providers/provider";

class MockProvider implements AIProvider {
  readonly providerName = "Mock";
  readonly modelName = "mock-gemini-2.5-flash";
  public defaultModel = "mock-gemini-2.5-flash";
  public promptReceived = "";

  async generate(prompt: string, options?: any): Promise<string> {
    this.promptReceived = prompt;
    return `### Summary
Mocked planning summary.

### Recommendations
- Sprint Goal: Mock task completions.

### Timeline
- Milestone 1: Done.

### Priorities
- Task 1 -> Task 2.

### Risks
- Bottleneck: None.

### Next Steps
- Implement code.
`;
  }

  async routeIntent(prompt: string, intents: string[], options?: any): Promise<string> {
    return "";
  }

  async chat(messages: any[], options?: any): Promise<string> {
    return "";
  }
}

async function runTests() {
  console.log("--- STARTING PLANNING AGENT VERIFICATION TESTS ---");

  const agent = new PlanningAgent();
  const mockProvider = new MockProvider();

  // Test 1: Missing project context -> graceful return message
  {
    console.log("\nTest 1: Missing project context");
    const req: AIRequest = {
      id: "req_1",
      prompt: "generate sprint plan",
      aiContext: {
        workspace: { workspaceId: "ws_1", name: "DevCollab WS" },
        project: {}, // Missing project details
        repository: {},
        slack: {},
        timestamp: new Date().toISOString(),
      }
    };

    const res = await agent.execute(req, mockProvider);
    console.log("Response Content:", res.content);
    if (res.content === "I need a project to generate a planning strategy." && res.success) {
      console.log("Test 1 SUCCESS");
    } else {
      console.error("Test 1 FAILED");
    }
  }

  // Test 2: Valid project context -> LLM call and correct prompt generation
  {
    console.log("\nTest 2: Valid project context");
    const req: AIRequest = {
      id: "req_2",
      prompt: "estimate team workload",
      aiContext: {
        workspace: { workspaceId: "ws_1", name: "DevCollab WS", slug: "devcollab-ws", membersCount: 5 },
        project: { projectId: "proj_1", name: "DevCollab Project", slug: "devcollab-proj", status: "active" },
        repository: {},
        slack: {},
        timestamp: new Date().toISOString(),
        memory: {
          project: {
            projectId: "proj_1",
            lastUpdated: new Date().toISOString(),
            entries: [
              { id: "mem_1", type: "project", timestamp: new Date().toISOString(), source: "api", summary: "Completed sprint 1 planning successfully" }
            ]
          }
        }
      }
    };

    const res = await agent.execute(req, mockProvider);
    console.log("Response Content:", res.content);
    console.log("Prompt generated contains instructions:", mockProvider.promptReceived.includes("You are the DevCollab AI Planning Agent"));
    console.log("Prompt generated contains Workspace Details:", mockProvider.promptReceived.includes("DevCollab WS"));
    console.log("Prompt generated contains Memory Details:", mockProvider.promptReceived.includes("Completed sprint 1 planning successfully"));
    if (res.success && res.content.includes("Mocked planning summary")) {
      console.log("Test 2 SUCCESS");
    } else {
      console.error("Test 2 FAILED");
    }
  }
}

runTests().catch(console.error);
