import fs from "fs";
import path from "path";
import mongoose from "mongoose";

// Simple env loader for scripts
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

async function checkDb() {
  loadEnvLocal();
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "expense_tracker";

  if (!uri) {
    console.log("fail");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 1,
    });
    console.log("ok");
    await mongoose.disconnect();
    process.exit(0);
  } catch {
    console.log("fail");
    process.exit(1);
  }
}

checkDb();
