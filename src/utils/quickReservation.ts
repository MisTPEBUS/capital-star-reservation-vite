import type { DashboardDailyOpenSchedule } from "../api/admin/dashboard";

export function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function matchesScheduleRouteHint(
  schedule: DashboardDailyOpenSchedule,
  routeHint: string,
) {
  const normalizedHint = routeHint.replace(/路線|線|\s/g, "").toLowerCase();
  if (!normalizedHint) return true;

  const routeNumber = schedule.routeNumber.replace(/\s/g, "").toLowerCase();
  const routeName = schedule.routeName
    .replace(/路線|線|\s/g, "")
    .toLowerCase();
  return (
    routeNumber === normalizedHint ||
    routeName.includes(normalizedHint) ||
    normalizedHint.includes(routeName)
  );
}
