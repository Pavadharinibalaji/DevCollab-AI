import mongoose from "mongoose";

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing environment variable: MONGODB_URI");
  }
  return uri;
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose | null> | null;
};

declare global {
  var __mongooseCache: MongooseCache | undefined;
}

const globalCache = globalThis.__mongooseCache ?? {
  conn: null,
  promise: null,
};

globalThis.__mongooseCache = globalCache;

export let isMockMode = false;

/**
 * Reusable cached Mongoose connection.
 *
 * Notes:
 * - Intended for the Node.js runtime (not Edge).
 * - Safe in Next.js dev (hot reload) by caching on globalThis.
 */
export async function connectMongoose() {
  try {
    if (globalCache.conn) {
      isMockMode = false;
      return globalCache.conn;
    }

    if (!globalCache.promise) {
      let uri: string;
      try {
        uri = getMongoUri();
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error("MongoDB connection failed:", errMsg);
        console.log("MongoDB unavailable — switching to mock mode");
        isMockMode = true;
        return null;
      }

      globalCache.promise = mongoose
        .connect(uri, {
          // Keep config minimal; override via env if needed.
          bufferCommands: false,
          serverSelectionTimeoutMS: 2000, // Short timeout for fast failover
        })
        .then(async (m) => {
          isMockMode = false;
          globalCache.conn = m;
          try {
            await m.connection.collection("userkeys").dropIndex("userId_1");
          } catch (err) {
            // Ignore if index doesn't exist or collection doesn't exist yet
          }
          return m;
        })
        .catch((err) => {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error("MongoDB connection failed:", errMsg);
          console.log("MongoDB unavailable — switching to mock mode");
          isMockMode = true;
          globalCache.promise = null; // Clear promise so we can retry on next request
          return null;
        });
    }

    const conn = await globalCache.promise;
    if (!conn) {
      isMockMode = true;
      return null;
    }
    return conn;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("MongoDB connection failed:", errMsg);
    console.log("MongoDB unavailable — switching to mock mode");
    isMockMode = true;
    globalCache.promise = null;
    return null;
  }
}
