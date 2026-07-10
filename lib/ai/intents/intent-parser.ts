import { IntentResult, IntentType } from "./intent-types";
import { AgentType } from "../types/agent";

/**
 * Parses and validates raw AI responses into structured IntentResult objects.
 * Handles markdown codeblock wrapper stripping.
 *
 * @param response Raw string response from AI provider.
 * @returns Parsed IntentResult or null if JSON is invalid or fails criteria.
 */
export function parseIntentJSON(response: string): IntentResult | null {
  try {
    if (!response || !response.trim()) return null;

    // Strip markdown formatting if any (e.g. ```json ... ```)
    const cleanJson = response
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/, "")
      .trim();

    const parsed = JSON.parse(cleanJson);
    if (!parsed || typeof parsed !== "object") return null;

    const intent = parsed.intent;
    const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0.0;
    const reasoning = parsed.reason || parsed.reasoning || "No reason specified";

    const allowedIntents: IntentType[] = [
      "planning",
      "repository",
      "knowledge",
      "risk",
      "code",
      "scrum",
      "general",
      "unknown",
    ];

    if (!allowedIntents.includes(intent as IntentType)) {
      return null;
    }

    const mappedIntent = intent as IntentType;

    // suggestedAgent mapping
    let suggestedAgent: AgentType | undefined;
    if (
      mappedIntent !== "general" &&
      mappedIntent !== "unknown"
    ) {
      suggestedAgent = mappedIntent as AgentType;
    }

    return {
      intent: mappedIntent,
      confidence,
      reasoning,
      suggestedAgent,
    };
  } catch (err) {
    return null;
  }
}
