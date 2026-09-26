import mongoose from "mongoose";
import { apiHandler, HttpError, NotFoundError } from "@/server/http";
import { Session } from "@/server/models/session";
import { connectToDatabase } from "@/server/db";

export const DELETE = apiHandler(
  {
    auth: true,
  },
  async ({ user, params }) => {
    await connectToDatabase();
    const sessionId = Array.isArray(params.id) ? params.id[0] : params.id;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      throw new HttpError(400, "BAD_REQUEST", "Invalid session ID format");
    }

    const session = await Session.findOne({
      _id: new mongoose.Types.ObjectId(sessionId),
      userId: new mongoose.Types.ObjectId(user!.userId),
    });

    if (!session) {
      throw new NotFoundError("Session not found or already terminated");
    }

    // Revoke the session family
    await Session.updateMany(
      { familyId: session.familyId, revokedAt: null },
      { revokedAt: new Date() }
    );

    return {
      data: {
        success: true,
        message: "Session revoked successfully",
      },
    };
  }
);
