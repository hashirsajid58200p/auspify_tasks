import { NextResponse } from "next/server";
import { apiHandler } from "@/server/http";
import { requireUser } from "@/server/auth/session";
import { requireRole } from "@/server/policies/roles";
import {
  createModuleSchema,
  CreateModuleSchema,
  updateModuleSchema,
  UpdateModuleSchema,
  reorderModulesSchema,
  ReorderModulesSchema,
} from "@/validations/course";
import {
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
} from "@/server/services/curriculum";

export const POST = apiHandler<CreateModuleSchema>(
  {
    bodySchema: createModuleSchema,
    rateLimit: {
      maxPoints: 30,
      windowSeconds: 60,
      keyPrefix: "module-create",
    },
  },
  async ({ req, params, body }) => {
    const user = await requireUser(req);
    requireRole(user, "INSTRUCTOR", "ADMIN");

    const courseId = Array.isArray(params.id) ? params.id[0] : params.id;
    const courseModule = await createModule(courseId, user, body);

    return NextResponse.json(
      {
        data: courseModule,
      },
      { status: 201 }
    );
  }
);

export const PATCH = apiHandler<UpdateModuleSchema>(
  {
    bodySchema: updateModuleSchema,
    rateLimit: {
      maxPoints: 30,
      windowSeconds: 60,
      keyPrefix: "module-update",
    },
  },
  async ({ req, params, body }) => {
    const user = await requireUser(req);
    requireRole(user, "INSTRUCTOR", "ADMIN");

    const courseId = Array.isArray(params.id) ? params.id[0] : params.id;
    const courseModule = await updateModule(courseId, user, body);

    return NextResponse.json({
      data: courseModule,
    });
  }
);

export const DELETE = apiHandler(
  {
    rateLimit: {
      maxPoints: 20,
      windowSeconds: 60,
      keyPrefix: "module-delete",
    },
  },
  async ({ req, params }) => {
    const user = await requireUser(req);
    requireRole(user, "INSTRUCTOR", "ADMIN");

    const courseId = Array.isArray(params.id) ? params.id[0] : params.id;
    const url = new URL(req.url);
    const moduleId = url.searchParams.get("moduleId") || "";

    const result = await deleteModule(courseId, moduleId, user);
    return NextResponse.json({
      data: result,
    });
  }
);

export const PUT = apiHandler<ReorderModulesSchema>(
  {
    bodySchema: reorderModulesSchema,
    rateLimit: {
      maxPoints: 30,
      windowSeconds: 60,
      keyPrefix: "module-reorder",
    },
  },
  async ({ req, params, body }) => {
    const user = await requireUser(req);
    requireRole(user, "INSTRUCTOR", "ADMIN");

    const courseId = Array.isArray(params.id) ? params.id[0] : params.id;
    const result = await reorderModules(courseId, user, body.moduleIds);

    return NextResponse.json({
      data: result,
    });
  }
);
