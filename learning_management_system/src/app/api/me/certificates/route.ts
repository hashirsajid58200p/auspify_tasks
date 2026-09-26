import { apiHandler } from "@/server/http";
import { getStudentCertificates } from "@/server/services/certificates";

export const GET = apiHandler(
  {
    auth: true,
    rateLimit: {
      maxPoints: 60,
      windowSeconds: 60,
      keyPrefix: "me:certificates",
    },
  },
  async ({ user }) => {
    const certs = await getStudentCertificates(user!.userId);
    return {
      data: certs,
    };
  }
);
