import type {
  BookingRestrictionList,
  BookingRestrictionQuery,
  BookingRestrictionSummary,
  BookingRestrictionUser,
  BookingRestrictionUserDetail,
} from "../../api/admin/bookingRestrictions";

const restrictionId = "preview-restriction-16486670";
const restrictedAt = "2026-09-15T09:20:00+08:00";
const restrictedUntil = "2026-10-15T09:20:00+08:00";
const lastNoShowAt = "2026-09-14T08:30:00+08:00";

const user: BookingRestrictionUser = {
  userId: "preview-16486670",
  activeCode: "16486670",
  displayName: "王先生",
  phone: null,
  noShowCount: 3,
  status: "BLOCKED",
  currentRestrictionId: restrictionId,
  restrictedAt,
  restrictedUntil,
  lastNoShowAt,
};

const restriction: NonNullable<BookingRestrictionUserDetail["currentRestriction"]> = {
  restrictionId,
  reasonCode: "NO_SHOW_3",
  triggerCount: 3,
  restrictedAt,
  restrictedUntil,
  status: "ACTIVE",
  releasedAt: null,
  releasedBy: null,
  releasedByName: null,
  releaseReason: null,
};

export const previewSummary: BookingRestrictionSummary = {
  blockedCount: 1,
  warningCount: 0,
  warningOneCount: 0,
  warningTwoCount: 0,
  releasedTodayCount: 0,
};

export function getPreviewUsers(query: BookingRestrictionQuery): BookingRestrictionList {
  const keyword = query.keyword?.trim().toLowerCase() ?? "";
  const matchesKeyword = [user.activeCode, user.displayName].some((value) =>
    value.toLowerCase().includes(keyword),
  );
  const matchesStatus = !query.status || query.status === user.status;
  const items = matchesKeyword && matchesStatus ? [user] : [];
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;

  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    totalCount: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
  };
}

export const previewUserDetail: BookingRestrictionUserDetail = {
  user: {
    userId: user.userId,
    activeCode: user.activeCode,
    displayName: user.displayName,
    phone: user.phone,
  },
  state: {
    userId: user.userId,
    noShowCount: user.noShowCount,
    lastResetAt: null,
    lastNoShowAt: user.lastNoShowAt,
    currentRestrictionId: user.currentRestrictionId,
    restrictedAt: user.restrictedAt,
    restrictedUntil: user.restrictedUntil,
    status: user.status,
  },
  currentRestriction: restriction,
  currentNoShowReservations: [
    {
      reservationId: "preview-reservation-1",
      dailyOpenScheduleId: "preview-schedule-1",
      openDate: "2026-08-18",
      departureTime: "08:30",
      routeNumber: "1570",
      pickupStopName: "壯圍",
      determinedNoShowAt: "2026-08-18T08:30:00+08:00",
    },
    {
      reservationId: "preview-reservation-2",
      dailyOpenScheduleId: "preview-schedule-2",
      openDate: "2026-09-02",
      departureTime: "09:10",
      routeNumber: "1571",
      pickupStopName: "頭城",
      determinedNoShowAt: "2026-09-02T09:10:00+08:00",
    },
    {
      reservationId: "preview-reservation-3",
      dailyOpenScheduleId: "preview-schedule-3",
      openDate: "2026-09-14",
      departureTime: "08:30",
      routeNumber: "1570",
      pickupStopName: "壯圍",
      determinedNoShowAt: lastNoShowAt,
    },
  ],
  restrictionHistory: [restriction],
};
