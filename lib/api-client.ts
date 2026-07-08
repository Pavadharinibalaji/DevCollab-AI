import { ApiError } from "@/types";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiClient<T>(
  path: string,
  { body, headers, ...options }: RequestOptions = {},
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload && typeof payload === "object" && "error" in payload 
      ? payload.error 
      : payload?.message ?? response.statusText;
    throw new ApiError(message, response.status);
  }

  if (payload && typeof payload === "object" && "success" in payload) {
    if (!payload.success) {
      throw new ApiError(payload.error || "Request failed", response.status);
    }
    return payload.data as T;
  }

  return payload as T;
}
