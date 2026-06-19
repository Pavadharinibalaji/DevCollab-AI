import { createHandler } from "@vercel/slack-bolt";
import { NextResponse } from "next/server";

import { getSlackBolt } from "@/lib/slack/bolt-app";
import { isSlackConfigured } from "@/lib/slack/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function slackNotConfiguredResponse() {
  return NextResponse.json(
    { error: "Slack is not configured. Set SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET." },
    { status: 503 },
  );
}

export async function POST(req: Request) {
  if (!isSlackConfigured()) {
    return slackNotConfiguredResponse();
  }

  const { app, receiver } = getSlackBolt();
  const handler = createHandler(app, receiver);
  return handler(req);
}
