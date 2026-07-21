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
  reservedPassengerCount?: number;
  cancelledCount: number;
  cancelledPassengerCount?: number;
  availableSeats: number;
  status: DailyOpenScheduleStatus;
}

interface RawDashboardReservation {
  reservationId?: string;
  dailyReservationId?: string;
  userId?: string;
  sequence?: number;
  sequenceNo?: number;
  passengerCount?: number | null;
  name?: string | null;
  customerName?: string | null;
  lineDisplayName?: string | null;
  displayName?: string | null;
  passengerName?: string | null;
  activeCode?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  customerPhoneNumber?: string | null;
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
  passengerCount: number;
  name: string;
  lineDisplayName: string;
  activeCode: string;
  phone: string;
  pickupStopId: string | null;
  pickupStopName: string;
  isAdminCreated: boolean;
  bookedAt: string;
  cancelledAt?: string;
  status: DashboardReservationStatus;
}

export interface CreateAdminReservationParams {
  name: string;
  phone: string;
  passengerCount: number;
  routeId: string;
  departureTime: string;
  openDate: string;
  pickupStopId: string;
}

export interface CreateAdminReservationResult {
  reservationId: string;
  dailyOpenScheduleId: string;
  routeId: string;
  routeNumber: string;
  departureTime: string;
  openDate: string;
  passengerCount: number;
  sequenceNo: number;
  status: DashboardReservationStatus;
  bookedAt: string;
}

export interface UpdateAdminReservationParams {
  name: string;
  phone: string;
  passengerCount: number;
  pickupStopId: string;
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
    passengerCount: Math.max(reservation.passengerCount ?? 1, 1),
    name:
      reservation.name ??
      reservation.customerName ??
      reservation.passengerName ??
      "未提供",
    lineDisplayName:
      reservation.lineDisplayName ??
      reservation.displayName ??
      "未提供",
    activeCode: activeCode || "-",
    phone: reservation.customerPhoneNumber ?? reservation.activeCode ?? "-",
    isAdminCreated: reservation.userId === null,
    pickupStopId: reservation.pickupStopId ?? null,
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

export async function createAdminReservation(
  payload: CreateAdminReservationParams,
) {
  try {
    const response = await apiClient.post<CreateAdminReservationResult>(
      "/api/v1/admin/reservations",
      payload,
    );

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function updateAdminReservation(
  reservationId: string,
  payload: UpdateAdminReservationParams,
) {
  try {
    await apiClient.put(`/api/v1/admin/reservations/${reservationId}`, payload);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function deleteAdminReservation(reservationId: string) {
  try {
    await apiClient.delete(`/api/v1/admin/reservations/${reservationId}`);
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
        reservedPassengerCount: data.reservedPassengerCount ?? data.reservedCount,
        cancelledCount: data.cancelledCount,
        cancelledPassengerCount:
          data.cancelledPassengerCount ?? data.cancelledCount,
        availableSeats: Math.max(
          data.quota - (data.reservedPassengerCount ?? data.reservedCount),
          0,
        ),
        status: data.status ?? "ACTIVE",
      },
      reservations: data.reservations
        .map(toDashboardReservation)
        .filter((reservation): reservation is DashboardReservation => Boolean(reservation)),
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
