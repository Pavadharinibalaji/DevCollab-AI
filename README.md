# 🚀 DevCollab — AI-Powered Real-Time Developer Collaboration SaaS

> **Empowering development teams to brainstorm, organize, and execute with AI assistance and real-time synchronization.**

---

## 🌟 The Vision

In the modern software development landscape, speed and coordination are paramount. DevCollab is designed to bridge the gap between project organization, team communication, and intelligent guidance. By blending real-time Kanban workspaces with an AI development copilot, DevCollab provides developer teams with a unified workspace that eliminates context switching and drives productivity from code brainstorming to final deployment.

---

## 📋 Table of Contents
1. [Overview](#-overview)
2. [Key Features](#-key-features)
3. [Tech Stack](#-tech-stack)
4. [System Architecture](#-system-architecture)
5. [Installation & Setup](#-installation--setup)
6. [Environment Variables](#-environment-variables)
7. [AI Integration](#-ai-integration)
8. [Future Roadmap](#-future-roadmap)
9. [Deployment](#-deployment)
10. [Team & Contributions](#-team--contributions)
11. [License](#-license)

---

## 🔍 Overview

DevCollab is a modern, dark-themed SaaS platform tailored for engineering teams and student developers. It serves as a central hub where teams can form workspaces, design projects, track tasks on a dynamic Kanban board, chat via Socket.io channels, and leverage an integrated AI developer assistant (DevBot) powered by Llama 3.3.

Designed with **Next.js 15**, **TypeScript**, and **Tailwind CSS v4**, the application delivers a premium, fast, and responsive user experience. 

---

## ✨ Key Features

| Feature | Description | Status |
| :--- | :--- | :---: |
| **Workspace Isolation** | Create, manage, and isolate workspaces with custom URL slugs and unified settings. | `Completed` |
| **Clerk Authentication** | Enterprise-grade security with phone, email, and social login, including highly visible OTP flow. | `Completed` |
| **Kanban Project Boards** | High-performance task workflow supporting drag-and-drop mechanics (dnd-kit) and statuses. | `Completed` |
| **Task Details & Comments** | Rich-text task descriptions, due date tracking, custom tags, and threaded discussion boards. | `Completed` |
| **Team Invites & Roles** | Invite members using encrypted tokens; define roles like Admin and Member. | `Completed` |
| **DevBot AI Assistant** | Instant developer help, DSA solving, code optimization, and context-aware platform advice. | `Completed` |
| **Real-Time Logging** | Audit trail of member activities, workspace modifications, and task updates. | `Completed` |
| **AI Workspace Agent** | Auto-generating tasks, project summaries, and intelligent roadmap scheduling based on logs. | `In Progress` |

---

## 🛠️ Tech Stack

### Frontend
*   **Next.js 15 (App Router)** — Dynamic server rendering, optimized bundle sizes, and robust routing.
*   **TypeScript** — Strongly typed codebase for clean, maintainable development.
*   **Tailwind CSS v4** — High-performance utility styles using CSS-first config and premium dark mode palettes.
*   **dnd-kit** — Dynamic, lightweight drag-and-drop primitives for Kanban boards.
*   **Radix UI** — Accessible, unstyled component primitives (dialogs, select dropdowns, etc.).

### Backend & Services
*   **Next.js Route Handlers** — Optimized, stateless REST API endpoints.
*   **Clerk Auth** — Comprehensive authentication and user profile management.
*   **Socket.io** — Real-time event communication for chat channels and board updates.
*   **MongoDB & Mongoose** — Schema definition, relationships, and indexing for highly flexible data representation.
*   **Redis** — Sub-millisecond performance cache layer for sessions and rate limiting.

---

## 🏗️ System Architecture

DevCollab follows a highly structured, scalable architecture that isolates layout layers without complicating routing paths:

```
├── app/                    # Next.js App Router Pages, Layouts, and API Routes
│   ├── (auth)/             # Auth route group (sign-in, sign-up flows)
│   ├── (dashboard)/        # Main workspace dashboard & layout shell
│   └── api/                # REST endpoints (health checks, invites, projects, tasks, chat)
├── components/             # UI Components
│   ├── layout/             # Topbar, Sidebars, Dashboard shell
│   ├── shared/             # Custom page-level blocks
│   ├── chatbot/            # DevBot AI chat drawer
│   ├── kanban/             # Drag-and-drop project boards
│   └── ui/                 # Reusable primitive blocks (buttons, dialogs, dropdowns)
├── services/               # Data Access Object (DAO) service layer
├── lib/                    # Shared databases, utility classes, and server configurations
└── types/                  # Shareable TypeScript domain models
```

*   **Service Layer**: All database queries are abstracted into decoupled service modules (e.g., `workspace.service.ts`), ensuring UI pages remain thin and pure.
*   **Route Isolation**: The `(auth)` and `(dashboard)` route groups keep core authorization boundaries separated cleanly at the directory level.

---

## ⚙️ Installation & Setup

Follow these steps to run DevCollab locally on your machine:

### Prerequisites
*   **Node.js** (v18.x or later)
*   **MongoDB** (Local instance or MongoDB Atlas Connection URI)
*   **Redis Server** (Local instance or Upstash Connection URI)
*   **Groq API Key** (For powering DevBot)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/DevCollab.git
cd DevCollab
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
Create a `.env.local` file in the root directory and configure the variables (see [Environment Variables](#-environment-variables) below).

### 4. Start the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view your local deployment.

---

## 🔑 Environment Variables

Copy the `.env.example` file and fill in your keys:

```ini
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://127.0.0.1:27017/devcollab

# Clerk Authentication Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk Route Hooks
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Caching and Real-time Communication
REDIS_URL=redis://localhost:6379

# AI Core Engine
GROQ_API_KEY=gsk_...
```

---

## 🤖 AI Integration

DevCollab features **DevBot**, a floating AI developer assistant integrated directly into the workspace shell:

```
[User Message] ──> [API Endpoint /api/chat] ──> [Groq Llama-3.3-70B model] ──> [Streamed SSE Response]
```

*   **Groq API Speed**: Powered by `llama-3.3-70b-versatile` through Groq, ensuring responses stream back instantly (sub-100ms first token latency).
*   **Developer Guardrails**: Pre-prompted to handle code optimization, clean system walkthroughs, and assist with complex DSA logic directly inside the project dashboard.
*   **Streamed UI Responses**: Utilizes Server-Sent Events (SSE) to render incoming text in real time, creating an interactive, chat-ready workspace helper.

---

## 🗺️ Future Roadmap

1.  **AI Project Roadmaps**: Introduce an intelligent agent to parse project description backlogs and automatically seed Kanban sprints with estimated tasks.
2.  **Interactive Video/Audio Rooms**: Build voice channels using WebRTC so developers can collaborate inside the workspace without opening external software.
3.  **Local-First Offline Support**: Enable CRDT-based offline database persistence (via IndexDB) for uninterrupted workspace activity.
4.  **Mobile Companion App**: Responsive native app built on React Native for task tracking on the go.

---

## 🚀 Deployment

### Deploy to Vercel

The easiest way to deploy your DevCollab Next.js application is to use the Vercel Platform:

1.  Push your code to GitHub.
2.  Import your repository on Vercel.
3.  Add all the variables specified in your `.env.local` to the Vercel project environment settings.
4.  Set the Build Command to `npm run build`.
5.  Click **Deploy**.

---

## 👥 Team & Contributions

DevCollab is built by a dedicated group of developers aiming to streamline engineering productivity. Contributions are highly appreciated!

### How to Contribute:
1.  Fork the Repository.
2.  Create a Feature Branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the Branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
