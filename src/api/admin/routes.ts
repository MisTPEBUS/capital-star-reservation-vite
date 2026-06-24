import axios from "axios";
import apiClient from "../axiosInstance";

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export type RouteStatus = "ACTIVE" | "INACTIVE";

export interface RouteStop {
  stopId: string;
  stopName: string;
  stopType: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  sequence: number;
}

export interface AdminRoute {
  routeId: string;
  routeNumber: string;
  routeName: string;
  description: string | null;
  status: RouteStatus;
  stops: RouteStop[];
}

export interface RoutePayload {
  routeNumber: string;
  routeName: string;
  description: string | null;
  status: RouteStatus;
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    return error.response?.data?.message || "路線操作失敗，請稍後再試。";
  }

  return error instanceof Error ? error.message : "路線操作失敗，請稍後再試。";
}

function unwrapResponse<T>(response: ApiResponse<T>) {
  if (response.code !== 0 || !response.data) {
    throw new Error(response.message || "路線操作失敗，請稍後再試。");
  }

  return response.data;
}

export async function getRoutes() {
  try {
    const response = await apiClient.get<ApiResponse<AdminRoute[]>>("/api/v1/routes");
    return unwrapResponse(response.data);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function createRoute(payload: RoutePayload) {
  try {
    const response = await apiClient.post<ApiResponse<AdminRoute>>(
      "/api/v1/admin/routes",
      payload,
    );
    return unwrapResponse(response.data);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function updateRoute(routeId: string, payload: RoutePayload) {
  try {
    const response = await apiClient.put<ApiResponse<AdminRoute>>(
      `/api/v1/admin/routes/${routeId}`,
      payload,
    );
    return unwrapResponse(response.data);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function deleteRoute(routeId: string) {
  try {
    const response = await apiClient.delete<ApiResponse<null>>(
      `/api/v1/admin/routes/${routeId}`,
    );

    if (response.data.code !== 0) {
      throw new Error(response.data.message || "刪除路線失敗，請稍後再試。");
    }
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
