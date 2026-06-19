export function isSlackConfigured(): boolean {
  return Boolean(process.env.SLACK_BOT_TOKEN && process.env.SLACK_SIGNING_SECRET);
}

/**
 * Demo/hackathon bridge: maps the Slack workspace to a DevCollab workspace.
 * Replace with OAuth-based mapping in Phase 5.
 */
export function getSlackWorkspaceId(): string {
  const workspaceId = process.env.SLACK_DEFAULT_WORKSPACE_ID?.trim();
  if (!workspaceId) {
    throw new Error(
      "SLACK_DEFAULT_WORKSPACE_ID is not set. Add your DevCollab workspace MongoDB id to .env.local.",
    );
  }
  return workspaceId;
}

export function getAppBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}
