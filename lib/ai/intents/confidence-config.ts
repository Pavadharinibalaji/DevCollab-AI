/**
 * Configuration for Intent Classification Confidence Threshold.
 * Defaults to 0.6 if INTENT_CONFIDENCE_THRESHOLD environment variable is not defined.
 */
export const CONFIDENCE_CONFIG = {
  threshold: parseFloat(process.env.INTENT_CONFIDENCE_THRESHOLD || "0.6"),
};
