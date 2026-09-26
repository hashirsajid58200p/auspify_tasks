import { NextResponse } from "next/server";
import { apiHandler } from "@/server/http";
import { getUserProfile } from "@/server/services/user";

export const GET = apiHandler(
  {
    auth: true,
  },
  async ({ user }) => {
    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const profile = await getUserProfile(user.userId);
    return {
      data: profile,
    };
  }
);
