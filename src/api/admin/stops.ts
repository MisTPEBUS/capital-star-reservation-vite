import axios from "axios";
import apiClient from "../axiosInstance";

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export type StopType = "ROADSIDE" | "STATION";
export type StopStatus = "ACTIVE" | "INACTIVE";

export interface AdminStop {
  stopId: string;
  stopName: string;
  stopType: StopType;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: StopStatus;
}

export interface StopPayload {
  stopName: string;
  stopType: StopType;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: StopStatus;
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    return error.response?.data?.message || "站位操作失敗，請稍後再試。";
  }

  return error instanceof Error ? error.message : "站位操作失敗，請稍後再試。";
}

function unwrapResponse<T>(response: ApiResponse<T>) {
  if (response.code !== 0 || !response.data) {
    throw new Error(response.message || "站位操作失敗，請稍後再試。");
  }

  return response.data;
}

export async function getStops() {
  try {
    const response = await apiClient.get<ApiResponse<AdminStop[]>>("/api/v1/admin/stops");
    return unwrapResponse(response.data);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function createStop(payload: StopPayload) {
  try {
    const response = await apiClient.post<ApiResponse<AdminStop>>(
      "/api/v1/admin/stops",
      payload,
    );
    return unwrapResponse(response.data);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function updateStop(stopId: string, payload: StopPayload) {
  try {
    const response = await apiClient.put<ApiResponse<AdminStop>>(
      `/api/v1/admin/stops/${stopId}`,
      payload,
    );
    return unwrapResponse(response.data);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function deleteStop(stopId: string) {
  try {
    const response = await apiClient.delete<ApiResponse<null>>(
      `/api/v1/admin/stops/${stopId}`,
    );
    if (response.data.code !== 0) {
      throw new Error(response.data.message || "刪除站位失敗，請稍後再試。");
    }
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
