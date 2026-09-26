import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/db";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const isConnected = mongoose.connection.readyState === 1;

    if (!isConnected) {
      return NextResponse.json(
        { status: "error", db: "disconnected" },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "ok",
      db: "connected",
    });
  } catch {
    return NextResponse.json(
      { status: "error", db: "disconnected" },
      { status: 503 }
    );
  }
}
