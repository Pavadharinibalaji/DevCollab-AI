import type { App } from "@slack/bolt";

export function registerActionListeners(app: App) {
  app.action({ type: "block_actions" }, async ({ ack }) => {
    // Day 1: buttons with `url` open DevCollab in the browser; no server action yet.
    await ack();
  });
}
