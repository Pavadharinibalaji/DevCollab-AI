import type { App } from "@slack/bolt";

import { registerActionListeners } from "@/lib/slack/listeners/actions";
import { registerCommandListeners } from "@/lib/slack/listeners/commands";
import { registerEventListeners } from "@/lib/slack/listeners/events";

export function registerSlackListeners(app: App) {
  registerCommandListeners(app);
  registerEventListeners(app);
  registerActionListeners(app);
}
