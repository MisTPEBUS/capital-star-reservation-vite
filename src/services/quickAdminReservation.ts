import {
  createAdminReservation,
  getDashboardScheduleReservations,
  type DashboardDailyOpenSchedule,
} from "../api/admin/dashboard";
import { getRoutes } from "../api/admin/routes";

export interface QuickAdminReservationInput {
  name: string;
  phone: string;
  passengerCount: number;
}

export async function createQuickAdminReservation(
  schedule: DashboardDailyOpenSchedule,
  reservation: QuickAdminReservationInput,
) {
  const [routes, scheduleReservations] = await Promise.all([
    getRoutes(),
    getDashboardScheduleReservations(schedule.dailyOpenScheduleId),
  ]);
  const route = routes.find((item) => item.routeId === schedule.routeId);
  const pickupStopId =
    scheduleReservations.reservations.find(
      (existingReservation) => existingReservation.pickupStopId,
    )?.pickupStopId ??
    [...(route?.stops ?? [])].sort(
      (left, right) => left.sequence - right.sequence,
    )[0]?.stopId;

  if (!pickupStopId) {
    throw new Error("此路線沒有可用上車站，無法建立預約。");
  }

  const created = await createAdminReservation({
    name: reservation.name.trim(),
    phone: reservation.phone.trim(),
    passengerCount: reservation.passengerCount,
    routeId: schedule.routeId,
    departureTime: schedule.departureTime.slice(0, 5),
    openDate: schedule.openDate,
    pickupStopId,
  });

  return {
    ...created,
    dailyOpenScheduleId:
      created.dailyOpenScheduleId || schedule.dailyOpenScheduleId,
    routeId: created.routeId || schedule.routeId,
    routeNumber: created.routeNumber || schedule.routeNumber,
    departureTime: created.departureTime || schedule.departureTime,
    openDate: created.openDate || schedule.openDate,
  };
}
