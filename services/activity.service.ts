import { apiClient } from "@/lib/api-client";
import type { MockActivity } from "@/types";

const BASE = "/api/activities";

export const activityService = {
  list: () =>
    apiClient<{ activities: MockActivity[] }>(BASE).then((res) => res.activities),
};
