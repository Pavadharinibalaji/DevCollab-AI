import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";

declare global {
  var io: SocketIOServer | undefined;
}

export const initSocketIO = (server: NetServer) => {
  const existingIo = globalThis.io || (process as unknown as { io?: SocketIOServer }).io;
  if (existingIo) {
    return existingIo;
  }

  const ioServer = new SocketIOServer(server, {
    path: "/api/socket/io",
    addTrailingSlash: false,
    cors: {
      origin: "*",
    },
  });

  console.log("[Socket.IO] Socket server initialized");

  ioServer.on("connection", (socket) => {
    const transport = socket.conn.transport.name;
    const referer = socket.handshake.headers.referer || "unknown origin";
    const clientCount = ioServer.engine.clientsCount;

    console.log(
      `[Socket.IO] 🔌 Client connected | ID: ${socket.id} | Transport: ${transport} | Origin: ${referer} | Active Clients: ${clientCount}`
    );

    socket.on("join-project", (projectId: string) => {
      if (projectId) {
        const room = `project:${projectId}`;
        socket.join(room);
        console.log(`[Socket.IO] 📥 Client ${socket.id} joined room: ${room}`);
      }
    });

    socket.on("leave-project", (projectId: string) => {
      if (projectId) {
        const room = `project:${projectId}`;
        socket.leave(room);
        console.log(`[Socket.IO] 📤 Client ${socket.id} left room: ${room}`);
      }
    });

    socket.on("disconnect", (reason) => {
      const remainingCount = ioServer.engine.clientsCount;
      console.log(
        `[Socket.IO] ❌ Client disconnected | ID: ${socket.id} | Reason: ${reason} | Active Clients: ${remainingCount}`
      );
    });
  });

  globalThis.io = ioServer;
  (process as unknown as { io?: SocketIOServer }).io = ioServer;
  return ioServer;
};

export const getIO = (): SocketIOServer | undefined => {
  return globalThis.io || (process as unknown as { io?: SocketIOServer }).io;
};
