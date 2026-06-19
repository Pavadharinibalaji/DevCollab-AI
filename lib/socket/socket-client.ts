import { io, type ManagerOptions, type Socket } from "socket.io-client";

const LOG_PREFIX = "[socket:client]";
const DEFAULT_PATH = "/api/socket/io";

type SocketGlobal = typeof globalThis & {
  __socket_io_client?: Socket;
};

const g = globalThis as SocketGlobal;

export type SocketClientOptions = {
  /** Full base URL of the Socket.IO server (defaults to current origin) */
  url?: string;
  /** Socket.IO server path (defaults to Next.js API Socket.IO path) */
  path?: string;
  /** Extra socket.io-client options */
  socketOptions?: Partial<ManagerOptions>;
};

function logInfo(message: string, meta?: Record<string, unknown>) {
  if (meta) {
    console.info(`${LOG_PREFIX} ${message}`, meta);
  } else {
    console.info(`${LOG_PREFIX} ${message}`);
  }
}

function resolveDefaultUrl(): string {
  if (typeof window !== "undefined") {
    const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (envUrl) return envUrl.replace(/\/$/, "");
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SOCKET_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3000";
}

/**
 * Singleton Socket.IO client for the browser (and SSR-safe: only connects in browser).
 * Prevents duplicate connections during React strict mode / remounts when reused.
 */
export function getSocketClient(options: SocketClientOptions = {}): Socket | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (g.__socket_io_client?.connected) {
    return g.__socket_io_client;
  }

  if (g.__socket_io_client && !g.__socket_io_client.connected) {
    g.__socket_io_client.connect();
    return g.__socket_io_client;
  }

  const url = options.url ?? resolveDefaultUrl();
  const path = options.path ?? DEFAULT_PATH;

  const socket = io(url, {
    path,
    addTrailingSlash: false,
    autoConnect: true,
    transports: ["websocket", "polling"],
    reconnection: true,
    ...options.socketOptions,
  });

  socket.on("connect", () => {
    logInfo("connected", { id: socket.id, url, path });
  });

  socket.on("disconnect", (reason) => {
    logInfo("disconnected", { reason });
  });

  socket.io.on("reconnect_attempt", (attempt) => {
    logInfo("reconnect attempt", { attempt });
  });

  g.__socket_io_client = socket;
  return socket;
}

export function disconnectSocketClient() {
  if (typeof window === "undefined") return;
  const socket = g.__socket_io_client;
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  g.__socket_io_client = undefined;
  logInfo("client disconnected and singleton cleared");
}
