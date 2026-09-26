import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const isConnected = mongoose.connection.readyState === 1;

    return NextResponse.json(
      {
        status: isConnected ? "ok" : "degraded",
        db: isConnected ? "connected" : "disconnected",
      },
      { status: isConnected ? 200 : 503 }
    );
  } catch {
    return NextResponse.json(
      {
        status: "error",
        db: "disconnected",
      },
      { status: 503 }
    );
  }
}
