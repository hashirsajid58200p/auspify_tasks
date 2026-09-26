import { apiHandler } from "@/server/http";
import { companySchema, CompanySchema } from "@/validations/company";
import { getEmployerCompany, upsertEmployerCompany } from "@/server/services/companies";
import { requireRole } from "@/server/policies/roles";

export const GET = apiHandler(
  {
    auth: true,
  },
  async ({ user }) => {
    requireRole(user, "EMPLOYER");
    const company = await getEmployerCompany(user!.userId);
    return {
      data: company,
    };
  },
);

export const PUT = apiHandler<CompanySchema>(
  {
    auth: true,
    bodySchema: companySchema,
    rateLimit: {
      maxPoints: 20,
      windowSeconds: 60,
      keyPrefix: "employer-company",
    },
  },
  async ({ user, body }) => {
    requireRole(user, "EMPLOYER");
    const company = await upsertEmployerCompany(user!.userId, body);
    return {
      data: company,
    };
  },
);
