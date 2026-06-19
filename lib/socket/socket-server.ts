import http from "http";
import type { Server as HTTPServer } from "http";
import { Server as IOServer, type Server } from "socket.io";
import type { Socket } from "socket.io";

import {
  CLIENT_SOCKET_EVENTS,
  TASK_SOCKET_EVENTS,
  type JoinProjectPayload,
  type TaskCreatedPayload,
  type TaskDeletedPayload,
  type TaskMovedPayload,
  type TaskUpdatedPayload,
} from "@/events/task-events";

const LOG_PREFIX = "[socket:server]";

type SocketGlobal = typeof globalThis & {
  __socket_io_server?: Server;
  __socket_http_server?: HTTPServer;
  __socket_embedded_started?: boolean;
};

const g = globalThis as SocketGlobal;

export function projectRoomId(projectId: string): string {
  return `project:${projectId}`;
}

function logInfo(message: string, meta?: Record<string, unknown>) {
  if (meta) {
    console.info(`${LOG_PREFIX} ${message}`, meta);
  } else {
    console.info(`${LOG_PREFIX} ${message}`);
  }
}

function logWarn(message: string, meta?: Record<string, unknown>) {
  if (meta) {
    console.warn(`${LOG_PREFIX} ${message}`, meta);
  } else {
    console.warn(`${LOG_PREFIX} ${message}`);
  }
}

function getCorsOrigins(): string | string[] | boolean {
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? process.env.SOCKET_CORS_ORIGIN;
  if (!origin) return true;
  if (origin.includes(",")) return origin.split(",").map((s) => s.trim());
  return origin;
}

function registerConnectionHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    logInfo("client connected", { socketId: socket.id });

    socket.on("disconnect", (reason) => {
      logInfo("client disconnected", { socketId: socket.id, reason });
    });

    socket.on(CLIENT_SOCKET_EVENTS.joinProject, (payload: JoinProjectPayload) => {
      if (!payload?.projectId || typeof payload.projectId !== "string") {
        logWarn("invalid joinProject payload", { socketId: socket.id });
        return;
      }
      const room = projectRoomId(payload.projectId);
      void socket.join(room);
      logInfo("socket joined project room", { socketId: socket.id, room });
    });

    socket.on(CLIENT_SOCKET_EVENTS.leaveProject, (payload: JoinProjectPayload) => {
      if (!payload?.projectId) return;
      const room = projectRoomId(payload.projectId);
      void socket.leave(room);
      logInfo("socket left project room", { socketId: socket.id, room });
    });
  });
}

/**
 * Attach Socket.IO to an existing Node HTTP server (recommended for production
 * when you control the process entry, e.g. custom `server.ts`).
 * Idempotent across hot reload via global singleton.
 */
export function attachSocketServer(httpServer: HTTPServer): Server {
  if (g.__socket_io_server) {
    return g.__socket_io_server;
  }

  const io = new IOServer(httpServer, {
    path: "/socket.io",
    cors: { origin: getCorsOrigins(), methods: ["GET", "POST"] },
    connectionStateRecovery: {},
  });

  registerConnectionHandlers(io);
  g.__socket_io_server = io;
  logInfo("Socket.IO attached to existing HTTP server");
  return io;
}

/**
 * Embedded HTTP server for Socket.IO (dev / self-hosted Node without custom server).
 * Uses a dedicated port (SOCKET_PORT, default 3001) so it does not collide with Next.
 * Singleton prevents duplicate listeners during Next.js hot reload.
 */
export function ensureEmbeddedSocketServer(): Server {
  if (g.__socket_io_server) {
    return g.__socket_io_server;
  }

  const port = Number(process.env.SOCKET_PORT ?? 3001);

  const httpServer =
    g.__socket_http_server ??
    http.createServer((_req, res) => {
      res.writeHead(404);
      res.end();
    });

  g.__socket_http_server = httpServer;

  if (!g.__socket_embedded_started) {
    httpServer.listen(port, () => {
      logInfo("embedded Socket.IO HTTP server listening", { port });
    });
    g.__socket_embedded_started = true;
  }

  const io = new IOServer(httpServer, {
    path: "/socket.io",
    cors: { origin: getCorsOrigins(), methods: ["GET", "POST"] },
    connectionStateRecovery: {},
  });

  registerConnectionHandlers(io);
  g.__socket_io_server = io;
  logInfo("Socket.IO initialized on embedded HTTP server", { port });
  return io;
}

/** Returns singleton IO server if initialized; otherwise null */
export function getSocketServer(): Server | null {
  return g.__socket_io_server ?? null;
}

export function emitTaskCreated(projectId: string, payload: TaskCreatedPayload) {
  const io = getSocketServer();
  if (!io) return;
  io.to(projectRoomId(projectId)).emit(TASK_SOCKET_EVENTS.taskCreated, payload);
}

export function emitTaskUpdated(projectId: string, payload: TaskUpdatedPayload) {
  const io = getSocketServer();
  if (!io) return;
  io.to(projectRoomId(projectId)).emit(TASK_SOCKET_EVENTS.taskUpdated, payload);
}

export function emitTaskMoved(projectId: string, payload: TaskMovedPayload) {
  const io = getSocketServer();
  if (!io) return;
  io.to(projectRoomId(projectId)).emit(TASK_SOCKET_EVENTS.taskMoved, payload);
}

export function emitTaskDeleted(projectId: string, payload: TaskDeletedPayload) {
  const io = getSocketServer();
  if (!io) return;
  io.to(projectRoomId(projectId)).emit(TASK_SOCKET_EVENTS.taskDeleted, payload);
}

export function getEmbeddedSocketServerUrl(): string {
  const port = process.env.SOCKET_PORT ?? "3001";
  const publicUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (publicUrl) return publicUrl.replace(/\/$/, "");
  return `http://127.0.0.1:${port}`;
}
