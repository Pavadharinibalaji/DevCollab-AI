import { IntentClassifier } from "../lib/ai/intents/intent-classifier";
import { parseIntentJSON } from "../lib/ai/intents/intent-parser";
import { AIProvider } from "../lib/ai/providers/provider";

class MockProvider implements AIProvider {
  readonly providerName = "Mock";
  readonly modelName = "mock-model";
  public callCount = 0;
  constructor(private responses: string[]) {}

  async generate(prompt: string, options?: any): Promise<string> {
    const resp = this.responses[this.callCount];
    this.callCount++;
    if (!resp) throw new Error("Mock has no more responses");
    return resp;
  }

  async routeIntent(prompt: string, intents: string[], options?: any): Promise<string> {
    return "";
  }

  async chat(messages: any[], options?: any): Promise<string> {
    return "";
  }
}

async function runTests() {
  console.log("--- STARTING INTENT CLASSIFICATION UNIT TESTS ---");

  // Test 1: Successful JSON parsing on first try
  {
    console.log("\nTest 1: Normal JSON response");
    const mock = new MockProvider([
      JSON.stringify({ intent: "planning", confidence: 0.95, reason: "Planning requested" })
    ]);
    const classifier = new IntentClassifier();
    classifier.setProvider(mock);

    const res = await classifier.classifyText("planning prompt");
    console.log("Result:", res);
    console.log("Mock call count:", mock.callCount);
    if (res.intent === "planning" && res.confidence === 0.95 && mock.callCount === 1) {
      console.log("Test 1 SUCCESS");
    } else {
      console.error("Test 1 FAILED");
    }
  }

  // Test 2: Invalid JSON on first try, successful on retry
  {
    console.log("\nTest 2: Invalid JSON first, valid on retry");
    const mock = new MockProvider([
      "invalid JSON text here",
      JSON.stringify({ intent: "code", confidence: 0.88, reason: "Code requested" })
    ]);
    const classifier = new IntentClassifier();
    classifier.setProvider(mock);

    const res = await classifier.classifyText("code prompt");
    console.log("Result:", res);
    console.log("Mock call count:", mock.callCount);
    if (res.intent === "code" && res.confidence === 0.88 && mock.callCount === 2) {
      console.log("Test 2 SUCCESS");
    } else {
      console.error("Test 2 FAILED");
    }
  }

  // Test 3: Invalid JSON on both tries -> fallback to unknown
  {
    console.log("\nTest 3: Invalid JSON both times");
    const mock = new MockProvider([
      "invalid JSON 1",
      "invalid JSON 2"
    ]);
    const classifier = new IntentClassifier();
    classifier.setProvider(mock);

    const res = await classifier.classifyText("unknown prompt");
    console.log("Result:", res);
    console.log("Mock call count:", mock.callCount);
    if (res.intent === "unknown" && res.confidence === 0 && mock.callCount === 2) {
      console.log("Test 3 SUCCESS");
    } else {
      console.error("Test 3 FAILED");
    }
  }

  // Test 4: Markdown wrapped JSON codeblock stripping
  {
    console.log("\nTest 4: Markdown wrapper stripping");
    const mock = new MockProvider([
      "```json\n{\n  \"intent\": \"scrum\",\n  \"confidence\": 0.99,\n  \"reason\": \"Scrum requested\"\n}\n```"
    ]);
    const classifier = new IntentClassifier();
    classifier.setProvider(mock);

    const res = await classifier.classifyText("scrum prompt");
    console.log("Result:", res);
    console.log("Mock call count:", mock.callCount);
    if (res.intent === "scrum" && res.confidence === 0.99 && mock.callCount === 1) {
      console.log("Test 4 SUCCESS");
    } else {
      console.error("Test 4 FAILED");
    }
  }
}

runTests().catch(console.error);
