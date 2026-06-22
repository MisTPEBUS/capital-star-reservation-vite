import axios from "axios";
import apiClient from "./axiosInstance";
import type { OpenSchedule, ReservationStatus } from "../types/reservation";

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
  errors?: Record<string, string[]>;
}

interface ScheduleApiItem {
  dailyOpenScheduleId: string;
  routeId: string;
  name: string;
  departureTime: string;
  openDate: string;
  quota: number;
  availableSeats: number;
  bookingDeadline: string;
  userReservation: unknown;
}

export interface SchedulesApiData {
  canReserve: boolean;
  activeReservation: unknown;
  schedules: ScheduleApiItem[];
}

export interface SchedulesResult {
  canReserve: boolean;
  activeReservation: unknown;
  schedules: OpenSchedule[];
}

interface GetSchedulesParams {
  date: string;
  pickupStopId: string;
  lineUserId: string;
}

function normalizeReservationStatus(userReservation: unknown): ReservationStatus {
  if (!userReservation) return null;
  return "RESERVED";
}

function normalizeDepartureTime(departureTime: string) {
  return departureTime.length >= 5 ? departureTime.slice(0, 5) : departureTime;
}

function toOpenSchedule(
  schedule: ScheduleApiItem,
  pickupStopId: string,
): OpenSchedule {
  return {
    dailyOpenScheduleId: schedule.dailyOpenScheduleId,
    routeId: schedule.routeId,
    scheduleCode: schedule.name,
    departureTime: normalizeDepartureTime(schedule.departureTime),
    openDate: schedule.openDate,
    pickupStopIds: [pickupStopId],
    quota: schedule.quota,
    reservedCount: Math.max(schedule.quota - schedule.availableSeats, 0),
    availableSeats: schedule.availableSeats,
    bookingDeadline: schedule.bookingDeadline,
    userReservation: normalizeReservationStatus(schedule.userReservation),
    note: `剩餘 ${schedule.availableSeats} / ${schedule.quota} 位`,
  };
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
      "班次資料讀取失敗"
    );
  }

  if (error instanceof Error) return error.message;

  return "班次資料讀取失敗";
}

export async function getSchedules({
  date,
  pickupStopId,
  lineUserId,
}: GetSchedulesParams): Promise<SchedulesResult> {
  try {
    const response = await apiClient.get<ApiResponse<SchedulesApiData>>(
      "/api/v1/schedules",
      {
        headers: {
          "X-Line-User-Id": lineUserId,
        },
        params: {
          Date: date,
          PickupStopId: pickupStopId,
        },
      },
    );

    const data = response.data.data;

    return {
      canReserve: data.canReserve,
      activeReservation: data.activeReservation,
      schedules: data.schedules.map((schedule) =>
        toOpenSchedule(schedule, pickupStopId),
      ),
    };
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}
