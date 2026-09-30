import type { UpcomingReservation } from "../api/reservations";

const DEFAULT_MESSAGE = "乘車時請出示此畫面，並依預約日期與班次時刻到站候車。";
const HOUR_MS = 60 * 60 * 1000;

function getTaiwanDate(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function isWithinReservationCheckInWindow(
  reservation: UpcomingReservation,
  now: Date,
) {
  const travelDate = reservation.openDate.slice(0, 10);
  const time = reservation.departureTime.match(/^(\d{1,2}):(\d{2})/);
  if (!time) return false;

  const departure =
    Date.parse(`${travelDate}T00:00:00+08:00`) +
    (Number(time[1]) * 60 + Number(time[2])) * 60_000;

  return (
    now.getTime() >= departure - HOUR_MS &&
    now.getTime() < departure + HOUR_MS
  );
}

export function getReservationTicketMessage(
  reservation: UpcomingReservation,
  checkedInAt: string | null | undefined,
  now: Date,
) {
  const travelDate = reservation.openDate.slice(0, 10);
  const today = getTaiwanDate(now);

  if (travelDate < today) {
    return "此為逾期乘車票證，僅供歷史存查使用。";
  }

  if (travelDate !== today || checkedInAt?.trim()) {
    return DEFAULT_MESSAGE;
  }

  const time = reservation.departureTime.match(/^(\d{1,2}):(\d{2})/);
  if (!time) return DEFAULT_MESSAGE;

  const departure =
    Date.parse(`${travelDate}T00:00:00+08:00`) +
    (Number(time[1]) * 60 + Number(time[2])) * 60_000;

  if (now.getTime() < departure - HOUR_MS) {
    return "乘車時請出示此畫面，並開啟定位功能進行核銷。";
  }

  if (isWithinReservationCheckInWindow(reservation, now)) {
    return `請關閉頁面重新點選。${DEFAULT_MESSAGE}`;
  }

  return DEFAULT_MESSAGE;
}
