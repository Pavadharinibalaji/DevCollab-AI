import { createClient } from "redis";
import { getIO } from "./socket";

type RealtimeMessage = {
  projectId: string;
  event: string;
  payload: unknown;
};

class RealtimeBroker {
  private pubClient: ReturnType<typeof createClient> | null = null;
  private subClient: ReturnType<typeof createClient> | null = null;
  private isInitialized = false;

  async init() {
    if (this.isInitialized) return;
    const redisUrl = process.env.REDIS_URL;

    if (redisUrl) {
      try {
        console.log(`[RealtimeBroker] Initializing Redis connection to ${redisUrl}...`);
        this.pubClient = createClient({ url: redisUrl });
        this.subClient = this.pubClient.duplicate();

        await Promise.all([this.pubClient.connect(), this.subClient.connect()]);

        // Subscribe to Kanban Board update events
        await this.subClient.subscribe("kanban-updates", (message) => {
          try {
            const { projectId, event, payload } = JSON.parse(message) as RealtimeMessage;
            const io = getIO();
            if (io) {
              if (projectId === "global") {
                io.emit(event, payload);
                console.log(`[RealtimeBroker] Distributed global event "${event}"`);
              } else {
                const room = `project:${projectId}`;
                io.to(room).emit(event, payload);
                console.log(`[RealtimeBroker] Distributed event "${event}" to room "${room}"`);
              }
            }
          } catch (err) {
            console.error("[RealtimeBroker] Failed to parse Redis message:", err);
          }
        });

        console.log("[RealtimeBroker] Redis pub/sub broker initialized successfully.");
        this.isInitialized = true;
      } catch (err) {
        console.error("[RealtimeBroker] Redis connection failed, falling back to local events:", err);
        this.pubClient = null;
        this.subClient = null;
        this.isInitialized = true;
      }
    } else {
      console.log("[RealtimeBroker] REDIS_URL not configured. Operating in local in-memory mode.");
      this.isInitialized = true;
    }
  }

  async publish(projectId: string, event: string, payload: unknown) {
    if (!this.isInitialized) {
      await this.init();
    }

    if (this.pubClient) {
      const message: RealtimeMessage = { projectId, event, payload };
      try {
        await this.pubClient.publish("kanban-updates", JSON.stringify(message));
        console.log(`[RealtimeBroker] Published event "${event}" to Redis for project: ${projectId}`);
      } catch (err) {
        console.error("[RealtimeBroker] Redis publish failed, falling back to local emit:", err);
        this.localEmit(projectId, event, payload);
      }
    } else {
      this.localEmit(projectId, event, payload);
    }
  }

  private localEmit(projectId: string, event: string, payload: unknown) {
    const io = getIO();
    if (io) {
      if (projectId === "global") {
        io.emit(event, payload);
        console.log(`[RealtimeBroker] Emitted global event "${event}" locally`);
      } else {
        const room = `project:${projectId}`;
        io.to(room).emit(event, payload);
        console.log(`[RealtimeBroker] Emitted event "${event}" locally to room "${room}"`);
      }
    } else {
      console.warn(`[RealtimeBroker] Cannot emit "${event}" - Socket.IO server is not initialized yet.`);
    }
  }
}

export const realtimeBroker = new RealtimeBroker();
