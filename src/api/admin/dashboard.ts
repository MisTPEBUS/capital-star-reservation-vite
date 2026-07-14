import axios from "axios";
import apiClient from "../axiosInstance";

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export type DailyOpenScheduleStatus = "ACTIVE" | "INACTIVE" | string;
export type DashboardReservationStatus = "RESERVED" | "CANCELLED" | string;

export interface DashboardDailyOpenSchedule {
  dailyOpenScheduleId: string;
  routeId: string;
  routeNumber: string;
  routeName: string;
  departureTime: string;
  openDate: string;
  quota: number;
  reservedCount: number;
  cancelledCount: number;
  availableSeats: number;
  status: DailyOpenScheduleStatus;
}

interface RawDashboardReservation {
  reservationId?: string;
  dailyReservationId?: string;
  userId?: string;
  sequence?: number;
  sequenceNo?: number;
  name?: string | null;
  lineDisplayName?: string | null;
  displayName?: string | null;
  passengerName?: string | null;
  activeCode?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  pickupStopId?: string | null;
  pickupStopName?: string | null;
  pickupStop?: { stopName?: string | null } | null;
  bookedAt?: string | null;
  createdAt?: string | null;
  cancelledAt?: string | null;
  status?: DashboardReservationStatus;
}

interface RawDashboardScheduleReservations extends DashboardDailyOpenSchedule {
  reservations: RawDashboardReservation[];
}

export interface DashboardReservation {
  reservationId: string;
  sequence: number;
  name: string;
  lineDisplayName: string;
  activeCode: string;
  phone: string;
  pickupStopName: string;
  bookedAt: string;
  cancelledAt: string;
  status: DashboardReservationStatus;
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    return error.response?.data?.message || "Dashboard 資料讀取失敗。";
  }

  return error instanceof Error ? error.message : "Dashboard 資料讀取失敗。";
}

function unwrapResponse<T>(response: ApiResponse<T>) {
  if (response.code !== 0 || !response.data) {
    throw new Error(response.message || "Dashboard 資料讀取失敗。");
  }

  return response.data;
}

function toDashboardReservation(
  reservation: RawDashboardReservation,
  index: number,
): DashboardReservation | null {
  const reservationId = reservation.reservationId ?? reservation.dailyReservationId;
  const activeCode = reservation.activeCode ?? "";

  if (!reservationId && !activeCode && !reservation.userId) {
    return null;
  }

  return {
    reservationId: reservationId ?? `${reservation.userId ?? "reservation"}-${index}`,
    sequence: reservation.sequenceNo ?? reservation.sequence ?? index + 1,
    name: reservation.name ?? reservation.passengerName ?? "未提供",
    lineDisplayName:
      reservation.lineDisplayName ??
      reservation.displayName ??
      "未提供",
    activeCode: activeCode || "-",
    phone: reservation.phoneNumber ?? reservation.phone ?? "-",
    pickupStopName:
      reservation.pickupStopName ?? reservation.pickupStop?.stopName ?? "-",
    bookedAt: reservation.bookedAt ?? reservation.createdAt ?? "-",
    cancelledAt: reservation.cancelledAt ?? "-",
    status: reservation.status ?? "RESERVED",
  };
}

export async function getDashboardDailyOpenSchedules(openDate: string) {
  try {
    const response = await apiClient.get<ApiResponse<DashboardDailyOpenSchedule[]>>(
      "/api/v1/admin/dashboard/daily-open-schedules",
      { params: { openDate } },
    );

    return unwrapResponse(response.data);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getDashboardScheduleReservations(
  dailyOpenScheduleId: string,
) {
  try {
    const response = await apiClient.get<ApiResponse<RawDashboardScheduleReservations>>(
      `/api/v1/admin/dashboard/daily-open-schedules/${dailyOpenScheduleId}/reservations`,
    );
    const data = unwrapResponse(response.data);

    return {
      schedule: {
        dailyOpenScheduleId: data.dailyOpenScheduleId,
        routeId: data.routeId,
        routeNumber: data.routeNumber,
        routeName: data.routeName,
        departureTime: data.departureTime,
        openDate: data.openDate,
        quota: data.quota,
        reservedCount: data.reservedCount,
        cancelledCount: data.cancelledCount,
        availableSeats: Math.max(data.quota - data.reservedCount, 0),
        status: data.status,
      },
      reservations: data.reservations
        .map(toDashboardReservation)
        .filter((reservation): reservation is DashboardReservation => Boolean(reservation)),
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
