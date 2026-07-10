// @ts-nocheck
// Mock DB models and auth directly in require.cache BEFORE loading the route handler
const path = require("path");

const authPath = require.resolve("../lib/server/auth/getCurrentMongoUser");
require.cache[authPath] = {
  id: authPath,
  filename: authPath,
  loaded: true,
  exports: {
    getCurrentMongoUser: async () => {
      return {
        _id: "60c72b2f9b1d8e2448f8d223", // Valid 24-char ObjectId hex string
        clerkUserId: "mock_clerk_id",
        name: "Test User",
      };
    }
  }
};

const modelsPath = require.resolve("../lib/db/models");
require.cache[modelsPath] = {
  id: modelsPath,
  filename: modelsPath,
  loaded: true,
  exports: {
    UserKeyModel: {
      findOne: () => ({
        lean: () => ({
          userId: "60c72b2f9b1d8e2448f8d223",
          provider: "gemini",
          apiKey: "U2FsdGVkX19P207w91oZJg==", // Mock key
          isActive: true,
        })
      })
    },
    UserModel: {
      findOne: () => ({
        lean: () => ({
          _id: "60c72b2f9b1d8e2448f8d223",
          clerkUserId: "mock_clerk_id",
          name: "Test User",
        })
      })
    }
  }
};

// Mock crypto decrypt helper
const cryptoPath = require.resolve("../lib/crypto");
require.cache[cryptoPath] = {
  id: cryptoPath,
  filename: cryptoPath,
  loaded: true,
  exports: {
    decrypt: () => "mock-api-key",
  }
};

// Now import the POST route and execution entities
import { POST } from "../app/api/ai/chat/route";
import { NextRequest } from "next/server";
import { AICoordinator } from "../lib/ai/coordinator/coordinator";
import { AIProvider } from "../lib/ai/providers/provider";
import { intentClassifier } from "../lib/ai/intents/intent-classifier";

class MockTestProvider implements AIProvider {
  public defaultModel = "mock-provider-flash";
  async generate(prompt: string, options?: any): Promise<string> {
    if (prompt.includes("Allowed intents")) {
      return JSON.stringify({ intent: "planning", confidence: 0.99, reason: "Requesting timeline plan" });
    }
    return "### Recommendations\n- Mocked roadmap recommendations.";
  }
  async routeIntent(prompt: string, intents: string[], options?: any): Promise<string> {
    return "";
  }
  async chat(messages: any[], options?: any): Promise<string> {
    return "";
  }
}

const mockProvider = new MockTestProvider();
intentClassifier.setProvider(mockProvider);

const originalExecute = AICoordinator.prototype.execute;
AICoordinator.prototype.execute = function(input) {
  this.provider = mockProvider;
  this.executor.provider = mockProvider;
  return originalExecute.call(this, input);
};

async function runChatRouteTests() {
  console.log("=== RUNNING CHATBOT API ROUTE INTEGRATION TESTS ===");

  const reqBody = {
    message: "Plan the next sprint",
    projectId: "60c72b2f9b1d8e2448f8d223",
  };

  const request = new NextRequest("http://localhost:3000/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reqBody),
  });

  const res = await POST(request);
  const data = await res.json();

  console.log("\nResponse HTTP Status:", res.status);
  console.log("Response JSON Output:", JSON.stringify(data, null, 2));

  const success = res.status === 200 && data.success && data.data.reply.includes("Mocked roadmap recommendations");
  console.log(success ? "\nROUTE TEST SUCCESS" : "\nROUTE TEST FAILED");

  intentClassifier.resetProvider();
}

runChatRouteTests().catch(console.error);
