import type { App } from "@slack/bolt";

import { buildHelpResponse } from "@/lib/slack/commands/help";
import { buildStatusResponse } from "@/lib/slack/commands/status";

export function registerCommandListeners(app: App) {
  app.command("/devcollab", async ({ command, ack, respond }) => {
    await ack();

    const subcommand = command.text.trim().split(/\s+/)[0]?.toLowerCase() || "help";

    try {
      if (subcommand === "status") {
        await respond(await buildStatusResponse());
        return;
      }

      await respond(buildHelpResponse());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      await respond({
        response_type: "ephemeral",
        text: `DevCollab error: ${message}`,
      });
    }
  });
}
