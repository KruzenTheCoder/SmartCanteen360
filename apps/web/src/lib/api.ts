import { auth } from "./auth";
import { DEMO_MODE, mockGet, mockLogin, mockPost } from "./mock";
import { isSupabaseConfigured } from "./supabase/config";

/**
 * Data routing:
 *  - Supabase configured  → internal Next route handlers at "/api" (production)
 *  - else demo mode        → in-memory mock data
 *  - else                  → legacy external API (NEXT_PUBLIC_API_URL)
 */
const useDemo = DEMO_MODE && !isSupabaseConfigured;
const BASE = isSupabaseConfigured
  ? "/api"
  : process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

/** Small delay so demo mode feels like a real request (loading states show). */
const demoDelay = () => new Promise((r) => setTimeout(r, 150));

interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

class ApiErrorClass extends Error {
  statusCode: number;
  errors?: Record<string, string[]>;

  constructor(error: ApiError) {
    super(error.message);
    this.name = "ApiError";
    this.statusCode = error.statusCode;
    this.errors = error.errors;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      message: "An unexpected error occurred",
      statusCode: response.status,
    }));
    throw new ApiErrorClass(error);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = auth.getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

export const api = {
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    if (useDemo) {
      await demoDelay();
      return mockGet(endpoint) as T;
    }
    const qs = params
      ? "?" +
        new URLSearchParams(
          Object.fromEntries(Object.entries(params).filter(([, v]) => v != null)),
        ).toString()
      : "";

    const response = await fetch(`${BASE}${endpoint}${qs}`, {
      method: "GET",
      headers: getHeaders(),
      credentials: "include",
    });

    return handleResponse<T>(response);
  },

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    if (useDemo) {
      await demoDelay();
      return mockPost(endpoint) as T;
    }
    const response = await fetch(`${BASE}${endpoint}`, {
      method: "POST",
      headers: getHeaders(),
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });

    return handleResponse<T>(response);
  },

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await fetch(`${BASE}${endpoint}`, {
      method: "PUT",
      headers: getHeaders(),
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });

    return handleResponse<T>(response);
  },

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await fetch(`${BASE}${endpoint}`, {
      method: "PATCH",
      headers: getHeaders(),
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });

    return handleResponse<T>(response);
  },

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${BASE}${endpoint}`, {
      method: "DELETE",
      headers: getHeaders(),
      credentials: "include",
    });

    return handleResponse<T>(response);
  },
};

// Convenience exports for common API calls
export const authApi = {
  login: async (data: { email: string; password: string }) => {
    if (useDemo) {
      await demoDelay();
      return mockLogin(data.email, data.password);
    }
    return api.post<{ user: unknown; accessToken: string; refreshToken: string }>("/auth/login", data);
  },
  
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    api.post("/auth/register", data),
  
  logout: () => api.post("/auth/logout", {}),
  
  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string; refreshToken: string }>("/auth/refresh", { refreshToken }),
  
  me: () => api.get("/auth/me"),
};

export default api;
