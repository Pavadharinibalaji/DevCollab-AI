# 👥 Team Responsibilities & Governance

> **DevCollab AI Workspace Intelligence Agent — Hackathon Collaboration Framework**

---

## 🏗️ Team Structure

To ensure a smooth, execution-focused workflow for the Slack Agent Builder Challenge, our team of four is organized into distinct, collaborative roles covering product architecture, backend integration, user interface endpoints, and system assurance.

| Team Member | Hackathon Role | Primary Domain Focus |
| :--- | :--- | :--- |
| **Pavadharini B G** | Product Lead & AI Agent Architect | Product vision, Agent reasoning loop, core MCP architecture, system integration. |
| **Sakthi Sanjay** | Backend & MCP Integration Lead | PostgreSQL/Prisma database schema, API routing, Clerk security, third-party MCP endpoints. |
| **Gokul** | Slack & Frontend Lead | Slack Bolt SDK integration, Home Tab UI, web administration dashboard layout. |
| **Sanjana** | QA, Prompt Engineering & Documentation Lead | LLM instructions, guardrails, automated/manual tests, final documentation. |

---

## 📋 Roles and Responsibilities

### 1. Pavadharini B G
**Role:** Product Lead & AI Agent Architect
*   **Product Vision:** Establishes feature roadmaps, aligns scope with hackathon judging criteria, and approves design choices.
*   **Architecture Design:** Structures the multi-tenant design, defines the internal service boundary layers, and oversees system dataflow.
*   **AI Workflow Design:** Implements the reasoning loops, tool-calling pipelines, and session management contexts.
*   **System Integration:** Coordinates the assembly of the Slack Bolt handler with core database services and MCP gateways.
*   **Documentation & Final Submission:** Leads the final Devpost submission write-up, README guidelines, and slide decks.
*   **Demo Preparation:** Directs the recording, editing, and voiceover for the project walk-through video.
*   **Team Coordination:** Unifies frontend, backend, and QA timelines to prevent project drift.

### 2. Sakthi Sanjay
**Role:** Backend & MCP Integration Lead
*   **Session Management & Auth:** Fixes backend session caching, secures Clerk authentication boundaries, and maintains tenant isolation.
*   **Backend APIs:** Constructs clean, TypeScript-safe REST endpoints for task, workspace, and project operations.
*   **Database Management:** Owns the PostgreSQL schema, migrations, and Prisma ORM indexing for low-latency queries.
*   **MCP Server Integration:** Configures the JSON-RPC HTTP server to safely expose internal tools to external hosts (GitHub/Google Drive).
*   **Performance Optimization:** Handles Redis query caching, database pooling, and bundle optimizations to maintain quick response times.

### 3. Gokul
**Role:** Slack & Frontend Lead
*   **Slack App Development:** Configures the Slack API portal, event subscriptions, interactive block callbacks, and webhooks.
*   **Slack Commands & Workflows:** Programs slash commands (`/devcollab`, `/devcollab standup`) and Bolt listener events.
*   **Frontend UI:** Polishes Next.js admin dashboards, integrates responsive design components, and designs task management boards.
*   **Bug Resolution:** Resolves design regressions, layout overlaps, and dashboard interaction bottlenecks.

### 4. Sanjana
**Role:** QA, Prompt Engineering & Documentation Lead
*   **Quality Assurance & Testing:** Formulates end-to-end user flows, test cases, and verifies api-route security.
*   **Prompt Engineering:** Crafts instructions and guardrails for the agent core (Groq/OpenAI/Gemini models) to prevent prompt injection or halluncination.
*   **Bug Tracking:** Logs, prioritizes, and tracks system bugs and exceptions in the team backlog.
*   **User Acceptance Testing (UAT):** Conducts dry runs simulating real developer interactions inside test Slack workspaces.
*   **Documentation Support:** Writes user guides, feature checklists, and API contract files.

---

## 🎛️ Ownership Matrix (RACI)

The RACI matrix details who is **R**esponsible, **A**ccountable, **C**onsulted, and **I**nformed for each critical component:

*   **R**esponsible (R): The person who executes the work.
*   **A**ccountable (A): The person with final decision-making power and veto authority.
*   **C**onsulted (C): Subject matter experts who provide input.
*   **I**nformed (I): Those kept up-to-date on progress or outcomes.

