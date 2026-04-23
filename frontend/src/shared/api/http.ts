import { handleMockRequest } from "@/shared/api/mock-server";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";
const isMockMode = import.meta.env.VITE_E2E_FAKE_AUTH === "true";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions extends RequestInit {
  accessToken: string;
}

export const request = async <T>(path: string, options: RequestOptions): Promise<T> => {
  const { accessToken, headers, ...rest } = options;
  const method = (rest.method ?? "GET") as "GET" | "POST" | "PATCH" | "DELETE";

  if (isMockMode) {
    return handleMockRequest<T>(path, method, rest.body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...headers,
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(payload?.message ?? "Request failed", response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
};
