import axios from "axios";
import apiClient from "../axiosInstance";

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export type RouteStatus = "ACTIVE" | "INACTIVE";

export interface RouteStop {
  routeStopId?: string;
  stopId: string;
  stopName: string;
  stopType: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  sequence: number;
  /** 從班次起點到此站的預估行車時間（分鐘）。 */
  arriveAt?: number;
  status?: string;
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

export interface RouteStopPayload {
  stopId: string;
  sequence: number;
  arriveAt?: number;
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    return error.response?.data?.message || "路線操作失敗，請稍後再試。";
  }

  return error instanceof Error ? error.message : "路線操作失敗，請稍後再試。";
}

function unwrapResponse<T>(response: ApiResponse<T>) {
  if (![0, 200].includes(response.code) || !response.data) {
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

export async function updateRouteStops(
  routeId: string,
  stops: RouteStopPayload[],
) {
  try {
    const response = await apiClient.put<ApiResponse<AdminRoute>>(
      `/api/v1/admin/routes/${routeId}/stops`,
      { stops },
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
