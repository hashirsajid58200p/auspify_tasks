import { apiHandler } from "@/server/http";
import { getFinancialInsights } from "@/server/services/insight";
import { User } from "@/server/models/user";

export const GET = apiHandler(
  {
    auth: true,
  },
  async ({ user }) => {
    const userDoc = await User.findById(user!.userId).select("currency");
    const currency = userDoc?.currency || "USD";
    const insights = await getFinancialInsights(user!.userId, currency);
    return {
      data: insights,
    };
  }
);
