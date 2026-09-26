import { NextResponse } from "next/server";
import { z } from "zod";
import { apiHandler } from "@/server/http";
import { requireRole } from "@/server/policies/roles";
import { connectToDatabase } from "@/server/db";
import { Category } from "@/server/models/category";
import { createAdminCategory } from "@/server/services/admin";

const createCategorySchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(60),
    slug: z.string().trim().min(1, "Slug is required").max(60),
    description: z.string().trim().max(300).optional(),
  })
  .strict();

export const GET = apiHandler(
  {
    rateLimit: {
      maxPoints: 60,
      windowSeconds: 60,
      keyPrefix: "categories-list",
    },
  },
  async () => {
    await connectToDatabase();
    const categories = await Category.find({})
      .sort({ name: 1 })
      .select("_id name slug description")
      .lean();

    return NextResponse.json({
      data: categories.map((cat) => ({
        id: cat._id.toString(),
        name: cat.name,
        slug: cat.slug,
        description: cat.description || null,
      })),
    });
  }
);

export const POST = apiHandler(
  {
    auth: true,
    bodySchema: createCategorySchema,
    rateLimit: {
      maxPoints: 30,
      windowSeconds: 60,
      keyPrefix: "categories:create",
    },
  },
  async ({ user, body }) => {
    requireRole(user, "ADMIN");
    const category = await createAdminCategory(user!.userId, body);
    return {
      data: category,
      status: 201,
    };
  }
);
