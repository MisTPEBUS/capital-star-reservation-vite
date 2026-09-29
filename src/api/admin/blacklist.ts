export type BlacklistStatus = "ACTIVE" | "RELEASED";

export interface UnredeemedReservation {
  reservationId: string;
  dailyOpenScheduleId: string;
  routeNumber: string;
  openDate: string;
  departureTime: string;
}

export interface BlacklistEntry {
  blacklistId: string;
  activeCode: string;
  displayName: string;
  phone: string | null;
  unredeemedCount: number;
  unredeemedReservations: UnredeemedReservation[];
  createdAt: string;
  status: BlacklistStatus;
  releasedAt: string | null;
}

export interface BlacklistQuery {
  keyword: string;
  status: BlacklistStatus | "ALL";
  page: number;
  pageSize: number;
}

export interface BlacklistListResult {
  items: BlacklistEntry[];
  totalCount: number;
  page: number;
  pageSize: number;
}

function createMissedReservations(
  blacklistId: string,
  values: Array<[openDate: string, departureTime: string, routeNumber: string]>,
): UnredeemedReservation[] {
  return values.map(([openDate, departureTime, routeNumber], index) => ({
    reservationId: `${blacklistId}-reservation-${index + 1}`,
    dailyOpenScheduleId: `${blacklistId}-schedule-${index + 1}`,
    routeNumber,
    openDate,
    departureTime,
  }));
}

let mockEntries: BlacklistEntry[] = [
  {
    blacklistId: "blacklist-001",
    activeCode: "16486670",
    displayName: "王小明",
    phone: "0912-345-678",
    unredeemedCount: 3,
    unredeemedReservations: createMissedReservations("blacklist-001", [
      ["2026-08-18", "08:30", "1570"],
      ["2026-09-02", "09:10", "1571"],
      ["2026-09-14", "08:30", "1570"],
    ]),
    createdAt: "2026-09-15T09:20:00+08:00",
    status: "ACTIVE",
    releasedAt: null,
  },
  {
    blacklistId: "blacklist-002",
    activeCode: "16486682",
    displayName: "林怡君",
    phone: "0921-456-789",
    unredeemedCount: 4,
    unredeemedReservations: createMissedReservations("blacklist-002", [
      ["2026-07-22", "07:00", "1571"],
      ["2026-08-06", "08:30", "1570"],
      ["2026-08-28", "07:00", "1571"],
      ["2026-09-11", "10:00", "1570"],
    ]),
    createdAt: "2026-09-12T14:05:00+08:00",
    status: "ACTIVE",
    releasedAt: null,
  },
  {
    blacklistId: "blacklist-003",
    activeCode: "16486691",
    displayName: "張志豪",
    phone: "0933-567-890",
    unredeemedCount: 3,
    unredeemedReservations: createMissedReservations("blacklist-003", [
      ["2026-06-18", "06:30", "1570"],
      ["2026-07-03", "08:30", "1570"],
      ["2026-07-31", "09:10", "1571"],
    ]),
    createdAt: "2026-08-01T10:30:00+08:00",
    status: "RELEASED",
    releasedAt: "2026-08-16T11:00:00+08:00",
  },
  {
    blacklistId: "blacklist-004",
    activeCode: "16486703",
    displayName: "李美玲",
    phone: null,
    unredeemedCount: 3,
    unredeemedReservations: createMissedReservations("blacklist-004", [
      ["2026-08-24", "08:30", "1570"],
      ["2026-09-01", "08:30", "1570"],
      ["2026-09-09", "07:00", "1571"],
    ]),
    createdAt: "2026-09-10T16:40:00+08:00",
    status: "ACTIVE",
    releasedAt: null,
  },
  {
    blacklistId: "blacklist-005",
    activeCode: "16486718",
    displayName: "陳冠宇",
    phone: "0988-123-456",
    unredeemedCount: 3,
    unredeemedReservations: createMissedReservations("blacklist-005", [
      ["2026-08-16", "09:10", "1571"],
      ["2026-08-30", "09:10", "1571"],
      ["2026-09-13", "08:30", "1570"],
    ]),
    createdAt: "2026-09-14T08:10:00+08:00",
    status: "ACTIVE",
    releasedAt: null,
  },
];

function copyEntry(entry: BlacklistEntry): BlacklistEntry {
  return {
    ...entry,
    unredeemedReservations: entry.unredeemedReservations.map((item) => ({
      ...item,
    })),
  };
}

export async function getBlacklistEntries(
  query: BlacklistQuery,
): Promise<BlacklistListResult> {
  const keyword = query.keyword.trim().toLowerCase();
  const filteredEntries = mockEntries.filter((entry) => {
    const matchesStatus = query.status === "ALL" || entry.status === query.status;
    const matchesKeyword =
      !keyword ||
      [entry.activeCode, entry.displayName, entry.phone]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(keyword));

    return matchesStatus && matchesKeyword;
  });
  const startIndex = (query.page - 1) * query.pageSize;

  return Promise.resolve({
    items: filteredEntries
      .slice(startIndex, startIndex + query.pageSize)
      .map(copyEntry),
    totalCount: filteredEntries.length,
    page: query.page,
    pageSize: query.pageSize,
  });
}

export async function releaseBlacklistEntry(
  blacklistId: string,
): Promise<BlacklistEntry> {
  const entry = mockEntries.find((item) => item.blacklistId === blacklistId);
  if (!entry) throw new Error("找不到指定的黑名單紀錄。");

  const releasedEntry: BlacklistEntry = {
    ...entry,
    status: "RELEASED",
    releasedAt: new Date().toISOString(),
  };
  mockEntries = mockEntries.map((item) =>
    item.blacklistId === blacklistId ? releasedEntry : item,
  );

  return Promise.resolve(copyEntry(releasedEntry));
}