| Core Project Component | Pavadharini | Sakthi | Gokul | Sanjana |
| :--- | :---: | :---: | :---: | :---: |
| **AI Agent Loop & MCP Spec** | **A** / **R** | **C** | **I** | **C** |
| **Slack App & Command Handler** | **C** | **I** | **A** / **R** | **I** |
| **DB Schemas & Prisma Migrations** | **C** | **A** / **R** | **I** | **I** |
| **Next.js Dashboard & Frontend** | **I** | **C** | **A** / **R** | **I** |
| **Prompt Engineering & System Prompts** | **C** | **I** | **I** | **A** / **R** |
| **Quality Assurance & Security Auditing**| **I** | **C** | **C** | **A** / **R** |
| **Demo Video & Pitch Deck** | **A** / **R** | **I** | **I** | **R** |
| **Final Devpost Submission** | **A** / **R** | **C** | **C** | **R** |

---

## 📦 Expected Deliverables

```
[Phase 1] ──> [Phase 2] ──> [Phase 3] ──> [Phase 4]
Setup         Agent Core    Integration   QA & Submission
```

### Phase 1: Setup & Foundations (Milestone 1)
*   **Pavadharini:** System architecture layout, workspace schema approvals.
*   **Sakthi:** PostgreSQL database initialized, Prisma schemas generated, Clerk Auth integrated.
*   **Gokul:** Slack App manifest created, basic Bolt server listener running.
*   **Sanjana:** Test suite setup, initial developer guidelines draft.

### Phase 2: Agent Reasoning & Core Tooling (Milestone 2)
*   **Pavadharini:** Agent loop algorithm with context-aware tool routing.
*   **Sakthi:** REST endpoints for task CRUD and MCP server gateway routes.
*   **Gokul:** Slash command routing, Block Kit templates for tasks, standups, and metrics.
*   **Sanjana:** Prompts optimized for task extraction and code recommendations.

### Phase 3: Live Integrations (Milestone 3)
*   **Pavadharini:** Final integration testing of database state with Slack notifications.
*   **Sakthi:** Integration of GitHub and Google Drive MCP servers.
*   **Gokul:** Next.js workspace settings console connecting to Slack channels.
*   **Sanjana:** Penetration checks, error-recovery evaluation, documentation updates.

### Phase 4: Verification & Release (Milestone 4)
*   **Pavadharini:** Final codebase lock, scriptwriting for demo video, recording core walk-throughs.
*   **Sakthi:** Performance tuning, SQL indexes verification, production environment configurations.
*   **Gokul:** Final UI polish across Admin pages and mobile Slack displays.
*   **Sanjana:** Complete system dry-run, bug resolution verification, submission assets compilation.

---

## 💬 Communication Plan

We maintain high-bandwidth communication across these official channels:

*   **Slack Channels:**
    *   `#announcements`: Key milestones, deadlines, and project scope approvals.
    *   `#dev-backend`: Schema adjustments, API endpoints, MCP updates.
    *   `#dev-frontend`: Slack Block Kit styling, dashboard design, UI assets.
    *   `#qa-bugs`: Bug reports, LLM prompt refinement logs, test outcomes.
*   **Virtual Syncs:**
    *   **Standups:** Daily sync (15 mins) via Slack Huddles.
    *   **Milestone Reviews:** Every Wednesday & Saturday (45 mins) to review code reviews, merge branches, and update the master plan.
*   **Version Control:**
    *   All code changes must route through GitHub Pull Requests.
    *   PRs require at least one approval from a lead in that domain before merging (e.g., Sakthi reviews database PRs; Gokul reviews frontend/Slack PRs).

---

## ⏱️ Daily Standup Format

To keep meetings brief and focused, each member answers the following three questions:

1.  **What did I accomplish yesterday?** (Focus on completed tickets/features)
2.  **What will I work on today?** (Focus on immediate next tasks)
3.  **Are there any blockers preventing progress?** (Highlight any dependencies or technical hurdles)

> [!TIP]
> Keep updates strictly under 3 minutes per person. If a blocker requires deep troubleshooting, schedule a separate technical breakout session immediately after the standup.

---

## ⚖️ Project Governance

*   **Branching Strategy:**
    *   We use a Git branching workflow: `main` (production-ready release branch), `dev` (integration branch), and feature branches (`feature/your-feature-name` or `bugfix/issue-name`).
    *   Direct pushes to `main` and `dev` are protected. All code must be merged via Pull Requests.
*   **Code Review Standard:**
    *   PRs must compile successfully and pass basic linting steps before review.
    *   Reviewers check for:
        *   Security leaks (e.g., hardcoded API keys).
        *   Workspace tenant isolation checks.
        *   Proper error logging and performance impacts.
*   **Conflict Resolution:**
    *   **Technical Disputes:** Technical decisions (e.g., database schema vs. API designs) are decided by Sakthi (Backend Lead) or Gokul (Frontend Lead) depending on the area.
    *   **Scope & Product Disputes:** The final authority on scope cutting or feature prioritization lies with Pavadharini (Product Lead).
    *   **Prompt/UX Disputes:** Issues surrounding prompt quality or message presentation are resolved by Sanjana (QA/Prompt Lead).
