import type { NextApiRequest, NextApiResponse } from "next";
import type { Server as NetServer } from "http";
import type { Socket as NetSocket } from "net";
import type { Server as SocketIOServer } from "socket.io";
import { initSocketIO } from "@/lib/server/socket";
import { realtimeBroker } from "@/lib/server/realtime-broker";

export const config = {
  api: {
    bodyParser: false,
  },
};

type NextApiResponseWithSocket = NextApiResponse & {
  socket: NetSocket & {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!res.socket.server.io) {
    console.log("[Socket.IO] Attaching Socket.IO server to HTTP server...");
    const io = initSocketIO(res.socket.server);
    res.socket.server.io = io;

    // Trigger asynchronous initialization of the messaging broker (Redis etc.)
    await realtimeBroker.init();
  } else {
    // If the HTTP server already has Socket.IO but our global/process singletons are not set (e.g. after hot reload)
    if (!globalThis.io || !(process as unknown as { io?: SocketIOServer }).io) {
      console.log("[Socket.IO] Restoring Socket.IO singleton references after hot reload...");
      globalThis.io = res.socket.server.io;
      (process as unknown as { io?: SocketIOServer }).io = res.socket.server.io;
    }
  }

  res.end();
}
