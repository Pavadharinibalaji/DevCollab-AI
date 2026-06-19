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

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(payload?.message ?? response.statusText, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
