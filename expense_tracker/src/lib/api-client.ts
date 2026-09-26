export interface ApiErrorPayload {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export class ApiClientError extends Error {
  code: string;
  fieldErrors?: Record<string, string[]>;
  status: number;

  constructor(status: number, error: ApiErrorPayload) {
    super(error.message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = error.code;
    this.fieldErrors = error.fieldErrors;
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function attemptTokenRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function fetchApi<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const config: RequestInit = {
    ...init,
    credentials: "include",
    headers: {
      ...defaultHeaders,
      ...init?.headers,
    },
  };

  let res = await fetch(input, config);

  // If 401 Unauthorized, attempt refresh once and retry
  if (res.status === 401 && input !== "/api/auth/login" && input !== "/api/auth/refresh") {
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      res = await fetch(input, config);
    }
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const errorPayload: ApiErrorPayload = json?.error || {
      code: "UNKNOWN_ERROR",
      message: res.statusText || "Request failed",
    };
    throw new ApiClientError(res.status, errorPayload);
  }

  return (json?.data !== undefined ? json.data : json) as T;
}

export const api = {
  get: <T>(url: string, init?: RequestInit) =>
    fetchApi<T>(url, { ...init, method: "GET" }),
  post: <T>(url: string, body?: unknown, init?: RequestInit) =>
    fetchApi<T>(url, {
      ...init,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(url: string, body?: unknown, init?: RequestInit) =>
    fetchApi<T>(url, {
      ...init,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(url: string, body?: unknown, init?: RequestInit) =>
    fetchApi<T>(url, {
      ...init,
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(url: string, body?: unknown, init?: RequestInit) =>
    fetchApi<T>(url, {
      ...init,
      method: "DELETE",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
};
