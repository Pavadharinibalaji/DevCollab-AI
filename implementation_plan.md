# DevCollab × Slack Agent — Hackathon Implementation Plan
## Slack Agent Builder Challenge (Deadline: July 14, 2026)

DevCollab already has a strong foundation — AI, real-time, task management, workspaces.
The goal is to add a **Slack Agent layer** that makes DevCollab accessible directly from Slack,
transforming it from a "dashboard you visit" into an **agent that works for you inside Slack**.

---

## 🏆 Track & Technology Choice

| Decision | Choice | Reason |
|---|---|---|
| **Track** | New Slack Agent | Best fit — DevCollab is a new agent, not an existing Marketplace app |
| **Primary Technology** | **MCP Server Integration** | Most technically impressive, differentiates from basic bots |
| **Secondary Technology** | **Slack AI Capabilities** | Use Slack's native AI UI (Assistant panel) for polish |

### Why MCP is the winning angle
- MCP (Model Context Protocol) is the hottest AI standard right now — judges will love it
- DevCollab becomes an **MCP server** exposing its data as tools
- Slack's AI Agent uses DevCollab tools to reason and act
- Makes DevCollab extensible to ANY MCP-compatible client (Claude Desktop, Cursor, etc.) — not just Slack
- This positions the project as infrastructure, not just a feature

---

## User Review Required

> [!IMPORTANT]
> Please confirm the following before we start building:
> 1. Do you want to target **"New Slack Agent"** track (recommended), or also aim for **"Slack Agent for Organizations"** (requires submitting to Slack Marketplace)?
> 2. Do you have a **Slack workspace** where we can test the bot during development?
> 3. Should the MCP server be a **separate Express/Node service** or embedded in the **Next.js API routes**? (Embedded is simpler for the hackathon)

> [!WARNING]
> We have ~27 days until the deadline. The scope below is achievable but we should prioritize Phase 1-3 to have a working demo. Phases 4-5 are polish/bonus.

---

## 🏗️ Proposed Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    SLACK WORKSPACE                        │
│  ┌─────────────────┐    ┌──────────────────────────┐     │
│  │  Slash Commands │    │  Slack AI Assistant Panel │     │
│  │  /devcollab ... │    │  (@DevCollab mention)     │     │
│  └────────┬────────┘    └────────────┬─────────────┘     │
└───────────┼─────────────────────────┼────────────────────┘
            │ Bolt SDK (HTTP Events)  │
            ▼                         ▼
┌──────────────────────────────────────────────────────────┐
│              DEVCOLLAB NEXT.JS APP                        │
│                                                           │
│  /api/slack/events  ──→  Bolt App Handler                 │
│  /api/slack/actions ──→  Block Kit Interactions           │
│                                                           │
│  ┌────────────────────────────────────────────┐          │
│  │           SLACK AGENT CORE                 │          │
│  │  (Groq Llama 3.3 + Tool Calling Loop)      │          │
│  │                                            │          │
│  │  Tools (MCP-compatible):                   │          │
│  │  • create_task(title, priority, assignee)  │          │
│  │  • list_tasks(projectId, status)           │          │
│  │  • update_task_status(taskId, newStatus)   │          │
│  │  • get_project_summary(projectId)          │          │
│  │  • generate_standup(workspaceId)           │          │
│  │  • list_team_members(workspaceId)          │          │
│  └────────────────────────────────────────────┘          │
│                                                           │
│  /api/mcp  ──→  MCP Server (JSON-RPC over HTTP)          │
│                                                           │
│  Existing: MongoDB | Redis | Socket.io | Groq            │
└──────────────────────────────────────────────────────────┘
            │
            ▼  Webhooks
