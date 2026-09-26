import { Types } from "mongoose";
import { connectToDatabase } from "@/server/db";
import { Company, ICompany } from "@/server/models/company";
import { CompanySchema } from "@/validations/company";
import { generateCompanySlug } from "@/lib/slug";
import { NotFoundError } from "@/server/http";

export async function getEmployerCompany(userId: string): Promise<ICompany | null> {
  await connectToDatabase();
  return Company.findOne({ ownerId: new Types.ObjectId(userId) });
}

export async function upsertEmployerCompany(
  userId: string,
  data: CompanySchema,
): Promise<ICompany> {
  await connectToDatabase();
  const ownerId = new Types.ObjectId(userId);

  const existing = await Company.findOne({ ownerId });

  if (existing) {
    existing.name = data.name.trim();
    if (data.website !== undefined) existing.website = data.website.trim();
    if (data.logoUrl !== undefined) existing.logoUrl = data.logoUrl.trim();
    existing.description = data.description.trim();
    existing.location = data.location.trim();
    existing.industry = data.industry.trim();
    existing.size = data.size;

    await existing.save();
    return existing;
  }

  // Create new company
  let slug = generateCompanySlug(data.name);
  // Ensure slug uniqueness
  while (await Company.exists({ slug })) {
    slug = generateCompanySlug(data.name);
  }

  const company = await Company.create({
    ownerId,
    name: data.name.trim(),
    slug,
    website: data.website?.trim() || "",
    logoUrl: data.logoUrl?.trim() || "",
    description: data.description.trim(),
    location: data.location.trim(),
    industry: data.industry.trim(),
    size: data.size,
  });

  return company;
}

export async function getCompanyBySlug(slug: string): Promise<ICompany> {
  await connectToDatabase();
  const company = await Company.findOne({ slug });
  if (!company) {
    throw new NotFoundError("Company not found");
  }
  return company;
}

export async function getAllPublicCompanies(search?: string): Promise<ICompany[]> {
  await connectToDatabase();
  const filter: any = {};
  if (search && search.trim()) {
    const escaped = search.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { industry: { $regex: escaped, $options: "i" } },
      { location: { $regex: escaped, $options: "i" } },
    ];
  }

  const companies = await Company.find(filter).sort({ name: 1 }).limit(50).lean();

  return companies as unknown as ICompany[];
}
