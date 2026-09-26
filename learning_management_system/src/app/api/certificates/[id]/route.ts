import { apiHandler } from "@/server/http";
import { getCertificateById } from "@/server/services/certificates";

export const GET = apiHandler(
  {
    auth: true,
    rateLimit: {
      maxPoints: 60,
      windowSeconds: 60,
      keyPrefix: "certificate:detail",
    },
  },
  async ({ user, params }) => {
    const certId = String(params.id || "");
    const cert = await getCertificateById(certId, user?.userId, user?.role);
    return {
      data: cert,
    };
  }
);
