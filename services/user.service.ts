import { apiClient } from "@/lib/api-client";
import type { User } from "@/types";

const BASE = "/api/users";

export const userService = {
  getCurrent: () => apiClient<{ user: User; workspace: any }>(`${BASE}/me`),
  list: () => apiClient<{ users: User[] }>(BASE).then((res) => res.users),
};
