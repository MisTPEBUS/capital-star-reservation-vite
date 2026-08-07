export const pickupDays = ["T-7", "T-6", "T-5", "T-4", "T-3", "T-2", "T-1", "T-0"];

export const pickupSeries = [
  { name: "7/10", color: "#91aeb8", values: [8, 14, 22, 31, 43, 58, 77, 94] },
  { name: "7/17", color: "#7d9da8", values: [10, 16, 24, 34, 45, 61, 80, 96] },
  { name: "7/24", color: "#aac0c7", values: [7, 15, 23, 32, 47, 63, 82, 98] },
  { name: "7/31", color: "#688b97", values: [9, 17, 25, 36, 49, 64, 84, 100] },
  { name: "本班 8/8", color: "#34d399", values: [11, 19, 29, 41, 55, 71, null, null], current: true },
];

export const tomorrowLoads = [
  { route: "1571", time: "06:30", booked: 18, capacity: 40 },
  { route: "1571", time: "07:00", booked: 43, capacity: 40 },
  { route: "1571", time: "07:30", booked: 36, capacity: 40 },
  { route: "1572", time: "08:00", booked: 9, capacity: 40 },
  { route: "1572", time: "09:30", booked: 26, capacity: 40 },
  { route: "1573", time: "14:00", booked: 12, capacity: 40 },
  { route: "1573", time: "17:30", booked: 39, capacity: 40 },
];

export const pickupWarnings = [
  { id: "w1", route: "1572", time: "08:00", departure: "8/8", current: 23, historical: 46, gap: -23, action: "評估併班" },
  { id: "w2", route: "1573", time: "14:00", departure: "8/8", current: 30, historical: 49, gap: -19, action: "持續觀察" },
  { id: "w3", route: "1571", time: "10:30", departure: "8/9", current: 18, historical: 34, gap: -16, action: "檢查通路" },
  { id: "w4", route: "1572", time: "16:00", departure: "8/9", current: 27, historical: 39, gap: -12, action: "持續觀察" },
];

export const heatmapPeriods = ["06–08", "08–10", "10–12", "12–14", "14–16", "16–18", "18–20"];
export const heatmapRows = [
  { route: "1571", values: [92, 84, 71, 55, 63, 88, 95] },
  { route: "1572", values: [48, 59, 67, 42, 38, 62, 79] },
  { route: "1573", values: [31, 44, 53, 36, 29, 47, 65] },
  { route: "1575", values: [76, 69, 61, 50, 57, 73, 86] },
];

export const noShowRates = [
  { label: "1572 08:00", rate: 14.8 },
  { label: "1573 14:00", rate: 11.6 },
  { label: "1571 10:30", rate: 8.9 },
  { label: "1575 18:00", rate: 6.2 },
  { label: "1571 07:00", rate: 4.1 },
  { label: "1572 09:30", rate: 3.5 },
];

export const cancellationBuckets = [
  { label: "< 1 小時", count: 38 },
  { label: "1–3 小時", count: 27 },
  { label: "3–6 小時", count: 18 },
  { label: "6–12 小時", count: 13 },
  { label: "12–24 小時", count: 22 },
  { label: "1–2 天", count: 31 },
  { label: "> 2 天", count: 19 },
];

export const channelShares = [
  { route: "1571", web: 78, phone: 22 },
  { route: "1572", web: 61, phone: 39 },
  { route: "1573", web: 43, phone: 57 },
  { route: "1575", web: 69, phone: 31 },
];

export const retentionMonths = ["M0", "M1", "M2", "M3", "M4", "M5"];
export const retentionSeries = [
  { name: "3 月", color: "#34d399", values: [100, 57, 46, 41, 38, 35] },
  { name: "4 月", color: "#60a5fa", values: [100, 61, 49, 43, 39, null] },
  { name: "5 月", color: "#fbbf24", values: [100, 55, 45, 40, null, null] },
  { name: "6 月", color: "#c084fc", values: [100, 63, 51, null, null, null] },
];
