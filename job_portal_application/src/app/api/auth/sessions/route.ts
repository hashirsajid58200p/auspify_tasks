import { z } from "zod";
import { apiHandler } from "@/server/http";
import {
  listUserSessions,
  revokeUserSession,
  revokeOtherUserSessions,
} from "@/server/services/settings";

const deleteSessionQuerySchema = z
  .object({
    jti: z.string().optional(),
  })
  .strict();

export const GET = apiHandler(
  {
    auth: true,
  },
  async ({ user }) => {
    const sessions = await listUserSessions(user!.userId);
    return {
      data: sessions,
    };
  },
);

export const DELETE = apiHandler(
  {
    auth: true,
    querySchema: deleteSessionQuerySchema,
  },
  async ({ user, query }) => {
    if (query.jti) {
      await revokeUserSession(user!.userId, query.jti);
    } else {
      await revokeOtherUserSessions(user!.userId);
    }

    return {
      data: {
        message: query.jti
          ? "Session revoked successfully"
          : "All other sessions have been signed out",
      },
    };
  },
);
