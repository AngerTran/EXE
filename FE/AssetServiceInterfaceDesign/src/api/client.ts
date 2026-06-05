import type { ApiErrorBody } from "./types/auth";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:5180/api/v1";

const ACCESS_TOKEN_KEY = "exe_access_token";
const REFRESH_TOKEN_KEY = "exe_refresh_token";

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function getApiBaseUrl(): string {
  return API_BASE;
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAuthTokens(accessToken: string, refreshToken?: string | null): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearAuthTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

type RequestOptions = RequestInit & {
  /** Gửi Bearer token (mặc định true). */
  auth?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { auth = true, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);

  if (rest.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(url, { ...rest, headers });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const err = data as ApiErrorBody | null;
    const validation = data as { errors?: Record<string, string[]>; title?: string } | null;
    const validationMessage = validation?.errors
      ? Object.entries(validation.errors)
          .flatMap(([field, messages]) => messages.map((m) => `${field}: ${m}`))
          .join("; ")
      : undefined;
    throw new ApiError(
      err?.message ?? validationMessage ?? validation?.title ?? response.statusText ?? "Request failed",
      response.status,
      err?.code
    );
  }

  return data as T;
}
