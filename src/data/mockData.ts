import type {
  OpenSchedule,
  PassengerProfile,
  RouteInfo,
} from "../types/reservation";

export const passengerProfile: PassengerProfile = {
  userId: "usr_mock_0001",
  displayName: "Lobinda",
  activeCode: "66797168",
  phoneNumber: "0912-345-678",
  email: null,
  status: "ACTIVE",
  membershipLabel: "預約會員",
};

export const routes: RouteInfo[] = [
  {
    routeId: "route_yilan_wujie",
    routeNumber: "1571",
    routeName: "宜蘭 — 五結旅遊線",
    description: "Capital Star 藍色旅遊車款，適合活動接駁與景點預約。",
    stops: [
      {
        stopId: "06ebaefd-4b77-41a1-ac51-740372345b84",
        stopName: "頭城",
        stopType: "TRANSIT",
        address: "宜蘭縣頭城鎮",
        shortLabel: "頭城",
      },
      {
        stopId: "440e3872-ea19-44f2-b27e-1db0bc9702c7",
        stopName: "壯圍",
        stopType: "MAIN_STATION",
        address: "宜蘭縣壯圍鄉",
        shortLabel: "壯圍",
      },
      {
        stopId: "596e0845-8463-4004-a6f8-a9e0a907f17b",
        stopName: "五結",
        stopType: "MAIN_STATION",
        address: "宜蘭縣五結鄉",
        shortLabel: "五結",
      },
    ],
  },
];

export const openSchedules: OpenSchedule[] = [
  {
    dailyOpenScheduleId: "dos_20260619_0530",
    routeId: "route_yilan_wujie",
    scheduleCode: "CS1571-0530",
    departureTime: "05:30",
    openDate: "2026-06-19",
    pickupStopIds: ["stop_yilan_transfer", "stop_luodong"],
    quota: 20,
    reservedCount: 5,
    availableSeats: 15,
    bookingDeadline: "前一天 18:00",
    userReservation: null,
    note: "清晨出發，適合一日遊首班。",
  },
  {
    dailyOpenScheduleId: "dos_20260619_0600",
    routeId: "route_yilan_wujie",
    scheduleCode: "CS1571-0600",
    departureTime: "06:00",
    openDate: "2026-06-19",
    pickupStopIds: [
      "stop_yilan_transfer",
      "stop_luodong",
      "stop_wujie_tourism",
    ],
    quota: 20,
    reservedCount: 13,
    availableSeats: 7,
    bookingDeadline: "前一天 18:00",
    userReservation: null,
    note: "熱門班次，建議提前預約。",
  },
  {
    dailyOpenScheduleId: "dos_20260619_0630",
    routeId: "route_yilan_wujie",
    scheduleCode: "CS1571-0630",
    departureTime: "06:30",
    openDate: "2026-06-19",
    pickupStopIds: [
      "stop_yilan_transfer",
      "stop_luodong",
      "stop_wujie_tourism",
    ],
    quota: 18,
    reservedCount: 18,
    availableSeats: 0,
    bookingDeadline: "前一天 18:00",
    userReservation: null,
    note: "本班次目前已額滿。",
  },
  {
    dailyOpenScheduleId: "dos_20260619_0700",
    routeId: "route_yilan_wujie",
    scheduleCode: "CS1571-0700",
    departureTime: "07:00",
    openDate: "2026-06-19",
    pickupStopIds: [
      "stop_yilan_transfer",
      "stop_wujie_tourism",
      "stop_dongshan_river",
    ],
    quota: 20,
    reservedCount: 9,
    availableSeats: 11,
    bookingDeadline: "前一天 18:00",
    userReservation: null,
    note: "上午主力班次，車內空間較充裕。",
  },
  {
    dailyOpenScheduleId: "dos_20260619_0930",
    routeId: "route_yilan_wujie",
    scheduleCode: "CS1571-0930",
    departureTime: "09:30",
    openDate: "2026-06-19",
    pickupStopIds: [
      "stop_luodong",
      "stop_wujie_tourism",
      "stop_dongshan_river",
    ],
    quota: 20,
    reservedCount: 3,
    availableSeats: 17,
    bookingDeadline: "前一天 18:00",
    userReservation: null,
    note: "適合較晚出發的旅客。",
  },
  {
    dailyOpenScheduleId: "dos_20260619_1430",
    routeId: "route_yilan_wujie",
    scheduleCode: "CS1571-1430",
    departureTime: "14:30",
    openDate: "2026-06-19",
    pickupStopIds: [
      "stop_yilan_transfer",
      "stop_luodong",
      "stop_wujie_tourism",
      "stop_dongshan_river",
    ],
    quota: 18,
    reservedCount: 6,
    availableSeats: 12,
    bookingDeadline: "前一天 18:00",
    userReservation: null,
    note: "午後旅遊彈性班次。",
  },
  {
    dailyOpenScheduleId: "dos_20260620_0600",
    routeId: "route_yilan_wujie",
    scheduleCode: "CS1571-0600",
    departureTime: "06:00",
    openDate: "2026-06-20",
    pickupStopIds: [
      "stop_yilan_transfer",
      "stop_luodong",
      "stop_wujie_tourism",
    ],
    quota: 20,
    reservedCount: 2,
    availableSeats: 18,
    bookingDeadline: "前一天 18:00",
    userReservation: null,
    note: "隔日預約開放中。",
  },
  {
    dailyOpenScheduleId: "dos_20260620_0730",
    routeId: "route_yilan_wujie",
    scheduleCode: "CS1571-0730",
    departureTime: "07:30",
    openDate: "2026-06-20",
    pickupStopIds: [
      "stop_yilan_transfer",
      "stop_wujie_tourism",
      "stop_dongshan_river",
    ],
    quota: 20,
    reservedCount: 8,
    availableSeats: 12,
    bookingDeadline: "前一天 18:00",
    userReservation: "RESERVED",
    note: "你已預約此日期的班次。",
  },
  {
    dailyOpenScheduleId: "dos_20260620_1500",
    routeId: "route_yilan_wujie",
    scheduleCode: "CS1571-1500",
    departureTime: "15:00",
    openDate: "2026-06-20",
    pickupStopIds: [
      "stop_luodong",
      "stop_wujie_tourism",
      "stop_dongshan_river",
    ],
    quota: 15,
    reservedCount: 10,
    availableSeats: 5,
    bookingDeadline: "前一天 18:00",
    userReservation: null,
    note: "下午限定班次。",
  },
];

function toLocalDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getAvailableDates() {
  const today = new Date();

  return [0, 1].map((offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);

    return {
      value: toLocalDateValue(date),
      label: `${date.getMonth() + 1}/${date.getDate()}`,
    };
  });
}
