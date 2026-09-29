import axios from "axios";
import apiClient from "../axiosInstance";
import { getLocalDateValue } from "../../utils/quickReservation";
import { SUPER_ADMIN_TOKEN_HEADER } from "./session";

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

export interface LoginVerificationCode {
  code: string;
  userId: string;
  purpose: string;
  expiresAt: string;
}

export interface LoginSession {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  userId: string;
  displayName: string | null;
  role: string;
}

type LoginSessionResponse = LoginSession & {
  displayname?: string | null;
};

function isLoginSession(value: unknown): value is LoginSession {
  if (!value || typeof value !== "object") return false;

  const session = value as Partial<LoginSessionResponse>;
  return (
    typeof session.accessToken === "string" &&
    typeof session.tokenType === "string" &&
    typeof session.expiresAt === "string" &&
    typeof session.userId === "string" &&
    typeof session.role === "string"
  );
}

export async function requestLoginVerificationCode(activeCode: string) {
  try {
    const response = await apiClient.post<ApiResponse<LoginVerificationCode>>(
      "/api/v1/auth/login",
      { activeCode },
    );

    if (response.data.code !== 0) {
      throw new Error(response.data.message || "建立驗證碼失敗。");
    }

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      const { message, errors } = error.response?.data ?? {};
      const validationMessage = errors
        ? Object.values(errors).flat().join("、")
        : undefined;

      throw new Error(validationMessage || message || "無法建立驗證碼，請稍後再試。");
    }

    throw error instanceof Error
      ? error
      : new Error("無法建立驗證碼，請稍後再試。");
  }
}

export async function verifyLoginCode(code: string, userId: string) {
  if (!/^\d{4}$/.test(code)) {
    throw new Error("請輸入 4 位數驗證碼");
  }

  if (!userId) {
    throw new Error("缺少登入使用者資訊，請重新取得驗證碼");
  }

  try {
    const response = await apiClient.post<ApiResponse<LoginSession>>(
      "/api/v1/auth/verify-login-code",
      { code, UserId: userId },
    );

    if (response.data.code !== 0) {
      throw new Error(response.data.message || "驗證登入失敗。");
    }

    if (!isLoginSession(response.data.data)) {
      throw new Error("登入回應資料不完整，請重新登入");
    }

    const session = response.data.data as LoginSessionResponse;

    return {
      ...session,
      displayName: session.displayName ?? session.displayname ?? null,
    };
  } catch (error) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      const { message, errors } = error.response?.data ?? {};
      const validationMessage = errors
        ? Object.values(errors).flat().join("、")
        : undefined;

      throw new Error(validationMessage || message || "驗證登入失敗，請稍後再試。");
    }

    throw error instanceof Error
      ? error
      : new Error("驗證登入失敗，請稍後再試。");
  }
}

// 以唯讀的 Dashboard 查詢確認 Token 能通過後端 Super Admin 驗證。
export async function verifySuperAdminToken(superAdminToken: string) {
  if (!superAdminToken) {
    throw new Error("請輸入 Super Admin Token");
  }

  try {
    const response = await apiClient.get<ApiResponse<unknown>>(
      "/api/v1/admin/dashboard/daily-open-schedules",
      {
        params: { openDate: getLocalDateValue() },
        headers: { [SUPER_ADMIN_TOKEN_HEADER]: superAdminToken },
      },
    );

    if (response.data.code !== 0) {
      throw new Error(response.data.message || "Super Admin 驗證失敗。");
    }
  } catch (error) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      if (error.response?.status === 401) {
        throw new Error("Super Admin Token 無效，或後端未啟用 Super Admin 登入。");
      }

      throw new Error(
        error.response?.data?.message || "Super Admin 驗證失敗，請稍後再試。",
      );
    }

    throw error instanceof Error
      ? error
      : new Error("Super Admin 驗證失敗，請稍後再試。");
  }
}
