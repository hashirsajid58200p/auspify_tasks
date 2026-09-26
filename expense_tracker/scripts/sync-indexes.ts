import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import {
  User,
  Session,
  Category,
  Transaction,
  Budget,
  RateLimit,
} from "../src/server/models";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

async function syncAllIndexes() {
  loadEnvLocal();
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "expense_tracker";

  if (!uri) {
    console.error("MONGODB_URI not found");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 5000,
    });

    console.log("Connected to MongoDB. Syncing indexes...");

    await Promise.all([
      User.syncIndexes(),
      Session.syncIndexes(),
      Category.syncIndexes(),
      Transaction.syncIndexes(),
      Budget.syncIndexes(),
      RateLimit.syncIndexes(),
    ]);

    console.log("All indexes synchronized successfully.");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Failed to sync indexes:", error);
    process.exit(1);
  }
}

syncAllIndexes();
