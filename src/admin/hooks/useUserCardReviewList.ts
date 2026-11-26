import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminUserCards } from "../../api/admin/userCards";
import type {
  AdminUserCard,
  AdminUserCardQuery,
} from "../../types/adminUserCard";
import type { UserCardReviewStatus } from "../../types/userCard";
import { ADMIN_CARD_PAGE_SIZE } from "../utils/userCardReview";
import { adminUserCardKeys } from "./adminUserCardKeys";

export interface UserCardReviewListResult {
  cards: AdminUserCard[];
  totalCount: number;
  totalPages: number;
  /** 第一次載入（尚無資料） */
  isLoading: boolean;
  /** 已有資料，背景重新整理中 */
  isRefreshing: boolean;
  errorMessage: string | null;
  retry: () => void;
}

/** 審核狀態、關鍵字、分頁的查詢狀態，以及對應的卡片列表 */
export function useUserCardReviewList() {
  const [status, setStatus] = useState<UserCardReviewStatus>("PENDING");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);

  const query: AdminUserCardQuery = {
    status,
    keyword,
    page,
    pageSize: ADMIN_CARD_PAGE_SIZE,
  };
  const { data, error, isPending, isFetching, refetch } = useQuery({
    queryKey: adminUserCardKeys.list(query),
    queryFn: () => getAdminUserCards(query),
  });
  const totalPages = Math.max(data?.totalPages ?? 1, 1);

  // 審核後最後一頁可能被清空，退回仍有資料的最後一頁
  useEffect(() => {
    if (data && page > totalPages) setPage(totalPages);
  }, [data, page, totalPages]);

  const changeStatus = (nextStatus: UserCardReviewStatus) => {
    setStatus(nextStatus);
    setPage(1);
  };

  const search = (nextKeyword: string) => {
    setKeyword(nextKeyword.trim());
    setPage(1);
  };

  const result: UserCardReviewListResult = {
    cards: data?.items ?? [],
    totalCount: data?.totalCount ?? 0,
    totalPages,
    isLoading: isPending,
    isRefreshing: isFetching && !isPending,
    errorMessage: error ? error.message : null,
    retry: () => void refetch(),
  };

  return {
    filters: { status, keyword, page },
    changeStatus,
    search,
    changePage: setPage,
    result,
  };
}
