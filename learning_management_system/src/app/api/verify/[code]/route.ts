import { apiHandler } from "@/server/http";
import { getCertificateByCode } from "@/server/services/certificates";

export const GET = apiHandler(
  {
    rateLimit: {
      maxPoints: 60,
      windowSeconds: 60,
      keyPrefix: "verify:cert",
    },
  },
  async ({ params }) => {
    const code = String(params.code || "");
    const cert = await getCertificateByCode(code);
    return {
      data: cert,
    };
  }
);
