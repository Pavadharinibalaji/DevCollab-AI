import type { KnownBlock } from "@slack/types";

const HELP_BLOCKS: KnownBlock[] = [
  {
    type: "header",
    text: { type: "plain_text", text: "DevCollab for Slack", emoji: true },
  },
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text: [
        "*Available commands*",
        "• `/devcollab` or `/devcollab help` — show this message",
        "• `/devcollab status` — project summaries from your linked workspace",
        "",
        "*Coming soon (Day 2+)*",
        "• `/devcollab task <description>` — create a task with AI",
        "• `/devcollab standup` — daily standup report",
        "• `/devcollab overdue` — overdue tasks",
        "• Mention `@DevCollab` in a channel for natural-language requests",
      ].join("\n"),
    },
  },
];

export function buildHelpResponse() {
  return {
    response_type: "ephemeral" as const,
    text: "DevCollab for Slack — help",
    blocks: HELP_BLOCKS,
  };
}