┌───────────────────────┐
│  DevCollab Events     │
│  Task Created/Done    │──→  Slack Channel Notification
│  Overdue Tasks        │──→  DM to Assignee
│  Project Milestone    │──→  Slack Announcement
└───────────────────────┘
```

---

## 📦 New Dependencies

```bash
npm install @slack/bolt @slack/web-api
```

That's it. The MCP server will be implemented manually using JSON-RPC over HTTP (no heavy SDK needed), keeping it lightweight.

---

## Proposed Changes

### Phase 1 — Slack App Foundation (Day 1-2)

#### [NEW] `app/api/slack/events/route.ts`
Main Bolt event receiver — all Slack events (messages, app_mentions, slash commands) arrive here.
Uses `processBeforeResponse: true` for serverless compatibility.

#### [NEW] `app/api/slack/actions/route.ts`
Handles Block Kit interactive button clicks (e.g., "Mark Done", "Assign", "View in DevCollab").

#### [NEW] `lib/slack/bolt-app.ts`
Singleton Bolt `App` instance with signing secret + bot token. Registers all event listeners.

#### [NEW] `lib/slack/slack-client.ts`
Typed wrapper around `@slack/web-api` WebClient for sending notifications, DMs, and posting messages.

#### [MODIFY] `.env.local` / `.env.example`
Add:
```ini
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_APP_TOKEN=xapp-... (for Socket Mode in dev)
```

---

### Phase 2 — The AI Agent Core (Day 2-4) ⭐ MOST IMPORTANT

#### [NEW] `lib/slack/agent/tools.ts`
Defines all agent tools as structured functions:
```typescript
const DEVCOLLAB_TOOLS = [
  {
    name: "create_task",
    description: "Create a new task in a DevCollab project",
    parameters: { title, priority, assigneeId, projectId, dueDate }
  },
  {
    name: "list_tasks",
    description: "List tasks filtered by project, status, or assignee",
    parameters: { projectId, status, assigneeId }
  },
  {
    name: "update_task_status",
    description: "Move a task to a new status column",
    parameters: { taskId, newStatus }
  },
  {
    name: "get_project_summary",
    description: "Get a summary of a project including progress and overdue tasks",
    parameters: { projectId }
  },
  {
    name: "generate_standup",
    description: "Generate a daily standup report for the whole workspace",
    parameters: { workspaceId }
  },
  {
    name: "list_team_members",
    description: "Get team members in the workspace with their current task load",
    parameters: { workspaceId }
  }
]
```

#### [NEW] `lib/slack/agent/agent-loop.ts`
The agentic reasoning loop:
1. Receive user message from Slack
2. Send to Groq Llama 3.3 with tool definitions
3. LLM decides which tool(s) to call
4. Execute tool → hit DevCollab service layer
5. Send result back to LLM
6. Loop until LLM produces a final text response
7. Format and send back to Slack

Conversation history stored in **Redis** (already in stack!) keyed by `slack_thread_ts`.

#### [NEW] `lib/slack/agent/formatters.ts`
Converts DevCollab data (tasks, projects, standup) into **Slack Block Kit** JSON for rich message formatting.

---

### Phase 3 — Slash Commands (Day 3-4)

| Command | Behavior |
|---|---|
| `/devcollab` | Shows interactive help card with all commands |
| `/devcollab task <description>` | Agent parses NL → creates task, responds with task card |
| `/devcollab status` | Shows active project summary cards |
| `/devcollab standup` | AI-generated daily standup from all workspace tasks |
| `/devcollab overdue` | Lists all overdue tasks with assignees |
| `/devcollab assign @user <task>` | AI resolves user + task → updates assignee |

#### [NEW] `lib/slack/commands/` (one file per command)

---

### Phase 4 — MCP Server (Day 4-5) ⭐ HACKATHON DIFFERENTIATOR

#### [NEW] `app/api/mcp/route.ts`
A standards-compliant MCP server over HTTP (JSON-RPC 2.0).
Exposes DevCollab tools so ANY MCP client (Claude Desktop, Cursor, other Slack agents) can use DevCollab.

```
POST /api/mcp
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": { "name": "create_task", "arguments": {...} },
  "id": 1
}
```

This is what makes the submission hit the **"MCP server integration"** requirement strongly.

#### [NEW] `lib/mcp/mcp-server.ts`
MCP protocol handler — parses JSON-RPC, routes to DevCollab service layer, returns results.

#### [NEW] `lib/mcp/tool-definitions.ts`
Shared tool schema used by both the Slack agent AND the MCP server (single source of truth).

---

### Phase 5 — DevCollab → Slack Notifications (Day 5-6)

#### [MODIFY] `app/api/tasks/route.ts` (and other task endpoints)
After creating/updating tasks, fire a webhook event.

#### [NEW] `lib/slack/notifications/task-notifications.ts`
- Task created → post to project's linked Slack channel
- Task moved to "done" → celebrate in channel
- Task overdue → DM the assignee

#### [NEW] `app/(dashboard)/dashboard/settings/page.tsx` (MODIFY)
Add a "Slack Integration" section to workspace settings:
- Connect Slack workspace (OAuth)
- Map DevCollab projects → Slack channels
- Configure notification preferences

#### [NEW] `app/api/slack/oauth/route.ts`
Handles Slack OAuth flow for connecting a workspace.

---

### Phase 6 — DevCollab UI Enhancements (Day 6-7)

#### [MODIFY] `components/layout/sidebar-content.tsx`
Add "Slack Connected" indicator badge in the sidebar.

#### [NEW] `components/shared/slack-connect-banner.tsx`
Banner on the dashboard if Slack isn't connected yet — "Connect Slack to get AI updates in your channels."

---

## 🎯 The Demo Script (Hackathon Video)

1. Open Slack → type `/devcollab standup` → Agent generates beautiful standup from real DevCollab data
2. Type in Slack: *"Create an urgent task to fix the login bug, assign it to Sarah, due tomorrow"* → Agent creates the task in DevCollab + posts confirmation card
3. Switch to DevCollab → show the task appeared on the Kanban board in real-time
4. Mark the task done in DevCollab → Slack celebrates in the team channel automatically
5. Show `/api/mcp` endpoint → demonstrate it's a real MCP server any client can use

---

## ✅ Verification Plan

### Automated
- Unit tests for agent tool execution
- MCP server JSON-RPC response validation

### Manual
- Full Slack bot interaction in a test workspace
- Slash command round-trip testing
- Webhook delivery verification for task events
- MCP server curl tests for all tools

---

## 📅 Timeline

| Days | Milestone |
|---|---|
| Day 1-2 | Slack App setup, Bolt integration, event handler |
| Day 2-4 | AI Agent core (tool calling loop + Redis memory) |
| Day 3-4 | Slash commands |
| Day 4-5 | MCP server |
| Day 5-6 | Notifications (DevCollab → Slack) |
| Day 6-7 | UI polish + Slack OAuth settings |
| Day 8+ | Testing, demo video, Devpost submission |
