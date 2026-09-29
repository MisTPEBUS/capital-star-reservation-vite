import apiClient from "../axiosInstance";

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

export type BookingRestrictionStatus = "NORMAL" | "WARNING" | "BLOCKED";

export interface BookingRestrictionSummary {
  blockedCount: number;
  warningCount: number;
  warningOneCount: number;
  warningTwoCount: number;
  releasedTodayCount: number;
}

export interface BookingRestrictionUser {
  userId: string;
  activeCode: string;
  displayName: string;
  phone: string | null;
  noShowCount: number;
  status: BookingRestrictionStatus;
  currentRestrictionId: string | null;
  restrictedAt: string | null;
  restrictedUntil: string | null;
  lastNoShowAt: string | null;
}

export interface BookingRestrictionQuery {
  keyword?: string;
  status?: BookingRestrictionStatus;
  page?: number;
  pageSize?: number;
}

export interface BookingRestrictionList {
  items: BookingRestrictionUser[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface BookingRestrictionState {
  userId: string;
  noShowCount: number;
  lastResetAt: string | null;
  lastNoShowAt: string | null;
  currentRestrictionId: string | null;
  restrictedAt: string | null;
  restrictedUntil: string | null;
  status: BookingRestrictionStatus;
}

export interface BookingRestriction {
  restrictionId: string;
  reasonCode: string;
  triggerCount: number;
  restrictedAt: string;
  restrictedUntil: string;
  status: "ACTIVE" | "RELEASED" | "EXPIRED";
  releasedAt: string | null;
  releasedBy: string | null;
  releasedByName: string | null;
  releaseReason: string | null;
}

export interface NoShowReservation {
  reservationId: string;
  dailyOpenScheduleId: string;
  openDate: string;
  departureTime: string;
  routeNumber: string;
  pickupStopName: string;
  determinedNoShowAt: string;
}

export interface BookingRestrictionUserDetail {
  user: Pick<BookingRestrictionUser, "userId" | "activeCode" | "displayName" | "phone">;
  state: BookingRestrictionState;
  currentRestriction: BookingRestriction | null;
  currentNoShowReservations: NoShowReservation[];
  restrictionHistory: BookingRestriction[];
}

export interface ReleaseBookingRestrictionResult {
  restriction: BookingRestriction;
  state: BookingRestrictionState;
}

function getData<T>(response: ApiResponse<T>, fallback: string): T {
  if (response.code !== 0 || response.data == null) {
    throw new Error(response.message || fallback);
  }
  return response.data;
}

export async function getBookingRestrictionSummary() {
  const response = await apiClient.get<ApiResponse<BookingRestrictionSummary>>(
    "/api/v1/admin/booking-restrictions/summary",
  );
  return getData(response.data, "預約限制統計讀取失敗。");
}

export async function getBookingRestrictionUsers(query: BookingRestrictionQuery = {}) {
  const response = await apiClient.get<ApiResponse<BookingRestrictionList>>(
    "/api/v1/admin/booking-restrictions/users",
    { params: query },
  );
  return getData(response.data, "預約限制列表讀取失敗。");
}

export async function getBookingRestrictionUser(userId: string) {
  const response = await apiClient.get<ApiResponse<BookingRestrictionUserDetail>>(
    `/api/v1/admin/booking-restrictions/users/${encodeURIComponent(userId)}`,
  );
  return getData(response.data, "會員限制明細讀取失敗。");
}

export async function releaseBookingRestriction(restrictionId: string, reason: string) {
  const response = await apiClient.post<ApiResponse<ReleaseBookingRestrictionResult>>(
    `/api/v1/admin/booking-restrictions/${encodeURIComponent(restrictionId)}/release`,
    { reason },
  );
  return getData(response.data, "提前解除限制失敗。");
}
