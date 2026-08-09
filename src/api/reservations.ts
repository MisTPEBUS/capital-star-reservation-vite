import axios from "axios";
import apiClient from "./axiosInstance";

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
  errors?: Record<string, string[]>;
}

interface ReservationStop {
  stopId: string;
  stopName: string;
  stopType: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  sequence: number;
}

export interface UpcomingReservation {
  reservationId: string;
  sequenceNo?: number | null;
  routeId: string;
  routeNumber: string;
  departureTime: string;
  openDate: string;
  pickupStop: ReservationStop;
  passengerCount?: number | null;
  status: "RESERVED" | "CANCELLED";
  bookedAt: string;
}

export interface RecentReservation extends UpcomingReservation {
  checkIn_at: string;
}

export type CheckInDevice = "MOBILE" | "PC";

export interface CheckInReservationParams {
  reservationId: string;
  lat: number;
  lon: number;
  checkIn_DEVICE: CheckInDevice;
}

export interface CheckInReservationResult {
  reservationId: string;
  checkIn_at: string;
  checkIn_DEVICE: CheckInDevice;
}

export interface CreateReservationResult {
  reservationId: string;
  sequenceNo?: number | null;
  dailyOpenScheduleId: string;
  userId: string;
  routeId: string;
  routeNumber: string;
  departureTime: string;
  openDate: string;
  pickupStop: ReservationStop;
  passengerCount?: number | null;
  status: "RESERVED" | "CANCELLED";
  bookedAt: string;
  qrCode: string;
}

interface CreateReservationParams {
  userId: string;
  routeId: string;
  departureTime: string;
  openDate: string;
  pickupStopId: string;
  name: string;
  passengerCount: number;
  lineUserId: string;
}

function getApiErrorMessage(error: unknown, fallback = "預約建立失敗") {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    const responseData = error.response?.data;
    const validationMessages = responseData?.errors
      ? Object.values(responseData.errors).flat()
      : [];

    return (
      validationMessages[0] ??
      responseData?.message ??
      error.message ??
      fallback
    );
  }

  if (error instanceof Error) return error.message;

  return fallback;
}

export async function createReservation({
  userId,
  routeId,
  departureTime,
  openDate,
  pickupStopId,
  name,
  passengerCount,
  lineUserId,
}: CreateReservationParams) {
  try {
    const response = await apiClient.post<ApiResponse<CreateReservationResult>>(
      "/api/v1/reservations",
      {
        userId,
        routeId,
        departureTime,
        openDate,
        pickupStopId,
        name,
        passengerCount,
      },
      {
        headers: {
          "X-Line-User-Id": lineUserId,
        },
      },
    );

    return response.data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function getUpcomingReservations(userId: string) {
  try {
    const response = await apiClient.get<ApiResponse<UpcomingReservation[]>>(
      "/api/v1/reservations/upcoming",
      {
        params: {
          userId,
        },
      },
    );

    return response.data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function getRecentReservations(userId: string) {
  try {
    const response = await apiClient.get<ApiResponse<RecentReservation[]>>(
      "/api/v1/reservations/recent",
      {
        params: { userId },
      },
    );

    return response.data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function checkInReservation(params: CheckInReservationParams) {
  try {
    const response = await apiClient.post<
      ApiResponse<CheckInReservationResult>
    >("/api/v1/reservations/check-in", params, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return response.data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "核銷失敗，請稍後再試。"));
  }
}

export async function cancelReservation(reservationId: string, userId: string) {
  try {
    await apiClient.delete<ApiResponse<null>>(
      `/api/v1/reservations/${reservationId}`,
      {
        params: { userId },
      },
    );
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}
