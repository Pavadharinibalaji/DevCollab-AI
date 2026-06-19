import { App } from "@slack/bolt";
import { VercelReceiver } from "@vercel/slack-bolt";

import { isSlackConfigured } from "@/lib/slack/config";
import { registerSlackListeners } from "@/lib/slack/listeners";

type SlackBoltGlobals = {
  slackApp?: App;
  slackReceiver?: VercelReceiver;
};

const globalForSlack = globalThis as typeof globalThis & SlackBoltGlobals;

function createSlackBolt() {
  if (!isSlackConfigured()) {
    throw new Error(
      "Slack is not configured. Set SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET in .env.local.",
    );
  }

  const receiver = new VercelReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
  });

  const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    receiver,
    deferInitialization: true,
  });

  registerSlackListeners(app);

  return { app, receiver };
}

export function getSlackBolt() {
  if (!globalForSlack.slackApp || !globalForSlack.slackReceiver) {
    const created = createSlackBolt();
    globalForSlack.slackApp = created.app;
    globalForSlack.slackReceiver = created.receiver;
  }

  return {
    app: globalForSlack.slackApp,
    receiver: globalForSlack.slackReceiver,
  };
}
