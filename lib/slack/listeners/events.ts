import type { App } from "@slack/bolt";

export function registerEventListeners(app: App) {
  app.event("app_mention", async ({ event, say }) => {
    await say({
      text: "DevCollab is online. Try `/devcollab status` to see your active projects.",
      thread_ts: "thread_ts" in event ? event.thread_ts : event.ts,
    });
  });
}
