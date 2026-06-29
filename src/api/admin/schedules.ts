import axios from "axios";
import apiClient from "../axiosInstance";

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export type DailyOpenScheduleStatus = "ACTIVE" | "INACTIVE";

export interface DailyOpenSchedulePayload {
  routeId: string;
  departureTime: string;
  openDate: string;
  quota: number;
  status: DailyOpenScheduleStatus;
}

export interface AdminDailyOpenSchedule {
  dailyOpenScheduleId: string;
  routeId: string;
  departureTime: string;
  openDate: string;
  quota: number;
  deadline: string;
  status: DailyOpenScheduleStatus | string;
  createdAt: string;
  updatedAt: string;
}

export interface BatchDailyOpenScheduleFailedItem
  extends DailyOpenSchedulePayload {
  rowNumber: number;
  errorCode: number;
  errorMessage: string;
}

export interface BatchDailyOpenScheduleResult {
  totalCount: number;
  successCount: number;
  failedCount: number;
  createdItems: AdminDailyOpenSchedule[];
  failedItems: BatchDailyOpenScheduleFailedItem[];
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    return error.response?.data?.message || "班次建立失敗，請稍後再試。";
  }

  return error instanceof Error ? error.message : "班次建立失敗，請稍後再試。";
}

function unwrapResponse<T>(response: ApiResponse<T>) {
  if (![0, 200].includes(response.code) || !response.data) {
    throw new Error(response.message || "班次建立失敗，請稍後再試。");
  }

  return response.data;
}

export async function createDailyOpenSchedule(
  payload: DailyOpenSchedulePayload,
) {
  try {
    const response = await apiClient.post<ApiResponse<AdminDailyOpenSchedule>>(
      "/api/v1/admin/daily-open-schedules",
      payload,
    );
    return unwrapResponse(response.data);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function createDailyOpenSchedulesBatch(
  schedules: DailyOpenSchedulePayload[],
) {
  try {
    const response = await apiClient.post<ApiResponse<BatchDailyOpenScheduleResult>>(
      "/api/v1/admin/daily-open-schedules/batch",
      { schedules },
    );
    return unwrapResponse(response.data);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
