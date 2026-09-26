import { apiHandler } from "@/server/http";
import { getUserProfile } from "@/server/services/auth";

export const GET = apiHandler(
  {
    auth: true,
  },
  async ({ user }) => {
    if (!user) {
      throw new Error("User required");
    }
    const profile = await getUserProfile(user.userId);
    return {
      data: profile,
    };
  },
);
