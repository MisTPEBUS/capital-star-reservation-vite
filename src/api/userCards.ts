import axios from "axios";
import apiClient from "./axiosInstance";
import { getLiffIdToken } from "../liff/liffClient";
import type { ApiErrorResponse, ApiResponse } from "../types/api";
import type { CreateUserCardRequest, UserCard } from "../types/userCard";

const USER_CARDS_PATH = "/api/v1/cards";
const LINE_ID_TOKEN_HEADER = "X-Line-Id-Token";

/**
 * 會員卡片 API 錯誤。
 * status 為 HTTP 狀態碼；網路中斷或逾時時為 null。
 * message 保留後端原始訊息，畫面文案由 utils/userCards 轉換。
 */
export class UserCardApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
  ) {
    super(message);
    this.name = "UserCardApiError";
  }
}

async function getAuthHeaders() {
  const idToken = await getLiffIdToken();

  if (!idToken) {
    throw new UserCardApiError("缺少 X-Line-Id-Token", 401);
  }

  return { [LINE_ID_TOKEN_HEADER]: idToken };
}

function toUserCardApiError(error: unknown): UserCardApiError {
  if (error instanceof UserCardApiError) return error;

  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return new UserCardApiError(
      error.response?.data?.message ?? error.message,
      error.response?.status ?? null,
    );
  }

  return new UserCardApiError(
    error instanceof Error ? error.message : "卡片資料處理失敗",
    null,
  );
}

/** 取得自己的卡片（後端已依建立時間新到舊排序） */
export async function getUserCards(): Promise<UserCard[]> {
  try {
    const response = await apiClient.get<ApiResponse<UserCard[]>>(
      USER_CARDS_PATH,
      { headers: await getAuthHeaders() },
    );

    return response.data.data;
  } catch (error) {
    throw toUserCardApiError(error);
  }
}

/** 申請新增卡片；查詢悠遊卡失敗時後端仍會建立 PENDING 卡片 */
export async function createUserCard(cardNumber: string): Promise<UserCard> {
  const body: CreateUserCardRequest = { cardNumber };

  try {
    const response = await apiClient.post<ApiResponse<UserCard>>(
      USER_CARDS_PATH,
      body,
      { headers: await getAuthHeaders() },
    );

    return response.data.data;
  } catch (error) {
    throw toUserCardApiError(error);
  }
}

/** 軟刪除自己的卡片 */
export async function deleteUserCard(cardId: string): Promise<void> {
  try {
    await apiClient.delete<ApiResponse<null>>(
      `${USER_CARDS_PATH}/${encodeURIComponent(cardId)}`,
      { headers: await getAuthHeaders() },
    );
  } catch (error) {
    throw toUserCardApiError(error);
  }
}
