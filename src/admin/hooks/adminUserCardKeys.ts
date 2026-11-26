import type { AdminUserCardQuery } from "../../types/adminUserCard";

/** 後台卡片審核的 React Query key；審核完成後以 all 前綴使列表失效 */
export const adminUserCardKeys = {
  all: ["admin", "user-cards"] as const,
  list: (query: AdminUserCardQuery) =>
    ["admin", "user-cards", "list", query] as const,
  review: ["admin", "user-cards", "review"] as const,
};
