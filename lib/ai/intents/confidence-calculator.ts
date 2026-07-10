import { IntentResult } from "./intent-result";
import { CONFIDENCE_CONFIG } from "./confidence-config";

/**
 * ConfidenceCalculator evaluates intent classification confidence scores
 * against the configured threshold, determining if a user's request is ambiguous.
 */
export class ConfidenceCalculator {
  /**
   * Returns true if classification confidence meets the configured threshold.
   */
  static meetsThreshold(classification: IntentResult): boolean {
    return classification.confidence >= CONFIDENCE_CONFIG.threshold;
  }

  /**
   * Generates a standard Needs Clarification reply for low-confidence lookups.
   */
  static getClarificationMessage(classification: IntentResult, prompt: string): string {
    return `Needs Clarification: Your request classified as "${classification.intent}" with confidence ${classification.confidence.toFixed(2)}, which is below our minimum threshold of ${CONFIDENCE_CONFIG.threshold.toFixed(2)}. Could you clarify if you meant project planning, code reviews, repository browsing, knowledge searching, risk assessment, or scrum checkins?`;
  }
}
