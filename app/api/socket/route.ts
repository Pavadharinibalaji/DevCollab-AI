import { NextResponse } from "next/server";

import { ensureEmbeddedSocketServer, getEmbeddedSocketServerUrl } from "@/lib/socket/socket-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lazily initializes the embedded Socket.IO server (singleton, HMR-safe).
 * For production behind one Node process, prefer attaching Socket.IO to your main
 * HTTP server via `attachSocketServer(httpServer)` from `lib/socket/socket-server.ts`.
 */
export async function GET() {
  const io = ensureEmbeddedSocketServer();
  const url = getEmbeddedSocketServerUrl();

  return NextResponse.json({
    ok: true,
    socketUrl: url,
    path: "/socket.io",
    sockets: io.engine.clientsCount,
  });
}
