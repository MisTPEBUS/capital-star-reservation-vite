import type { OpenSchedule, PickupStop } from "../types/reservation";

const formatLocalDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const dateWithOffset = (offset: number) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
};

export const demoStops: PickupStop[] = [
  { stopId: "demo-yilan", stopName: "宜蘭轉運站", stopType: "MAIN_STATION", address: "宜蘭縣宜蘭市", shortLabel: "宜蘭" },
  { stopId: "demo-luodong", stopName: "羅東轉運站", stopType: "MAIN_STATION", address: "宜蘭縣羅東鎮", shortLabel: "羅東" },
  { stopId: "demo-wujie", stopName: "五結站", stopType: "ROADSIDE", address: "宜蘭縣五結鄉", shortLabel: "五結" },
];

export const demoDates = [1, 2].map((offset) => {
  const date = dateWithOffset(offset);
  return { value: formatLocalDate(date), label: `${date.getMonth() + 1}/${date.getDate()}` };
});

const createSchedule = (dateIndex: number, departureTime: string, seats: number, stopIds: string[]): OpenSchedule => {
  const openDate = demoDates[dateIndex].value;
  const deadline = formatLocalDate(dateWithOffset(dateIndex));
  return {
    dailyOpenScheduleId: `demo-${openDate}-${departureTime}`,
    routeId: "demo-route",
    scheduleCode: `CS1571-${departureTime.replace(":", "")}`,
    departureTime,
    arriveAt: 15,
    openDate,
    pickupStopIds: stopIds,
    quota: 20,
    reservedCount: 20 - seats,
    availableSeats: seats,
    bookingDeadline: `${deadline}T23:59:00`,
    userReservation: null,
    note: "僅供操作示範",
  };
};

export const demoSchedules: OpenSchedule[] = [
  createSchedule(0, "09:30", 12, demoStops.map((stop) => stop.stopId)),
  createSchedule(0, "14:30", 6, ["demo-yilan", "demo-luodong"]),
  createSchedule(0, "18:30", 0, ["demo-yilan", "demo-wujie"]),
  createSchedule(1, "08:30", 16, demoStops.map((stop) => stop.stopId)),
  createSchedule(1, "15:00", 9, ["demo-luodong", "demo-wujie"]),
];
