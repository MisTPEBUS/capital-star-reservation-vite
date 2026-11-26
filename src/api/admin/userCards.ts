import axios from "axios";
import apiClient from "../axiosInstance";
import type { ApiErrorResponse, ApiResponse } from "../../types/api";
import type {
  AdminUserCardPage,
  AdminUserCardQuery,
  ApproveUserCardRequest,
  RejectUserCardRequest,
} from "../../types/adminUserCard";

const ADMIN_CARDS_PATH = "/api/v1/admin/cards";

/**
 * 後台卡片 API 錯誤。
 * status 為 HTTP 狀態碼，網路中斷或逾時時為 null；
 * fieldErrors 為 DTO 驗證失敗時後端回傳的欄位錯誤。
 */
export class AdminUserCardApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly fieldErrors: Record<string, string[]> | null = null,
  ) {
    super(message);
    this.name = "AdminUserCardApiError";
  }
}

function toAdminUserCardApiError(
  error: unknown,
  fallback: string,
): AdminUserCardApiError {
  if (error instanceof AdminUserCardApiError) return error;

  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    if (!error.response) {
      return new AdminUserCardApiError("無法連線到伺服器，請稍後再試。", null);
    }

    return new AdminUserCardApiError(
      error.response.data?.message || fallback,
      error.response.status,
      error.response.data?.errors ?? null,
    );
  }

  return new AdminUserCardApiError(
    error instanceof Error ? error.message : fallback,
    null,
  );
}

function cardActionPath(cardId: string, action: "approve" | "reject") {
  return `${ADMIN_CARDS_PATH}/${encodeURIComponent(cardId)}/${action}`;
}

/** 分頁查詢卡片；keyword 為空時不帶參數 */
export async function getAdminUserCards({
  status,
  keyword,
  page,
  pageSize,
}: AdminUserCardQuery): Promise<AdminUserCardPage> {
  try {
    const response = await apiClient.get<ApiResponse<AdminUserCardPage>>(
      ADMIN_CARDS_PATH,
      {
        params: {
          status,
          keyword: keyword.trim() || undefined,
          page,
          pageSize,
        },
      },
    );

    return response.data.data;
  } catch (error) {
    throw toAdminUserCardApiError(error, "卡片列表讀取失敗。");
  }
}

/** 送出內碼與預設卡片資料並人工通過；回傳後端成功訊息 */
export async function approveAdminUserCard(
  cardId: string,
  body: ApproveUserCardRequest,
): Promise<string> {
  try {
    const response = await apiClient.post<ApiResponse<null>>(
      cardActionPath(cardId, "approve"),
      body,
    );

    return response.data.message;
  } catch (error) {
    throw toAdminUserCardApiError(error, "審核通過失敗，請稍後再試。");
  }
}

/** 設為審核失敗；reason 會寫入 reviewNote。回傳後端成功訊息 */
export async function rejectAdminUserCard(
  cardId: string,
  body: RejectUserCardRequest,
): Promise<string> {
  try {
    const response = await apiClient.post<ApiResponse<null>>(
      cardActionPath(cardId, "reject"),
      body,
    );

    return response.data.message;
  } catch (error) {
    throw toAdminUserCardApiError(error, "設為審核失敗時發生錯誤，請稍後再試。");
  }
}
