import { IntentClassificationStrategy, IntentType } from "./intent-types";
import { IntentResult } from "./intent-result";
import { AIRequest } from "../types/request";
import { AgentType } from "../types/agent";

interface IntentRule {
  intent: IntentType;
  keywords: string[];
  suggestedAgent?: AgentType;
}

/**
 * Deterministic keyword-based classification strategy (Phase 1).
 *
 * Scans the request prompt for predefined keywords associated with each intent type.
 * Computes a simple matching score to resolve the most appropriate intent.
 */
export class KeywordIntentClassificationStrategy
  implements IntentClassificationStrategy
{
  private rules: IntentRule[] = [
    {
      intent: "planning",
      suggestedAgent: "planning",
      keywords: [
        "plan",
        "planning",
        "roadmap",
        "milestone",
        "sprint",
        "schedule",
        "gantt",
        "timeline",
        "breakdown",
        "todo",
        "kanban",
        "task list",
        "user story",
        "epics",
      ],
    },
    {
      intent: "repository",
      suggestedAgent: "repository",
      keywords: [
        "repo",
        "repository",
        "github",
        "commit",
        "branch",
        "pull request",
        "pr",
        "clone",
        "git",
        "file tree",
        "codebase structure",
        "directory",
        "files",
      ],
    },
    {
      intent: "knowledge",
      suggestedAgent: "knowledge",
      keywords: [
        "docs",
        "documentation",
        "wiki",
        "explain",
        "reference",
        "search papers",
        "arxiv",
        "concept",
        "what is",
        "literature",
        "uniprot",
        "chembl",
        "pubmed",
        "clinical trial",
        "biology",
        "protein",
      ],
    },
    {
      intent: "risk",
      suggestedAgent: "risk",
      keywords: [
        "risk",
        "vulnerability",
        "security",
        "bottleneck",
        "delay",
        "threat",
        "audit",
        "safety",
        "bug prone",
        "dependency check",
        "mitigate",
        "hazard",
      ],
    },
    {
      intent: "code",
      suggestedAgent: "code",
      keywords: [
        "code",
        "write",
        "function",
        "class",
        "refactor",
        "optimize",
        "debug",
        "compile",
        "syntax",
        "typescript",
        "javascript",
        "implement",
        "snippet",
        "algorithm",
      ],
    },
    {
      intent: "scrum",
      suggestedAgent: "scrum",
      keywords: [
        "standup",
        "daily",
        "scrum",
        "burndown",
        "blocker",
        "velocity",
        "update",
        "progress report",
        "slack standup",
        "stand-up",
      ],
    },
    {
      intent: "general",
      keywords: [
        "hello",
        "hi",
        "hey",
        "how are you",
        "help",
        "greet",
        "assistant",
        "who are you",
      ],
    },
  ];

  async classify(request: AIRequest): Promise<IntentResult> {
    const prompt = request.prompt.toLowerCase();
    const scores = new Map<IntentType, number>();

    // Initialize scores
    for (const rule of this.rules) {
      scores.set(rule.intent, 0);
    }

    // Calculate matches
    const matchedKeywords: Record<string, string[]> = {};
    for (const rule of this.rules) {
      const matches: string[] = [];
      for (const keyword of rule.keywords) {
        if (prompt.includes(keyword)) {
          matches.push(keyword);
        }
      }
      if (matches.length > 0) {
        scores.set(rule.intent, matches.length);
        matchedKeywords[rule.intent] = matches;
      }
    }

    // Find highest scoring intent
    let bestIntent: IntentType = "unknown";
    let highestScore = 0;

    for (const [intent, score] of scores.entries()) {
      if (score > highestScore) {
        highestScore = score;
        bestIntent = intent;
      }
    }

    // Determine confidence and reasoning
    let confidence = 0.0;
    let reasoning = "";
    let suggestedAgent: AgentType | undefined;

    if (bestIntent === "unknown" || highestScore === 0) {
      bestIntent = "unknown";
      confidence = 0.2;
      reasoning = "No matching keywords were detected in the prompt.";
    } else {
      const matchingRule = this.rules.find((r) => r.intent === bestIntent);
      suggestedAgent = matchingRule?.suggestedAgent;

      // Assign confidence based on strength of match
      if (highestScore >= 3) {
        confidence = 0.9;
      } else if (highestScore === 2) {
        confidence = 0.75;
      } else {
        confidence = 0.55;
      }

      reasoning = `Classified as "${bestIntent}" because the following keywords matched: [${matchedKeywords[bestIntent].join(", ")}] (score: ${highestScore}).`;
    }

    return {
      intent: bestIntent,
      confidence,
      reasoning,
      suggestedAgent,
    };
  }
}
