// @ts-nocheck
import { ProviderResolver } from "../lib/ai/providers/provider-resolver";
import { ProviderHealthManager } from "../lib/ai/providers/provider-health";
import { AIRequest } from "../lib/ai/types/request";

// Mock DB models and auth directly in require.cache
const path = require("path");
const modelsPath = require.resolve("../lib/db/models");
require.cache[modelsPath] = {
  id: modelsPath,
  filename: modelsPath,
  loaded: true,
  exports: {
    UserKeyModel: {
      findOne: () => ({
        lean: () => null // fall back to env key
      })
    }
  }
};

const originalFetch = global.fetch;

async function runResilienceTests() {
  console.log("=== STARTING PROVIDER RESILIENCE & FALLBACK TESTS ===\n");

  const req: AIRequest = {
    id: "resilience_test_req",
    prompt: "Generate a timeline roadmap planning plan",
    context: {
      userId: "user_resilience",
      projectId: "proj_resilience",
    },
    aiContext: {
      workspace: { workspaceId: "ws_1", name: "DevCollab", slug: "devcollab" },
      project: { projectId: "proj_resilience", name: "Test Project", slug: "test-proj", status: "active" },
      repository: {},
      slack: {},
      timestamp: new Date().toISOString(),
    }
  };

  // Mock Env vars
  process.env.AI_PROVIDER = "gemini";
  process.env.GEMINI_API_KEY = "test-gemini-key";
  process.env.OPENAI_API_KEY = "test-openai-key";

  // Helper to mock fetch behaviour
  let fetchMockHandler = () => {};
  global.fetch = async (url, options) => {
    return fetchMockHandler(url, options);
  };

  let allPassed = true;

  // Scenario 1: Successful Gemini Response
  {
    console.log("--- Scenario 1: Successful Gemini Response ---");
    fetchMockHandler = (url, options) => {
      if (url.includes("generativelanguage")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: "### Summary\nroadmap success" }] } }],
            usageMetadata: { promptTokenCount: 15, candidatesTokenCount: 20, totalTokenCount: 35 }
          })
        };
      }
      return { ok: false, status: 500 };
    };

    const resolver = await ProviderResolver.resolve();
    const result = await resolver.instance.generate("Hello");
    console.log("Result:", result);
    const metrics = resolver.instance.getMetrics();
    console.log("Provider Name:", metrics.providerName);
    console.log("Model Name:", metrics.modelName);
    console.log("Retry Count:", metrics.retryCount);
    console.log("Fallback Used:", metrics.fallbackUsed);
    console.log("Token Usage:", metrics.tokenUsage);
    console.log("State Health:", ProviderHealthManager.getHealth("gemini").status);
    
    const success = result.includes("roadmap success") && metrics.providerName === "Gemini";
    console.log(success ? "Scenario 1: SUCCESS\n" : "Scenario 1: FAILED\n");
    if (!success) allPassed = false;
  }

  // Scenario 2: Model not found (404) triggers fallback model retry
  {
    console.log("--- Scenario 2: Model not found (404) -> Fallback Model retry ---");
    let primaryCalledCount = 0;
    fetchMockHandler = (url, options) => {
      if (url.includes("generativelanguage")) {
        if (url.includes("gemini-2.5-flash")) {
          primaryCalledCount++;
          return {
            ok: false,
            status: 404,
            text: async () => "Model gemini-2.5-flash not found"
          };
        }
        if (url.includes("gemini-1.5-flash")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              candidates: [{ content: { parts: [{ text: "### Summary\nfallback model roadmap success" }] } }],
              usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 15, totalTokenCount: 25 }
            })
          };
        }
      }
      return { ok: false, status: 500 };
    };

    const resolver = await ProviderResolver.resolve();
    const result = await resolver.instance.generate("Hello");
    console.log("Result:", result);
    const metrics = resolver.instance.getMetrics();
    console.log("Model Used:", metrics.modelName);
    console.log("Fallback Used:", metrics.fallbackUsed);
    console.log("Primary Called Count (404):", primaryCalledCount);
    
    const success = result.includes("fallback model roadmap success") && metrics.fallbackUsed && metrics.modelName === "gemini-1.5-flash";
    console.log(success ? "Scenario 2: SUCCESS\n" : "Scenario 2: FAILED\n");
    if (!success) allPassed = false;
  }

  // Scenario 3: Service unavailable (503) triggers automatic retries with backoff
  {
    console.log("--- Scenario 3: Service unavailable (503) -> Retries ---");
    let failureCount = 2; // Fail twice with 503, succeed on 3rd attempt
    fetchMockHandler = (url, options) => {
      if (url.includes("generativelanguage")) {
        if (failureCount > 0) {
          failureCount--;
          return {
            ok: false,
            status: 503,
            text: async () => "Service Unavailable"
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: "### Summary\nroadmap success after retries" }] } }]
          })
        };
      }
      return { ok: false, status: 500 };
    };

    const resolver = await ProviderResolver.resolve();
    const result = await resolver.instance.generate("Hello");
    console.log("Result:", result);
    const metrics = resolver.instance.getMetrics();
    console.log("Retry Count:", metrics.retryCount);
    console.log("Health Status:", ProviderHealthManager.getHealth("gemini").status);
    
    const success = result.includes("roadmap success after retries") && metrics.retryCount === 2;
    console.log(success ? "Scenario 3: SUCCESS\n" : "Scenario 3: FAILED\n");
    if (!success) allPassed = false;
  }

  // Scenario 4: Invalid API key (401) fails immediately without retrying
  {
    console.log("--- Scenario 4: Invalid API key (401) fails fast ---");
    let callCount = 0;
    fetchMockHandler = (url, options) => {
      callCount++;
      return {
        ok: false,
        status: 401,
        text: async () => "Invalid API Key"
      };
    };

    const resolver = await ProviderResolver.resolve();
    try {
      await resolver.instance.generate("Hello");
      console.log("Scenario 4: FAILED (did not throw error)\n");
      allPassed = false;
    } catch (err) {
      console.log("Error caught:", err.message);
      console.log("Total calls made:", callCount);
      // It should be exactly 2 calls because the primary (Gemini) failed fast on 401 (1 call),
      // and the failover secondary (OpenAI) also failed fast on 401 (1 call). Neither retried internally!
      const success = callCount === 2;
      console.log(success ? "Scenario 4: SUCCESS\n" : "Scenario 4: FAILED\n");
      if (!success) allPassed = false;
    }
  }

  // Scenario 5: Timeout (AbortError) triggers retry
  {
    console.log("--- Scenario 5: Request timeout -> Retry ---");
    let timeoutHappened = true;
    fetchMockHandler = async (url, options) => {
      if (timeoutHappened) {
        timeoutHappened = false;
        const abortErr = new Error("The user aborted a request.");
        abortErr.name = "AbortError";
        throw abortErr;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: "### Summary\nroadmap success after timeout" }] } }]
        })
      };
    };

    const resolver = await ProviderResolver.resolve();
    const result = await resolver.instance.generate("Hello");
    console.log("Result:", result);
    const metrics = resolver.instance.getMetrics();
    console.log("Retry Count:", metrics.retryCount);
    
    const success = result.includes("roadmap success after timeout") && metrics.retryCount === 1;
    console.log(success ? "Scenario 5: SUCCESS\n" : "Scenario 5: FAILED\n");
    if (!success) allPassed = false;
  }

  // Scenario 6: Automatic fallback to OpenAI
  {
    console.log("--- Scenario 6: Gemini completely unavailable -> Failover to OpenAI ---");
    fetchMockHandler = (url, options) => {
      if (url.includes("generativelanguage")) {
        return {
          ok: false,
          status: 503,
          text: async () => "Service Unavailable"
        };
      }
      if (url.includes("api.openai.com")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [{ message: { content: "### Summary\nOpenAI fallback roadmap success" } }],
            usage: { prompt_tokens: 12, completion_tokens: 18, total_tokens: 30 }
          })
        };
      }
      return { ok: false, status: 500 };
    };

    const resolver = await ProviderResolver.resolve();
    const result = await resolver.instance.generate("Hello");
    console.log("Result:", result);
    const metrics = resolver.instance.getMetrics();
    console.log("Active Provider:", metrics.providerName);
    console.log("Active Model:", metrics.modelName);
    console.log("Fallback Used:", metrics.fallbackUsed);
    console.log("Health (gemini):", ProviderHealthManager.getHealth("gemini").status);
    
    const success = result.includes("OpenAI fallback roadmap success") && metrics.providerName === "OpenAI";
    console.log(success ? "Scenario 6: SUCCESS\n" : "Scenario 6: FAILED\n");
    if (!success) allPassed = false;
  }

  // Scenario 7: Recovery after provider becomes healthy again
  {
    console.log("--- Scenario 7: Recovery check ---");
    ProviderHealthManager.recordFailure("gemini");
    ProviderHealthManager.recordFailure("gemini");
    console.log("Before success (gemini status):", ProviderHealthManager.getHealth("gemini").status);
    
    fetchMockHandler = (url, options) => {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: "### Summary\nroadmap success after recovery" }] } }]
        })
      };
    };
    
    const resolver = await ProviderResolver.resolve();
    await resolver.instance.generate("Hello");
    console.log("After success (gemini status):", ProviderHealthManager.getHealth("gemini").status);
    
    const success = ProviderHealthManager.getHealth("gemini").status === "Healthy";
    console.log(success ? "Scenario 7: SUCCESS\n" : "Scenario 7: FAILED\n");
    if (!success) allPassed = false;
  }

  // Reset original fetch
  global.fetch = originalFetch;
  console.log("=== COMPLETED ALL RESILIENCE TESTS ===");
  if (allPassed) {
    console.log("\nALL TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  } else {
    console.log("\nSOME TESTS FAILED.");
    process.exit(1);
  }
}

runResilienceTests().catch((err) => {
  global.fetch = originalFetch;
  console.error("Test execution failed:", err);
  process.exit(1);
});
