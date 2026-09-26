import { NextResponse } from "next/server";
import { ZodError, ZodType } from "zod";
import { requireUser, CurrentUser } from "./auth/session";
import { verifyCsrf } from "./auth/csrf";
import { checkRateLimit, getClientIp } from "./rate-limit";

export class HttpError extends Error {
  statusCode: number;
  code: string;
  fieldErrors?: Record<string, string[]>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "Unauthorized") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "Forbidden") {
    super(403, "FORBIDDEN", message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "Resource not found") {
    super(404, "NOT_FOUND", message);
  }
}

export class ConflictError extends HttpError {
  constructor(message = "Resource conflict") {
    super(409, "CONFLICT", message);
  }
}

export class ValidationError extends HttpError {
  constructor(message = "Validation failed", fieldErrors?: Record<string, string[]>) {
    super(422, "VALIDATION_ERROR", message, fieldErrors);
  }
}

export interface RouteContext {
  params?: Promise<Record<string, string | string[]>>;
}

export interface HandlerContext<TBody = unknown, TQuery = unknown> {
  req: Request;
  user?: CurrentUser;
  body: TBody;
  query: TQuery;
  params: Record<string, string | string[]>;
}

export interface HandlerResponse<T = unknown> {
  data: T;
  meta?: Record<string, unknown>;
  status?: number;
  headers?: Record<string, string>;
}

export interface RouteHandlerConfig<TBody = unknown, TQuery = unknown> {
  auth?: boolean;
  bodySchema?: ZodType<TBody, any, any>;
  querySchema?: ZodType<TQuery, any, any>;
  rateLimit?: {
    maxPoints: number;
    windowSeconds: number;
    keyPrefix?: string;
  };
}

export function apiHandler<TBody = unknown, TQuery = unknown, TData = unknown>(
  config: RouteHandlerConfig<TBody, TQuery>,
  handler: (
    ctx: HandlerContext<TBody, TQuery>
  ) => Promise<HandlerResponse<TData> | NextResponse>
) {
  return async (req: Request, routeCtx?: RouteContext): Promise<NextResponse> => {
    try {
      // 1. CSRF and Origin Check for state-mutating methods
      const csrfCheck = verifyCsrf(req);
      if (!csrfCheck.valid) {
        return NextResponse.json(
          {
            error: {
              code: "FORBIDDEN",
              message: csrfCheck.reason || "CSRF verification failed",
            },
          },
          { status: 403 }
        );
      }

      // 2. Rate Limiting (if configured)
      if (config.rateLimit) {
        const clientIp = getClientIp(req);
        const prefix = config.rateLimit.keyPrefix || "api";
        const key = `${prefix}:${clientIp}`;

        const limit = await checkRateLimit(
          key,
          config.rateLimit.maxPoints,
          config.rateLimit.windowSeconds
        );

        if (!limit.allowed) {
          return NextResponse.json(
            {
              error: {
                code: "RATE_LIMITED",
                message: "Too many requests. Please try again later.",
              },
            },
            {
              status: 429,
              headers: {
                "Retry-After": limit.resetInSeconds.toString(),
              },
            }
          );
        }
      }

      // 3. Authentication (if required)
      let user: CurrentUser | undefined;
      if (config.auth) {
        try {
          user = await requireUser(req);
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Authentication required";
          return NextResponse.json(
            {
              error: {
                code: "UNAUTHORIZED",
                message,
              },
            },
            { status: 401 }
          );
        }
      }

      // 4. Request Parameters
      const resolvedParams = routeCtx?.params ? await routeCtx.params : {};

      // 5. Query Parameter Validation
      let query = {} as TQuery;
      if (config.querySchema) {
        const url = new URL(req.url);
        const rawQuery: Record<string, string> = {};
        url.searchParams.forEach((val, key) => {
          rawQuery[key] = val;
        });

        const parsedQuery = config.querySchema.safeParse(rawQuery);
        if (!parsedQuery.success) {
          const fieldErrors: Record<string, string[]> = {};
          parsedQuery.error.issues.forEach((issue) => {
            const key = issue.path.join(".");
            if (!fieldErrors[key]) fieldErrors[key] = [];
            fieldErrors[key].push(issue.message);
          });

          return NextResponse.json(
            {
              error: {
                code: "VALIDATION_ERROR",
                message: "Invalid query parameters",
                fieldErrors,
              },
            },
            { status: 422 }
          );
        }
        query = parsedQuery.data;
      }

      // 6. Request Body Validation
      let body = {} as TBody;
      if (config.bodySchema) {
        let rawBody: unknown;
        try {
          rawBody = await req.json();
        } catch {
          return NextResponse.json(
            {
              error: {
                code: "VALIDATION_ERROR",
                message: "Malformed JSON body",
              },
            },
            { status: 400 }
          );
        }

        const parsedBody = config.bodySchema.safeParse(rawBody);
        if (!parsedBody.success) {
          const fieldErrors: Record<string, string[]> = {};
          parsedBody.error.issues.forEach((issue) => {
            const key = issue.path.join(".");
            if (!fieldErrors[key]) fieldErrors[key] = [];
            fieldErrors[key].push(issue.message);
          });

          return NextResponse.json(
            {
              error: {
                code: "VALIDATION_ERROR",
                message: "Validation failed",
                fieldErrors,
              },
            },
            { status: 422 }
          );
        }
        body = parsedBody.data;
      }

      // 7. Execute Handler
      const result = await handler({
        req,
        user,
        body,
        query,
        params: resolvedParams,
      });

      if (result instanceof NextResponse) {
        return result;
      }

      const responsePayload: { data: TData; meta?: Record<string, unknown> } = {
        data: result.data,
      };
      if (result.meta) {
        responsePayload.meta = result.meta;
      }

      return NextResponse.json(responsePayload, {
        status: result.status || 200,
        headers: result.headers,
      });
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        return NextResponse.json(
          {
            error: {
              code: err.code,
              message: err.message,
              ...(err.fieldErrors ? { fieldErrors: err.fieldErrors } : {}),
            },
          },
          { status: err.statusCode }
        );
      }

      if (err instanceof ZodError) {
        const fieldErrors: Record<string, string[]> = {};
        err.issues.forEach((issue) => {
          const key = issue.path.join(".");
          if (!fieldErrors[key]) fieldErrors[key] = [];
          fieldErrors[key].push(issue.message);
        });

        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Validation failed",
              fieldErrors,
            },
          },
          { status: 422 }
        );
      }

      // Never expose stack trace or database internals
      return NextResponse.json(
        {
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "An unexpected error occurred",
          },
        },
        { status: 500 }
      );
    }
  };
}
