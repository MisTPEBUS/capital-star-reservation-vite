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

export interface CreateReservationResult {
  reservationId: string;
  dailyOpenScheduleId: string;
  userId: string;
  routeId: string;
  routeNumber: string;
  departureTime: string;
  openDate: string;
  pickupStop: ReservationStop;
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
  lineUserId: string;
}

function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    const responseData = error.response?.data;
    const validationMessages = responseData?.errors
      ? Object.values(responseData.errors).flat()
      : [];

    return (
      validationMessages[0] ??
      responseData?.message ??
      error.message ??
      "預約建立失敗"
    );
  }

  if (error instanceof Error) return error.message;

  return "預約建立失敗";
}

export async function createReservation({
  userId,
  routeId,
  departureTime,
  openDate,
  pickupStopId,
  lineUserId,
}: CreateReservationParams) {
  try {
    const response = await apiClient.post<ApiResponse<CreateReservationResult>>(
      "/api/v1/reservations",
      {
        UserId: userId,
        RouteId: routeId,
        DepartureTime: departureTime,
        OpenDate: openDate,
        PickupStopId: pickupStopId,
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
