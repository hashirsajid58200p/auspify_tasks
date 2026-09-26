import mongoose from "mongoose";
import { env } from "@/lib/env";
import "@/server/models";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = globalThis.mongooseCache || {
  conn: null,
  promise: null,
};

if (!globalThis.mongooseCache) {
  globalThis.mongooseCache = cached;
}

// Security: Enable sanitizeFilter to guard against NoSQL query selector injection
mongoose.set("sanitizeFilter", true);

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose;
    return mongoose;
  }

  const uri = process.env.MONGODB_URI || env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined. Please set it in your environment.");
  }

  const dbName = process.env.MONGODB_DB || env.MONGODB_DB || "studentms";

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      dbName,
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(uri, opts).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
