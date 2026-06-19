import { NextResponse, type NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectMongoose } from "@/lib/db/mongoose";
import { getCurrentMongoUser } from "@/lib/server/auth/getCurrentMongoUser";
import { ProjectModel, TaskModel } from "@/lib/db/models";
import { decrypt } from "@/lib/crypto";
import { UserKeyModel } from "@/models/UserKey";

export const runtime = "nodejs";

function buildContext(args: {
  projectName?: string;
  projectDescription?: string;
  tasks: Array<{ title: string; status?: string; priority?: string }>;
}) {
  const lines: string[] = [];
  lines.push("You are a project-aware assistant inside DevCollab.");
  lines.push("Use the provided project context to answer succinctly and accurately.");

  if (args.projectName) {
    lines.push("");
    lines.push(`Project: ${args.projectName}`);
    lines.push(`Description: ${args.projectDescription || "N/A"}`);
  }

  if (args.tasks.length) {
    lines.push("Tasks:");
    for (const t of args.tasks) {
      const meta = [t.status, t.priority].filter(Boolean).join(", ");
      lines.push(`- ${t.title}${meta ? ` (${meta})` : ""}`);
    }
  }

  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentMongoUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const message = String(body?.message || "").trim();
    const projectId = body?.projectId ? String(body.projectId).trim() : "";

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const conn = await connectMongoose();
    if (!conn) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    let keyDoc = await UserKeyModel.findOne({ userId: String(user._id), isActive: true }).lean();
    if (!keyDoc) {
      keyDoc = await UserKeyModel.findOne({ userId: String(user._id) }).lean();
    }

    if (!keyDoc?.apiKey) {
      return NextResponse.json({ error: "Missing API key. Add your key in settings." }, { status: 400 });
    }

    const provider = keyDoc.provider;
    let apiKey: string;
    try {
      apiKey = decrypt(keyDoc.apiKey);
    } catch {
      return NextResponse.json({ error: `Saved ${provider} API key could not be decrypted. Please re-save it in settings.` }, { status: 400 });
    }

    // Project context (optional, but included when projectId is provided)
    let projectName: string | undefined;
    let projectDescription: string | undefined;
    let tasks: Array<{ title: string; status?: string; priority?: string }> = [];

    if (projectId) {
      try {
        const pObjectId = new mongoose.Types.ObjectId(projectId);
        const projectDoc = await ProjectModel.findById(pObjectId).select("name title description").lean({ virtuals: true });
        if (projectDoc) {
          projectName = (projectDoc as any).title || (projectDoc as any).name;
          projectDescription = (projectDoc as any).description || "";
        }

        const taskDocs = await TaskModel.find({ projectId: pObjectId })
          .sort({ updatedAt: -1 })
          .limit(5)
          .select("title status priority")
          .lean();

        tasks = taskDocs.map((t) => ({
          title: t.title,
          status: t.status,
          priority: t.priority,
        }));
      } catch {
        // If projectId is invalid or not found, proceed without project context.
      }
    }

    const context = buildContext({ projectName, projectDescription, tasks });

    let aiRes: Response;
    if (provider === "anthropic") {
      aiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1024,
          system: context,
          messages: [
            { role: "user", content: message },
          ],
        }),
      });
    } else if (provider === "gemini") {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      aiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system_instruction: { parts: { text: context } },
          contents: [{ role: "user", parts: [{ text: message }] }],
        }),
      });
    } else {
      let url = "https://api.openai.com/v1/chat/completions";
      let modelName = "gpt-4o-mini";

      if (provider === "groq") {
        url = "https://api.groq.com/openai/v1/chat/completions";
        modelName = "llama-3.3-70b-versatile";
      }

      aiRes = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: "system", content: context },
            { role: "user", content: message },
          ],
        }),
      });
    }

    if (!aiRes.ok) {
      const status = aiRes.status;
      let detail = "";
      try {
        detail = await aiRes.text();
      } catch {
        // ignore
      }

      if (status === 401 || status === 403) {
        return NextResponse.json({ error: `Your ${provider} API key was rejected. Please verify it in settings.` }, { status: 400 });
      }

      let errMsg = `${provider} request failed. Please try again.`;
      try {
        const errObj = JSON.parse(detail);
        if (errObj?.error?.message) {
          errMsg = errObj.error.message;
        } else if (errObj?.error?.code === "insufficient_quota" || errObj?.error?.message?.includes("quota")) {
          errMsg = `Your ${provider} account has exceeded its current quota. Please check your plan and billing details.`;
        }
      } catch {
        if (detail) errMsg = detail;
      }

      console.error(`${provider} API error:`, status, detail);
      return NextResponse.json({ error: errMsg }, { status: status >= 400 && status < 600 ? status : 502 });
    }

    const data = await aiRes.json();
    let reply = "";
    if (provider === "anthropic") {
      reply = String(data?.content?.[0]?.text || "").trim();
    } else if (provider === "gemini") {
      reply = String(data?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
    } else {
      reply = String(data?.choices?.[0]?.message?.content || "").trim();
    }

    if (!reply) {
      reply = "I did not get a response. Please try again.";
    }

    return NextResponse.json({ reply }, { status: 200 });
  } catch (err) {
    console.error("POST /api/ai/chat error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

