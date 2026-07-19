import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FaCaretLeft, FaCaretRight } from "react-icons/fa";
import { CalendarIcon } from "lucide-react";
import {
  createDailyOpenSchedule,
  createDailyOpenSchedulesBatch,
  type DailyOpenSchedulePayload,
} from "../../api/admin/schedules";
import { getDashboardDailyOpenSchedules } from "../../api/admin/dashboard";
import {
  type AdminRoute,
  getRoutes,
  type RouteStop,
} from "../../api/admin/routes";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../../components/ui/sheet";
import { Input } from "../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Calendar } from "../../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";

interface StopReservationSetting extends Pick<
  RouteStop,
  "stopId" | "stopName"
> {
  isEnabled: boolean;
  quota: number;
}

interface ScheduleForm {
  routeId: string;
  operationDate: string;
  departureTime: string;
  scheduleName: string;
  totalQuota: number;
  bookingCloseAt: string;
}

type ScheduleField =
  | "routeId"
  | "operationDate"
  | "departureTime"
  | "bookingCloseAt";

interface PreviewSchedule {
  id: string;
  date: string;
  time: string;
  routeId: string;
  routeNumber: string;
  quota: number;
  bookingCloseRule: string;
}

const inputClass =
  "mt-2 h-11 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-admin-text outline-none focus:border-adminStatus-enabled";
const dateQuickOptions = [
  { label: "今日", offset: 0 },
  { label: "明日", offset: 1 },
  { label: "後天", offset: 2 },
  { label: "下週同日", offset: 7 },
];
const departureTimeOptions = [
  "05:30",
  "06:00",
  "06:30",
  "07:00",
  "07:30",
  "08:00",
];

function getRoute(routes: AdminRoute[], routeId: string) {
  return routes.find((route) => route.routeId === routeId) ?? routes[0] ?? null;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateFromInputValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatTime(date: Date) {
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
}

function formatDateTimeInput(date: Date) {
  return `${formatDate(date)}T${formatTime(date)}`;
}

function getDateTimeFromInputValue(value: string) {
  const normalizedValue = value.replace(" ", "T");
  const match = normalizedValue.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/,
  );

  if (!match) return null;

  const [, year, month, day, hour, minute] = match;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    0,
    0,
  );
}

function getDateTimeFromValues(dateValue: string, timeValue: string) {
  const date = getDateFromInputValue(dateValue);
  if (!date) return null;

  const [hour, minute] = timeValue.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;

  date.setHours(hour, minute, 0, 0);
  return date;
}

function getBookingCloseAt(operationDate: string, departureTime: string) {
  const departureDate = getDateTimeFromValues(operationDate, departureTime);
  if (!departureDate) return "";

  departureDate.setMinutes(departureDate.getMinutes() - 30);
  return formatDateTimeInput(departureDate);
}

function normalizeBookingCloseAt(
  operationDate: string,
  departureTime: string,
  bookingCloseAt: string,
) {
  const latestBookingCloseAt = getBookingCloseAt(operationDate, departureTime);
  const latestBookingCloseDate =
    getDateTimeFromInputValue(latestBookingCloseAt);
  const bookingCloseDate = getDateTimeFromInputValue(bookingCloseAt);

  if (!latestBookingCloseAt || !latestBookingCloseDate) return bookingCloseAt;
  if (!bookingCloseDate) return latestBookingCloseAt;

  return bookingCloseDate > latestBookingCloseDate
    ? latestBookingCloseAt
    : formatDateTimeInput(bookingCloseDate);
}

function isDeadlineBeforeNow(value: string) {
  const deadlineDate = getDateTimeFromInputValue(value);

  return Boolean(deadlineDate && deadlineDate.getTime() < Date.now());
}

function formatDeadlinePayload(value: string) {
  const deadlineDate = getDateTimeFromInputValue(value);

  if (!deadlineDate) return value.replace("T", " ");

  return `${formatDate(deadlineDate)} ${formatTime(deadlineDate)}:00`;
}

function applyWorksheetStyle(
  worksheet: import("exceljs").Worksheet,
  headerColor = "FF047857",
) {
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: headerColor },
  };

  worksheet.eachRow((row) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FF94A3B8" } },
        left: { style: "thin", color: { argb: "FF94A3B8" } },
        bottom: { style: "thin", color: { argb: "FF94A3B8" } },
        right: { style: "thin", color: { argb: "FF94A3B8" } },
      };
      cell.alignment = { vertical: "middle" };
    });
  });
}

function createEmptyScheduleForm(): ScheduleForm {
  return {
    routeId: "",
    operationDate: "",
    departureTime: "",
    scheduleName: "",
    totalQuota: 20,
    bookingCloseAt: "",
  };
}

function addMinutesToTime(value: string, minutes: number) {
  const [hour, minute] = value.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;

  const date = new Date(2000, 0, 1, hour, minute);
  date.setMinutes(date.getMinutes() + minutes);
  return formatTime(date);
}

function openInputPicker(event: React.MouseEvent<HTMLInputElement>) {
  event.currentTarget.showPicker?.();
}

function buildStopSettings(
  route: AdminRoute | null,
  quota: number,
): StopReservationSetting[] {
  return [...(route?.stops ?? [])]
    .sort((a, b) => a.sequence - b.sequence)
    .map((stop) => ({
      ...stop,
      isEnabled: true,
      quota,
    }));
}

function getCellText(value: unknown) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return formatDate(value);
  if (typeof value === "object") {
    const objectValue = value as {
      text?: string;
      result?: unknown;
      richText?: { text: string }[];
    };

    if (objectValue.text) return objectValue.text;
    if (objectValue.result !== undefined)
      return getCellText(objectValue.result);
    if (objectValue.richText) {
      return objectValue.richText.map((item) => item.text).join("");
    }
  }

  return String(value).trim();
}

function getCellDate(value: unknown) {
  if (value instanceof Date) return formatDate(value);

  const text = getCellText(value).replace(/\//g, "-");
  const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  if (!match) return "";

  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function getCellTime(value: unknown) {
  if (value instanceof Date) return formatTime(value);

  if (typeof value === "number") {
    const totalMinutes = Math.round(value * 24 * 60);
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;

    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  const text = getCellText(value);
  const match = text.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "";

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour < 0 || hour > 24 || minute < 0 || minute > 59) return "";
  if (hour === 24 && minute !== 0) return "";

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function getCellDateTime(value: unknown) {
  if (value instanceof Date) {
    return `${formatDate(value)} ${formatTime(value)}`;
  }

  const text = getCellText(value).replace(/\s+/g, " ").trim();
  const match = text.match(
    /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i,
  );

  if (!match) return "";

  const [, year, month, day, hourText, minuteText, , meridiem] = match;
  let hour = Number(hourText);
  const minute = Number(minuteText);

  if (meridiem) {
    const normalizedMeridiem = meridiem.toUpperCase();
    if (hour < 1 || hour > 12) return "";
    if (normalizedMeridiem === "PM" && hour !== 12) hour += 12;
    if (normalizedMeridiem === "AM" && hour === 12) hour = 0;
  }

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return "";

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")} ${String(hour).padStart(2, "0")}:${minuteText}`;
}

export function ScheduleManagementPage() {
  const [routes, setRoutes] = useState<AdminRoute[]>([]);
  const [isRoutesLoading, setIsRoutesLoading] = useState(true);
  const [routesError, setRoutesError] = useState("");
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>(
    createEmptyScheduleForm,
  );
  const [stopSettings, setStopSettings] = useState<StopReservationSetting[]>(
    [],
  );
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [batchPreview, setBatchPreview] = useState<PreviewSchedule[]>([]);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [isSingleScheduleDrawerOpen, setIsSingleScheduleDrawerOpen] =
    useState(false);
  const [isImportDateModalOpen, setIsImportDateModalOpen] = useState(false);
  const [isImportCalendarOpen, setIsImportCalendarOpen] = useState(false);
  const [isOperationDateCalendarOpen, setIsOperationDateCalendarOpen] =
    useState(false);
  const [isBookingCloseCalendarOpen, setIsBookingCloseCalendarOpen] =
    useState(false);
  const [batchOperationDateCalendarId, setBatchOperationDateCalendarId] =
    useState<string | null>(null);
  const [batchDeadlineCalendarId, setBatchDeadlineCalendarId] = useState<
    string | null
  >(null);
  const [scheduleFieldErrors, setScheduleFieldErrors] = useState<
    Partial<Record<ScheduleField, boolean>>
  >({});
  const [drawerNotice, setDrawerNotice] = useState<string | null>(null);
  const [pendingExcelImport, setPendingExcelImport] = useState<{
    fileName: string;
    preview: PreviewSchedule[];
    errors: string[];
  } | null>(null);
  const [importSourceDate, setImportSourceDate] = useState(() =>
    formatDate(new Date()),
  );
  const [isImportingSchedules, setIsImportingSchedules] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const operationDateSegmentRefs = useRef<Array<HTMLInputElement | null>>([]);
  const departureTimeSegmentRefs = useRef<Array<HTMLInputElement | null>>([]);
  const routeSelectRef = useRef<HTMLSelectElement | null>(null);
  const bookingCloseDateRef = useRef<HTMLButtonElement | null>(null);
  const batchInputRefs = useRef<Record<string, HTMLElement | null>>({});
  const activeRoutes = useMemo(
    () => routes.filter((route) => route.status === "ACTIVE"),
    [routes],
  );

  useEffect(() => {
    if (!notice) return;
    const timeoutId = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  useEffect(() => {
    if (!drawerNotice) return;
    const timeoutId = window.setTimeout(() => setDrawerNotice(null), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [drawerNotice]);

  const selectedRoute = useMemo(
    () => getRoute(activeRoutes, scheduleForm.routeId),
    [activeRoutes, scheduleForm.routeId],
  );

  const generatedScheduleName = selectedRoute
    ? `${selectedRoute.routeName} ${scheduleForm.departureTime}`
    : "請選擇路線";
  const enabledStopQuota = stopSettings
    .filter((stop) => stop.isEnabled)
    .reduce((sum, stop) => sum + Number(stop.quota || 0), 0);

  const loadRoutes = async () => {
    try {
      setIsRoutesLoading(true);
      setRoutesError("");
      const loadedRoutes = await getRoutes();
      const availableRoutes = loadedRoutes.filter(
        (route) => route.status === "ACTIVE",
      );
      const firstRoute = availableRoutes[0] ?? null;

      setRoutes(loadedRoutes);
      setScheduleForm((current) => {
        const currentRoute = getRoute(availableRoutes, current.routeId);
        return { ...current, routeId: currentRoute?.routeId ?? "" };
      });
      setStopSettings((current) => {
        const currentRoute = getRoute(availableRoutes, scheduleForm.routeId);
        return current.length && currentRoute?.routeId === scheduleForm.routeId
          ? current
          : buildStopSettings(
              currentRoute ?? firstRoute,
              scheduleForm.totalQuota,
            );
      });
    } catch (error) {
      setRoutesError(
        error instanceof Error ? error.message : "讀取路線清單失敗。",
      );
      setRoutes([]);
      setScheduleForm((current) => ({ ...current, routeId: "" }));
      setStopSettings([]);
    } finally {
      setIsRoutesLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const updateScheduleForm = <K extends keyof ScheduleForm>(
    key: K,
    value: ScheduleForm[K],
  ) => {
    setScheduleForm((current) => ({ ...current, [key]: value }));
  };

  const handleRouteChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const routeId = event.target.value;
    const route = getRoute(routes, routeId);
    updateScheduleForm("routeId", routeId);
    setScheduleFieldErrors((current) => ({ ...current, routeId: false }));
    setStopSettings(buildStopSettings(route, scheduleForm.totalQuota));
  };

  const handleOperationDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    setOperationDate(event.target.value);
  };

  const setOperationDate = (operationDate: string) => {
    setScheduleFieldErrors((current) => ({ ...current, operationDate: false }));
    setScheduleForm((current) => ({
      ...current,
      operationDate,
      bookingCloseAt:
        getBookingCloseAt(operationDate, current.departureTime) ||
        current.bookingCloseAt,
    }));
  };

  const shiftOperationDate = (days: number) => {
    const date = getDateFromInputValue(scheduleForm.operationDate);
    if (!date) return;
    setOperationDate(formatDate(addDays(date, days)));
  };

  const setDepartureTime = (departureTime: string) => {
    setScheduleFieldErrors((current) => ({ ...current, departureTime: false }));
    setScheduleForm((current) => ({
      ...current,
      departureTime,
      bookingCloseAt:
        getBookingCloseAt(current.operationDate, departureTime) ||
        current.bookingCloseAt,
    }));
  };

  const updateOperationDateSegment = (index: number, value: string) => {
    const limits = [4, 2, 2];
    const parts = scheduleForm.operationDate.split("-");
    const normalizedValue = value.replace(/\D/g, "").slice(0, limits[index]);

    parts[index] = normalizedValue;
    setOperationDate(parts.slice(0, 3).join("-"));

    if (normalizedValue.length === limits[index]) {
      if (index < limits.length - 1) {
        operationDateSegmentRefs.current[index + 1]?.focus();
      } else {
        departureTimeSegmentRefs.current[0]?.focus();
      }
    }
  };

  const updateDepartureTimeSegment = (index: number, value: string) => {
    const parts = scheduleForm.departureTime.split(":");
    const normalizedValue = value.replace(/\D/g, "").slice(0, 2);

    parts[index] = normalizedValue;
    setDepartureTime(parts.slice(0, 2).join(":"));

    if (normalizedValue.length === 2 && index === 0) {
      departureTimeSegmentRefs.current[1]?.focus();
    }
  };

  const adjustDepartureTime = (minutes: number) => {
    setDepartureTime(addMinutesToTime(scheduleForm.departureTime, minutes));
  };

  const setBookingCloseAt = (bookingCloseAt: string) => {
    setScheduleFieldErrors((current) => ({
      ...current,
      bookingCloseAt: false,
    }));
    setScheduleForm((current) => ({
      ...current,
      bookingCloseAt: normalizeBookingCloseAt(
        current.operationDate,
        current.departureTime,
        bookingCloseAt,
      ),
    }));
  };

  const setBookingCloseDate = (date: Date | undefined) => {
    if (!date) return;

    const time = scheduleForm.bookingCloseAt.split("T")[1] || "00:00";
    setBookingCloseAt(`${formatDate(date)}T${time}`);
    setIsBookingCloseCalendarOpen(false);
  };

  const updateBookingCloseTimeSegment = (index: number, value: string) => {
    const date = scheduleForm.bookingCloseAt.split("T")[0];
    if (!date) return;

    const parts = scheduleForm.bookingCloseAt.split("T")[1]?.split(":") ?? [
      "",
      "",
    ];
    parts[index] = value.replace(/\D/g, "").slice(0, 2);
    setScheduleFieldErrors((current) => ({
      ...current,
      bookingCloseAt: false,
    }));
    updateScheduleForm("bookingCloseAt", `${date}T${parts.join(":")}`);
  };

  const setBookingCloseAtByRule = (
    rule: "previous-day-2359" | "previous-day-1800" | "departure-minus-30",
  ) => {
    setScheduleFieldErrors((current) => ({
      ...current,
      bookingCloseAt: false,
    }));
    const operationDate = getDateFromInputValue(scheduleForm.operationDate);
    if (!operationDate) return;

    if (rule === "previous-day-2359") {
      updateScheduleForm(
        "bookingCloseAt",
        `${formatDate(addDays(operationDate, -1))}T22:00`,
      );
      return;
    }

    if (rule === "previous-day-1800") {
      updateScheduleForm(
        "bookingCloseAt",
        `${formatDate(addDays(operationDate, -1))}T18:00`,
      );
      return;
    }

    const departureDate = getDateTimeFromValues(
      scheduleForm.operationDate,
      scheduleForm.departureTime,
    );
    if (!departureDate) return;
    departureDate.setMinutes(departureDate.getMinutes() - 30);
    updateScheduleForm("bookingCloseAt", formatDateTimeInput(departureDate));
  };

  const saveSchedule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors: Partial<Record<ScheduleField, boolean>> = {
      routeId: !scheduleForm.routeId,
      operationDate: !getDateFromInputValue(scheduleForm.operationDate),
      departureTime: !/^([01]\d|2[0-3]):[0-5]\d$/.test(
        scheduleForm.departureTime,
      ),
      bookingCloseAt: !getDateTimeFromInputValue(scheduleForm.bookingCloseAt),
    };
    const firstInvalidField = (Object.keys(errors) as ScheduleField[]).find(
      (field) => errors[field],
    );

    if (firstInvalidField) {
      setNotice(null);
      setScheduleFieldErrors(errors);
      const target =
        firstInvalidField === "routeId"
          ? routeSelectRef.current
          : firstInvalidField === "operationDate"
            ? operationDateSegmentRefs.current[0]
            : firstInvalidField === "departureTime"
              ? departureTimeSegmentRefs.current[0]
              : bookingCloseDateRef.current;
      requestAnimationFrame(() => {
        target?.scrollIntoView({ behavior: "smooth", block: "center" });
        target?.focus();
      });
      return;
    }

    setScheduleFieldErrors({});

    if (enabledStopQuota <= 0) {
      setNotice({ type: "error", message: "可預約名額必須大於 0。" });
      return;
    }

    if (stopSettings.every((stop) => !stop.isEnabled)) {
      setNotice({ type: "error", message: "請至少開放一個可預約上車站。" });
      return;
    }

    if (isDeadlineBeforeNow(scheduleForm.bookingCloseAt)) {
      setNotice({
        type: "error",
        message: "預約截止時間不得早於現在，請重新設定截止日期。",
      });
      return;
    }

    const payload: DailyOpenSchedulePayload = {
      routeId: scheduleForm.routeId,
      departureTime: scheduleForm.departureTime,
      openDate: scheduleForm.operationDate,
      quota: enabledStopQuota,
      deadline: formatDeadlinePayload(scheduleForm.bookingCloseAt),
      status: "ACTIVE",
    };

    try {
      setIsSavingSchedule(true);
      setDrawerNotice(null);
      const created = await createDailyOpenSchedule(payload);
      setNotice({
        type: "success",
        message: `已建立派班資料：${generatedScheduleName}，名額 ${created.quota}。`,
      });
      setIsSingleScheduleDrawerOpen(false);
    } catch (error) {
      setDrawerNotice(
        error instanceof Error ? error.message : "建立派班資料失敗。",
      );
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const saveBatchSchedules = async () => {
    if (batchPreview.length === 0) return;

    const invalidItem = batchPreview.find(
      (item) =>
        !item.routeId ||
        !getDateFromInputValue(item.date) ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time) ||
        !Number.isFinite(item.quota) ||
        item.quota <= 0 ||
        !getDateTimeFromInputValue(item.bookingCloseRule),
    );

    if (invalidItem) {
      setNotice({
        type: "error",
        message: "請完整填寫每一筆班次的路線、日期、時間、名額與截止日期。",
      });
      return;
    }

    const expiredDeadlineItem = batchPreview.find((item) =>
      isDeadlineBeforeNow(item.bookingCloseRule),
    );

    if (expiredDeadlineItem) {
      setNotice({
        type: "error",
        message: `${expiredDeadlineItem.date} ${expiredDeadlineItem.time} 的截止日期已早於現在，請重新設定後再建立批次班次。`,
      });
      return;
    }

    const schedules: DailyOpenSchedulePayload[] = batchPreview.map((item) => ({
      routeId: item.routeId,
      departureTime: item.time,
      openDate: item.date,
      quota: item.quota,
      deadline: formatDeadlinePayload(item.bookingCloseRule),
      status: "ACTIVE",
    }));

    try {
      setIsSavingBatch(true);
      const result = await createDailyOpenSchedulesBatch(schedules);
      setNotice({
        type: result.failedCount > 0 ? "error" : "success",
        message:
          result.failedCount > 0
            ? `批次建立完成，成功 ${result.successCount} 筆、失敗 ${result.failedCount} 筆：${result.failedItems
                .slice(0, 3)
                .map((item) => `第 ${item.rowNumber} 列 ${item.errorMessage}`)
                .join("；")}`
            : `已建立 ${result.successCount} 筆批次班次。`,
      });

      if (result.failedCount === 0) {
        setBatchPreview([]);
      }
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "批次建立班次失敗。",
      });
    } finally {
      setIsSavingBatch(false);
    }
  };

  const updateBatchPreviewItem = <K extends keyof PreviewSchedule>(
    id: string,
    key: K,
    value: PreviewSchedule[K],
  ) => {
    setBatchPreview((current) =>
      current.map((item) => {
        if (item.id !== id) return item;

        const nextItem = {
          ...item,
          [key]: value,
        };

        if (key === "date" || key === "time" || key === "bookingCloseRule") {
          return {
            ...nextItem,
            bookingCloseRule: normalizeBookingCloseAt(
              nextItem.date,
              nextItem.time,
              nextItem.bookingCloseRule,
            ),
          };
        }

        return nextItem;
      }),
    );
  };

  const setBatchBookingCloseAtByRule = (
    rule: "previous-day-2359" | "previous-day-1800" | "departure-minus-30",
  ) => {
    setBatchPreview((current) =>
      current.map((item) => {
        const operationDate = getDateFromInputValue(item.date);

        if (!operationDate) return item;

        if (rule === "previous-day-2359") {
          return {
            ...item,
            bookingCloseRule: `${formatDate(addDays(operationDate, -1))}T22:00`,
          };
        }

        if (rule === "previous-day-1800") {
          return {
            ...item,
            bookingCloseRule: `${formatDate(addDays(operationDate, -1))}T18:00`,
          };
        }

        return {
          ...item,
          bookingCloseRule: getBookingCloseAt(item.date, item.time),
        };
      }),
    );
  };

  const addBatchPreviewItem = () => {
    const route = activeRoutes[0];
    setBatchPreview((current) => [
      {
        id: `manual-${Date.now()}`,
        date: "",
        time: "",
        routeId: route?.routeId ?? "",
        routeNumber: route?.routeNumber ?? "",
        quota: 20,
        bookingCloseRule: "",
      },
      ...current,
    ]);
  };

  const updateBatchPreviewRoute = (id: string, routeId: string) => {
    const route = activeRoutes.find((item) => item.routeId === routeId);
    setBatchPreview((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, routeId, routeNumber: route?.routeNumber ?? "" }
          : item,
      ),
    );
  };

  const updateBatchDateSegment = (
    item: PreviewSchedule,
    index: number,
    value: string,
  ) => {
    const limits = [4, 2, 2];
    const parts = item.date.split("-");
    parts[index] = value.replace(/\D/g, "").slice(0, limits[index]);
    updateBatchPreviewItem(item.id, "date", parts.slice(0, 3).join("-"));
    if (parts[index].length === limits[index]) {
      const nextKey = index < 2 ? `date-${index + 1}` : "time-0";
      requestAnimationFrame(() =>
        batchInputRefs.current[`${item.id}-${nextKey}`]?.focus(),
      );
    }
  };

  const updateBatchTimeSegment = (
    item: PreviewSchedule,
    index: number,
    value: string,
  ) => {
    const parts = item.time.split(":");
    parts[index] = value.replace(/\D/g, "").slice(0, 2);
    updateBatchPreviewItem(item.id, "time", parts.slice(0, 2).join(":"));
    if (parts[index].length === 2) {
      const nextKey = index === 0 ? "time-1" : "route";
      requestAnimationFrame(() =>
        batchInputRefs.current[`${item.id}-${nextKey}`]?.focus(),
      );
    }
  };

  const setBatchDeadlineDate = (id: string, value: Date | undefined) => {
    if (!value) return;
    setBatchPreview((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const time = item.bookingCloseRule.split("T")[1] || "00:00";
        return { ...item, bookingCloseRule: `${formatDate(value)}T${time}` };
      }),
    );
    setBatchDeadlineCalendarId(null);
  };

  const updateBatchDeadlineTimeSegment = (
    item: PreviewSchedule,
    index: number,
    value: string,
  ) => {
    const date = item.bookingCloseRule.split("T")[0];
    if (!date) return;
    const parts = item.bookingCloseRule.split("T")[1]?.split(":") ?? ["", ""];
    parts[index] = value.replace(/\D/g, "").slice(0, 2);
    setBatchPreview((current) =>
      current.map((currentItem) =>
        currentItem.id === item.id
          ? { ...currentItem, bookingCloseRule: `${date}T${parts.join(":")}` }
          : currentItem,
      ),
    );
    if (parts[index].length === 2 && index === 0) {
      requestAnimationFrame(() =>
        batchInputRefs.current[`${item.id}-deadline-1`]?.focus(),
      );
    }
  };

  const importSchedulesFromDate = async () => {
    if (!importSourceDate) return;

    try {
      setIsImportingSchedules(true);
      const sourceSchedules =
        await getDashboardDailyOpenSchedules(importSourceDate);
      const operationDate = formatDate(addDays(new Date(), 1));
      const importedSchedules = sourceSchedules.map((schedule, index) => {
        const time = schedule.departureTime.slice(0, 5);

        return {
          id: `import-${operationDate}-${schedule.routeId}-${time}-${index}`,
          date: operationDate,
          time,
          routeId: schedule.routeId,
          routeNumber: schedule.routeNumber,
          quota: schedule.quota,
          bookingCloseRule: normalizeBookingCloseAt(
            operationDate,
            time,
            getBookingCloseAt(operationDate, time),
          ),
        };
      });

      setBatchPreview(importedSchedules);
      setIsImportDateModalOpen(false);
      setNotice({
        type: importedSchedules.length ? "success" : "error",
        message: importedSchedules.length
          ? `已匯入 ${importSourceDate} 的 ${importedSchedules.length} 筆班次；營運日期已調整為 ${operationDate}，截止日期已依發車前 30 分鐘規則設定。`
          : `${importSourceDate} 沒有可匯入的班次。`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error ? error.message : "讀取指定日期班次失敗。",
      });
    } finally {
      setIsImportingSchedules(false);
    }
  };

  const downloadBatchTemplate = async () => {
    const { default: ExcelJS } = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("批次班次匯入");
    const routeWorksheet = workbook.addWorksheet("班次");
    const templateDate = formatDate(addDays(new Date(), 1));
    const templateRouteNumber = routes[0]?.routeNumber ?? "1571";

    worksheet.columns = [
      { header: "路線編號", key: "routeNumber", width: 16 },
      { header: "營運日期", key: "date", width: 16 },
      { header: "班次時間", key: "time", width: 14 },
      { header: "預約座位", key: "quota", width: 12 },
      { header: "截止日期", key: "bookingCloseAt", width: 24 },
    ];

    worksheet.addRows([
      {
        routeNumber: templateRouteNumber,
        date: templateDate,
        time: "05:30",
        quota: 20,
        bookingCloseAt: formatDeadlinePayload(
          getBookingCloseAt(templateDate, "05:30"),
        ),
      },
      {
        routeNumber: templateRouteNumber,
        date: templateDate,
        time: "06:00",
        quota: 20,
        bookingCloseAt: formatDeadlinePayload(
          getBookingCloseAt(templateDate, "06:00"),
        ),
      },
    ]);

    routeWorksheet.columns = [
      { header: "班次名稱", key: "routeName", width: 28 },
      { header: "班次編號", key: "routeNumber", width: 16 },
    ];
    routeWorksheet.addRows(
      [...routes]
        .sort((a, b) => a.routeNumber.localeCompare(b.routeNumber))
        .map((route) => ({
          routeName: route.routeName,
          routeNumber: route.routeNumber,
        })),
    );

    applyWorksheetStyle(worksheet);
    applyWorksheetStyle(routeWorksheet);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "班次批次匯入範本.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  };

  const importBatchExcel = async (file: File) => {
    try {
      const { default: ExcelJS } = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        setNotice({ type: "error", message: "Excel 沒有可讀取的工作表。" });
        return;
      }

      const preview: PreviewSchedule[] = [];
      const errors: string[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const routeNumber = getCellText(row.getCell(1).value);
        const date = getCellDate(row.getCell(2).value);
        const time = getCellTime(row.getCell(3).value);
        const quota = Number(getCellText(row.getCell(4).value));
        const bookingCloseAt = getCellDateTime(row.getCell(5).value);
        const isEmptyRow = [routeNumber, date, time].every((value) => !value);

        if (isEmptyRow) return;

        const route = routes.find((item) => item.routeNumber === routeNumber);

        if (!routeNumber) {
          errors.push(`第 ${rowNumber} 列缺少路線編號`);
          return;
        }

        if (!date) {
          errors.push(`第 ${rowNumber} 列營運日期格式錯誤，請使用 YYYY-MM-DD`);
          return;
        }

        if (!time) {
          errors.push(`第 ${rowNumber} 列班次時間格式錯誤，請使用 HH:mm`);
          return;
        }

        if (!Number.isFinite(quota) || quota <= 0) {
          errors.push(`第 ${rowNumber} 列預約座位必須大於 0`);
          return;
        }

        if (!bookingCloseAt) {
          errors.push(
            `第 ${rowNumber} 列截止日期格式錯誤，請使用 YYYY-MM-DD HH:mm`,
          );
          return;
        }

        if (!route) {
          errors.push(`第 ${rowNumber} 列找不到對應路線`);
          return;
        }

        const normalizedBookingCloseAt = normalizeBookingCloseAt(
          date,
          time,
          bookingCloseAt.replace(" ", "T"),
        );

        if (isDeadlineBeforeNow(normalizedBookingCloseAt)) {
          errors.push(`第 ${rowNumber} 列截止日期已早於現在，未匯入`);
          return;
        }

        preview.push({
          id: `${date}-${time}-${rowNumber}`,
          date,
          time,
          routeId: route.routeId,
          routeNumber: route.routeNumber,
          quota,
          bookingCloseRule: normalizedBookingCloseAt,
        });
      });

      setBatchPreview(preview);
      setPendingExcelImport({
        fileName: file.name,
        preview,
        errors,
      });
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "匯入 Excel 失敗。",
      });
    }
  };

  const selectBatchExcel = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    void importBatchExcel(file);
  };

  const confirmBatchExcelImport = () => {
    if (!pendingExcelImport) return;

    setPendingExcelImport(null);
  };

  return (
    <div className="space-y-4">
      {notice && (
        <p
          className={`rounded-adminControl border px-4 py-3 text-sm ${
            notice.type === "success"
              ? "border-adminStatus-enabled/30 bg-adminStatus-enabled/10 text-adminStatus-enabledText"
              : "border-red-400/30 bg-red-400/10 text-red-200"
          }`}
          role="status"
        >
          {notice.message}
        </p>
      )}

      <Sheet
        open={isSingleScheduleDrawerOpen}
        onOpenChange={setIsSingleScheduleDrawerOpen}
      >
        <SheetContent
          className="admin-single-schedule-drawer !w-[min(35vw,1280px)] !max-w-none !bg-admin-surface !text-admin-text"
          overlayClassName="bg-black/55 supports-backdrop-filter:backdrop-blur-sm"
          side="right"
        >
          <SheetHeader className="border-b border-admin-border bg-admin-elevated px-6 py-5 pr-14">
            <SheetTitle className="text-xl font-bold tracking-tight !text-admin-text">
              建立單筆班次
            </SheetTitle>
            {/*  <SheetDescription className="mt-1 !text-admin-muted">
              完成班次基本資料、開放站位與名額後，即可建立預約班次。
            </SheetDescription> */}
          </SheetHeader>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={saveSchedule}
          >
            {drawerNotice && (
              <p
                className="mx-5 mt-5 rounded-adminControl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-200"
                role="alert"
              >
                {drawerNotice}
              </p>
            )}
            <main className="min-h-0 flex-1 overflow-y-auto p-5">
              <article className="mx-auto max-w-4xl space-y-4">
                <section className="admin-panel-body p-5">
                  <fieldset>
                    <legend className="admin-section-title flex items-center gap-3">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-adminStatus-enabled/15 text-xs text-adminStatus-enabled">
                        1
                      </span>
                      班次基本資料
                    </legend>
                    <div className="mt-5 grid gap-5 grid-cols-1">
                      <label className="text-sm font-medium text-admin-softText">
                        路線 <span className="text-red-300">*</span>
                        <select
                          className={`${inputClass} ${scheduleFieldErrors.routeId ? "border-red-400 ring-1 ring-red-400/50" : ""}`}
                          disabled={
                            isRoutesLoading || activeRoutes.length === 0
                          }
                          ref={routeSelectRef}
                          value={scheduleForm.routeId}
                          onChange={handleRouteChange}
                        >
                          {isRoutesLoading ? (
                            <option value="">讀取路線中…</option>
                          ) : activeRoutes.length === 0 ? (
                            <option value="">目前沒有啟用中的路線</option>
                          ) : (
                            activeRoutes.map((route) => (
                              <option key={route.routeId} value={route.routeId}>
                                {route.routeNumber}｜{route.routeName}
                              </option>
                            ))
                          )}
                        </select>
                        {routesError && (
                          <span className="mt-1 block text-xs text-red-300">
                            {routesError}
                          </span>
                        )}
                      </label>

                      <label className="text-sm font-medium text-admin-softText">
                        營運日期 <span className="text-red-300">*</span>
                        <div className="mt-2 flex items-center gap-2">
                          <Input
                            aria-label="營運日期年份"
                            className={`h-12 w-24 rounded-adminControl border-admin-borderStrong bg-admin-bg px-2 text-center font-mono text-lg font-bold tracking-[0.16em] text-admin-text ${scheduleFieldErrors.operationDate ? "border-red-400 ring-1 ring-red-400/50" : ""}`}
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="YYYY"
                            ref={(element) => {
                              operationDateSegmentRefs.current[0] = element;
                            }}
                            type="text"
                            value={
                              scheduleForm.operationDate.split("-")[0] ?? ""
                            }
                            onChange={(event) =>
                              updateOperationDateSegment(0, event.target.value)
                            }
                          />
                          <span className="text-xl font-bold text-admin-muted">
                            /
                          </span>
                          <Input
                            aria-label="營運日期月份"
                            className={`h-12 w-16 rounded-adminControl border-admin-borderStrong bg-admin-bg px-2 text-center font-mono text-lg font-bold tracking-[0.16em] text-admin-text ${scheduleFieldErrors.operationDate ? "border-red-400 ring-1 ring-red-400/50" : ""}`}
                            inputMode="numeric"
                            maxLength={2}
                            placeholder="MM"
                            ref={(element) => {
                              operationDateSegmentRefs.current[1] = element;
                            }}
                            type="text"
                            value={
                              scheduleForm.operationDate.split("-")[1] ?? ""
                            }
                            onChange={(event) =>
                              updateOperationDateSegment(1, event.target.value)
                            }
                          />
                          <span className="text-xl font-bold text-admin-muted">
                            /
                          </span>
                          <Input
                            aria-label="營運日期日期"
                            className={`h-12 w-16 rounded-adminControl border-admin-borderStrong bg-admin-bg px-2 text-center font-mono text-lg font-bold tracking-[0.16em] text-admin-text ${scheduleFieldErrors.operationDate ? "border-red-400 ring-1 ring-red-400/50" : ""}`}
                            inputMode="numeric"
                            maxLength={2}
                            placeholder="DD"
                            ref={(element) => {
                              operationDateSegmentRefs.current[2] = element;
                            }}
                            type="text"
                            value={
                              scheduleForm.operationDate.split("-")[2] ?? ""
                            }
                            onChange={(event) =>
                              updateOperationDateSegment(2, event.target.value)
                            }
                          />
                          <Popover
                            open={isOperationDateCalendarOpen}
                            onOpenChange={setIsOperationDateCalendarOpen}
                          >
                            <PopoverTrigger asChild>
                              <button
                                aria-label="選擇營運日期"
                                className="grid h-12 w-12 shrink-0 place-items-center rounded-adminControl border border-admin-borderStrong bg-admin-bg text-admin-muted transition hover:border-adminStatus-enabled hover:text-adminStatus-enabled"
                                type="button"
                              >
                                <CalendarIcon
                                  aria-hidden="true"
                                  className="h-5 w-5"
                                />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              align="end"
                              className="!z-[60] !w-auto !bg-admin-surface !p-2 !text-admin-text"
                            >
                              <Calendar
                                mode="single"
                                selected={
                                  getDateFromInputValue(
                                    scheduleForm.operationDate,
                                  ) ?? undefined
                                }
                                onSelect={(date) => {
                                  if (!date) return;
                                  setOperationDate(formatDate(date));
                                  setIsOperationDateCalendarOpen(false);
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </label>

                      <label className="text-sm font-medium text-admin-softText">
                        班次時間 <span className="text-red-300">*</span>
                        <div className="mt-2 flex items-center gap-2">
                          <Input
                            aria-label="班次時間小時"
                            className={`h-12 w-16 rounded-adminControl border-admin-borderStrong bg-admin-bg px-2 text-center font-mono text-lg font-bold tracking-[0.16em] text-admin-text ${scheduleFieldErrors.departureTime ? "border-red-400 ring-1 ring-red-400/50" : ""}`}
                            inputMode="numeric"
                            maxLength={2}
                            placeholder="HH"
                            ref={(element) => {
                              departureTimeSegmentRefs.current[0] = element;
                            }}
                            type="text"
                            value={
                              scheduleForm.departureTime.split(":")[0] ?? ""
                            }
                            onChange={(event) =>
                              updateDepartureTimeSegment(0, event.target.value)
                            }
                          />
                          <span className="text-xl font-bold text-admin-muted">
                            :
                          </span>
                          <Input
                            aria-label="班次時間分鐘"
                            className={`h-12 w-16 rounded-adminControl border-admin-borderStrong bg-admin-bg px-2 text-center font-mono text-lg font-bold tracking-[0.16em] text-admin-text ${scheduleFieldErrors.departureTime ? "border-red-400 ring-1 ring-red-400/50" : ""}`}
                            inputMode="numeric"
                            maxLength={2}
                            placeholder="MM"
                            ref={(element) => {
                              departureTimeSegmentRefs.current[1] = element;
                            }}
                            type="text"
                            value={
                              scheduleForm.departureTime.split(":")[1] ?? ""
                            }
                            onChange={(event) =>
                              updateDepartureTimeSegment(1, event.target.value)
                            }
                          />
                        </div>
                      </label>

                      <label className="text-sm font-medium text-admin-softText">
                        預約截止 <span className="text-red-300">*</span>
                        <span className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                          <Popover
                            open={isBookingCloseCalendarOpen}
                            onOpenChange={setIsBookingCloseCalendarOpen}
                          >
                            <PopoverTrigger asChild>
                              <button
                                className={`flex h-11 w-full items-center justify-between rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-left font-normal text-admin-text outline-none hover:border-adminStatus-enabled focus:border-adminStatus-enabled ${scheduleFieldErrors.bookingCloseAt ? "border-red-400 ring-1 ring-red-400/50" : ""}`}
                                ref={bookingCloseDateRef}
                                type="button"
                              >
                                <span
                                  className={
                                    scheduleForm.bookingCloseAt
                                      ? ""
                                      : "text-admin-muted"
                                  }
                                >
                                  {scheduleForm.bookingCloseAt.split("T")[0] ||
                                    "選擇截止日期"}
                                </span>
                                <CalendarIcon
                                  aria-hidden="true"
                                  className="h-4 w-4 text-admin-muted"
                                />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              align="start"
                              className="!z-[60] !w-auto !bg-admin-surface !p-2 !text-admin-text"
                            >
                              <Calendar
                                mode="single"
                                selected={
                                  getDateFromInputValue(
                                    scheduleForm.bookingCloseAt.split("T")[0],
                                  ) ?? undefined
                                }
                                onSelect={setBookingCloseDate}
                              />
                            </PopoverContent>
                          </Popover>
                          <span className="flex items-center gap-1">
                            <Input
                              aria-label="預約截止時間小時"
                              className={`h-11 w-14 border-admin-borderStrong bg-admin-bg px-1 text-center font-mono font-bold text-admin-text ${scheduleFieldErrors.bookingCloseAt ? "border-red-400 ring-1 ring-red-400/50" : ""}`}
                              disabled={!scheduleForm.bookingCloseAt}
                              inputMode="numeric"
                              maxLength={2}
                              placeholder="HH"
                              type="text"
                              value={
                                scheduleForm.bookingCloseAt
                                  .split("T")[1]
                                  ?.split(":")[0] ?? ""
                              }
                              onChange={(event) =>
                                updateBookingCloseTimeSegment(
                                  0,
                                  event.target.value,
                                )
                              }
                            />
                            <span className="font-bold text-admin-muted">
                              :
                            </span>
                            <Input
                              aria-label="預約截止時間分鐘"
                              className={`h-11 w-14 border-admin-borderStrong bg-admin-bg px-1 text-center font-mono font-bold text-admin-text ${scheduleFieldErrors.bookingCloseAt ? "border-red-400 ring-1 ring-red-400/50" : ""}`}
                              disabled={!scheduleForm.bookingCloseAt}
                              inputMode="numeric"
                              maxLength={2}
                              placeholder="MM"
                              type="text"
                              value={
                                scheduleForm.bookingCloseAt
                                  .split("T")[1]
                                  ?.split(":")[1] ?? ""
                              }
                              onChange={(event) =>
                                updateBookingCloseTimeSegment(
                                  1,
                                  event.target.value,
                                )
                              }
                            />
                          </span>
                        </span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            className="rounded-adminControl border border-admin-borderStrong px-3 py-1.5 text-xs font-semibold text-admin-softText"
                            type="button"
                            onClick={() =>
                              setBookingCloseAtByRule("previous-day-2359")
                            }
                          >
                            前一天 22:00
                          </button>

                          <button
                            className="rounded-adminControl border border-admin-borderStrong px-3 py-1.5 text-xs font-semibold text-admin-softText"
                            type="button"
                            onClick={() =>
                              setBookingCloseAtByRule("departure-minus-30")
                            }
                          >
                            發車前 30 分
                          </button>
                        </div>
                      </label>
                    </div>
                  </fieldset>
                </section>

                <section className="admin-panel-body p-5">
                  <fieldset>
                    <legend className="admin-section-title flex items-center gap-3">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-adminStatus-enabled/15 text-xs text-adminStatus-enabled">
                        2
                      </span>
                      開放站位與名額
                    </legend>
                    <p className="mt-1 text-sm text-admin-muted">
                      依路線帶出站位，可控制該班次哪些站位開放預約與站位名額。
                    </p>

                    <ol className="mt-5 space-y-2">
                      {stopSettings.map((stop, index) => (
                        <li
                          className={`grid gap-3 rounded-adminControl border px-4 py-3 md:items-center ${
                            stopSettings.length === 1
                              ? "md:grid-cols-[auto_minmax(0,1fr)_160px]"
                              : "md:grid-cols-[auto_minmax(0,1fr)_160px_auto]"
                          } ${
                            stop.isEnabled
                              ? "border-adminStatus-enabled/40 bg-adminStatus-enabled/10"
                              : "border-admin-borderStrong bg-admin-bg"
                          }`}
                          key={stop.stopId}
                        >
                          <span className="grid h-8 w-8 place-items-center rounded-full bg-admin-surface text-sm font-black text-admin-softText">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-bold text-admin-text">
                              {stop.stopName}
                            </p>
                            <p className="mt-1 text-xs text-admin-muted">
                              {stop.isEnabled
                                ? "此站開放預約"
                                : "此站不開放預約"}
                            </p>
                          </div>
                          <label className="text-xs font-medium text-admin-softText">
                            站位名額
                            <input
                              className="mt-1 h-10 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-admin-text outline-none focus:border-adminStatus-enabled disabled:opacity-50"
                              disabled={!stop.isEnabled}
                              min={0}
                              type="number"
                              value={stop.quota}
                              onChange={(event) =>
                                setStopSettings((current) =>
                                  current.map((item) =>
                                    item.stopId === stop.stopId
                                      ? {
                                          ...item,
                                          quota: Number(event.target.value),
                                        }
                                      : item,
                                  ),
                                )
                              }
                            />
                          </label>
                          {stopSettings.length > 1 && (
                            <button
                              className={`h-10 rounded-adminControl border px-4 text-sm font-bold ${
                                stop.isEnabled
                                  ? "border-adminStatus-enabled text-adminStatus-enabled"
                                  : "border-admin-borderStrong text-admin-softText"
                              }`}
                              type="button"
                              onClick={() =>
                                setStopSettings((current) =>
                                  current.map((item) =>
                                    item.stopId === stop.stopId
                                      ? { ...item, isEnabled: !item.isEnabled }
                                      : item,
                                  ),
                                )
                              }
                            >
                              {stop.isEnabled ? "開放" : "關閉"}
                            </button>
                          )}
                        </li>
                      ))}
                    </ol>
                  </fieldset>
                </section>
                <section className="admin-panel-body p-5">
                  <h2 className="admin-section-title flex items-center gap-3">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-adminStatus-enabled/15 text-xs text-adminStatus-enabled">
                      3
                    </span>
                    建立前確認
                  </h2>
                  <p className="mt-1 text-sm text-admin-muted">
                    確認目前設定後建立派班資料。
                  </p>

                  <p className="mt-5 text-xs font-bold text-admin-muted">
                    目前設定摘要
                  </p>
                  <dl className="mt-2 space-y-3 rounded-adminControl border border-admin-border bg-admin-bg p-4">
                    <div className="flex items-baseline justify-between gap-4 text-sm">
                      <dt className="text-admin-softText">班次</dt>
                      <dd className="text-right font-bold text-admin-text">
                        {scheduleForm.scheduleName || generatedScheduleName}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4 text-sm">
                      <dt className="text-admin-softText">營運日期</dt>
                      <dd className="text-right font-bold text-admin-text">
                        {scheduleForm.operationDate}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4 text-sm">
                      <dt className="text-admin-softText">預約截止</dt>
                      <dd className="text-right font-bold text-admin-text">
                        {scheduleForm.bookingCloseAt.replace("T", " ")}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4 text-sm">
                      <dt className="text-admin-softText">開放站位名額</dt>
                      <dd className="text-right font-bold text-admin-text">
                        {enabledStopQuota}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4 text-sm">
                      <dt className="text-admin-softText">開放站位數</dt>
                      <dd className="text-right font-bold text-admin-text">
                        {stopSettings.filter((stop) => stop.isEnabled).length}
                      </dd>
                    </div>
                  </dl>

                  <button
                    className="mt-5 h-11 w-full rounded-adminControl bg-adminStatus-enabled px-5 text-sm font-bold text-admin-bg disabled:opacity-60"
                    disabled={isSavingSchedule}
                    type="submit"
                  >
                    {isSavingSchedule ? "建立中…" : "建立派班資料"}
                  </button>
                </section>
              </article>
            </main>
          </form>
        </SheetContent>
      </Sheet>

      <section className="admin-panel-body overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-end gap-3 border-b border-admin-border px-4 py-3">
          <div className="flex flex-wrap gap-2">
            <button
              className="h-10 rounded-adminControl bg-adminStatus-enabled px-4 text-sm font-bold text-admin-bg"
              type="button"
              onClick={() => setIsSingleScheduleDrawerOpen(true)}
            >
              單筆建立
            </button>
            <button
              className="h-10 rounded-adminControl border border-admin-borderStrong px-4 text-sm font-semibold text-admin-softText"
              type="button"
              onClick={downloadBatchTemplate}
            >
              下載範本
            </button>
            <button
              className="h-10 rounded-adminControl bg-adminStatus-enabled px-4 text-sm font-bold text-admin-bg"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              匯入 Excel
            </button>
            <button
              className="h-10 rounded-adminControl border border-admin-borderStrong px-4 text-sm font-semibold text-admin-softText"
              type="button"
              onClick={() => setIsImportDateModalOpen(true)}
            >
              複製班表
            </button>
            <input
              accept=".xlsx,.xls"
              className="hidden"
              ref={fileInputRef}
              type="file"
              onChange={selectBatchExcel}
            />
          </div>
        </div>

        {batchPreview.length === 0 ? (
          <section className="px-5 py-8 text-center">
            <p className="text-admin-muted">尚未匯入批次清單。</p>
            <button
              className="mt-3 h-10 rounded-adminControl border border-adminStatus-enabled px-4 text-sm font-bold text-adminStatus-enabled"
              type="button"
              onClick={addBatchPreviewItem}
            >
              新增一筆
            </button>
          </section>
        ) : (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-admin-border bg-admin-bg px-4 py-3">
              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-adminControl border border-admin-borderStrong px-3 py-1.5 text-xs font-semibold text-admin-softText"
                  type="button"
                  onClick={() =>
                    setBatchBookingCloseAtByRule("departure-minus-30")
                  }
                >
                  全部改為發車前 30 分
                </button>
                <button
                  className="rounded-adminControl border border-admin-borderStrong px-3 py-1.5 text-xs font-semibold text-admin-softText"
                  type="button"
                  onClick={() =>
                    setBatchBookingCloseAtByRule("previous-day-2359")
                  }
                >
                  全部改為前一天 22:00
                </button>
                <button
                  className="rounded-adminControl border border-admin-borderStrong px-3 py-1.5 text-xs font-semibold text-admin-softText"
                  type="button"
                  onClick={() =>
                    setBatchBookingCloseAtByRule("previous-day-1800")
                  }
                >
                  全部改為前一天 18:00
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="h-9 rounded-adminControl border border-admin-borderStrong px-3 text-xs font-bold text-admin-softText"
                  type="button"
                  onClick={addBatchPreviewItem}
                >
                  新增一筆
                </button>
                <button
                  className="h-9 rounded-adminControl bg-adminStatus-enabled px-4 text-xs font-bold text-admin-bg disabled:opacity-50"
                  disabled={isSavingBatch}
                  type="button"
                  onClick={saveBatchSchedules}
                >
                  {isSavingBatch ? "建立中…" : "確認建立"}
                </button>
              </div>
            </div>
            <Table className="min-w-[1080px] table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[220px]" />
                <col className="w-[150px]" />
                <col className="w-[150px]" />
                <col className="w-[130px]" />
                <col className="w-[300px]" />
                <col className="w-[120px]" />
              </colgroup>
              <TableHeader className="bg-admin-bg text-admin-muted">
                <TableRow>
                  <TableHead>營運日期</TableHead>
                  <TableHead>班次時間</TableHead>
                  <TableHead>路線編號</TableHead>
                  <TableHead>預約座位</TableHead>
                  <TableHead>截止日期</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-admin-border">
                {batchPreview.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-admin-softText">
                      <span className="flex min-w-[196px] items-center gap-1">
                        <Input
                          className="h-10 w-16 border-admin-borderStrong bg-admin-bg px-1 text-center font-mono text-admin-text placeholder:text-admin-muted"
                          inputMode="numeric"
                          maxLength={4}
                          placeholder="YYYY"
                          ref={(element) => {
                            batchInputRefs.current[`${item.id}-date-0`] =
                              element;
                          }}
                          value={item.date.split("-")[0] ?? ""}
                          onChange={(event) =>
                            updateBatchDateSegment(item, 0, event.target.value)
                          }
                        />
                        <span>/</span>
                        <Input
                          className="h-10 w-11 border-admin-borderStrong bg-admin-bg px-1 text-center font-mono text-admin-text placeholder:text-admin-muted"
                          inputMode="numeric"
                          maxLength={2}
                          placeholder="MM"
                          ref={(element) => {
                            batchInputRefs.current[`${item.id}-date-1`] =
                              element;
                          }}
                          value={item.date.split("-")[1] ?? ""}
                          onChange={(event) =>
                            updateBatchDateSegment(item, 1, event.target.value)
                          }
                        />
                        <span>/</span>
                        <Input
                          className="h-10 w-11 border-admin-borderStrong bg-admin-bg px-1 text-center font-mono text-admin-text placeholder:text-admin-muted"
                          inputMode="numeric"
                          maxLength={2}
                          placeholder="DD"
                          ref={(element) => {
                            batchInputRefs.current[`${item.id}-date-2`] =
                              element;
                          }}
                          value={item.date.split("-")[2] ?? ""}
                          onChange={(event) =>
                            updateBatchDateSegment(item, 2, event.target.value)
                          }
                        />
                        <Popover
                          open={batchOperationDateCalendarId === item.id}
                          onOpenChange={(isOpen) =>
                            setBatchOperationDateCalendarId(
                              isOpen ? item.id : null,
                            )
                          }
                        >
                          <PopoverTrigger asChild>
                            <button
                              aria-label="選擇營運日期"
                              className="grid h-10 w-10 shrink-0 place-items-center rounded-adminControl border border-admin-borderStrong bg-admin-bg text-admin-muted transition hover:border-adminStatus-enabled hover:text-adminStatus-enabled"
                              type="button"
                            >
                              <CalendarIcon
                                aria-hidden="true"
                                className="h-4 w-4"
                              />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="start"
                            className="!z-[60] !w-auto !bg-admin-surface !p-2 !text-admin-text"
                          >
                            <Calendar
                              mode="single"
                              selected={
                                getDateFromInputValue(item.date) ?? undefined
                              }
                              onSelect={(date) => {
                                if (!date) return;
                                updateBatchPreviewItem(
                                  item.id,
                                  "date",
                                  formatDate(date),
                                );
                                setBatchOperationDateCalendarId(null);
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </span>
                    </TableCell>
                    <TableCell className="font-bold text-admin-text">
                      <span className="flex min-w-[126px] items-center gap-1">
                        <Input
                          className="h-10 w-12 border-admin-borderStrong bg-admin-bg px-1 text-center font-mono text-admin-text placeholder:text-admin-muted"
                          inputMode="numeric"
                          maxLength={2}
                          placeholder="HH"
                          ref={(element) => {
                            batchInputRefs.current[`${item.id}-time-0`] =
                              element;
                          }}
                          value={item.time.split(":")[0] ?? ""}
                          onChange={(event) =>
                            updateBatchTimeSegment(item, 0, event.target.value)
                          }
                        />
                        <span>:</span>
                        <Input
                          className="h-10 w-12 border-admin-borderStrong bg-admin-bg px-1 text-center font-mono text-admin-text placeholder:text-admin-muted"
                          inputMode="numeric"
                          maxLength={2}
                          placeholder="MM"
                          ref={(element) => {
                            batchInputRefs.current[`${item.id}-time-1`] =
                              element;
                          }}
                          value={item.time.split(":")[1] ?? ""}
                          onChange={(event) =>
                            updateBatchTimeSegment(item, 1, event.target.value)
                          }
                        />
                      </span>
                    </TableCell>
                    <TableCell className="text-admin-softText">
                      <select
                        aria-label="選擇路線"
                        className="h-10 w-full min-w-[126px] rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 font-bold text-admin-text outline-none focus:border-adminStatus-enabled"
                        ref={(element) => {
                          batchInputRefs.current[`${item.id}-route`] = element;
                        }}
                        value={item.routeId}
                        onChange={(event) =>
                          updateBatchPreviewRoute(item.id, event.target.value)
                        }
                      >
                        <option value="">選擇路線</option>
                        {activeRoutes.map((route) => (
                          <option key={route.routeId} value={route.routeId}>
                            {route.routeNumber}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className="text-admin-softText">
                      <Input
                        className="h-10 w-full min-w-[106px] rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-admin-text outline-none focus:border-adminStatus-enabled"
                        min={1}
                        type="number"
                        value={item.quota}
                        onChange={(event) =>
                          updateBatchPreviewItem(
                            item.id,
                            "quota",
                            Number(event.target.value),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="text-admin-softText">
                      <span className="flex min-w-[276px] items-center gap-2">
                        <Popover
                          open={batchDeadlineCalendarId === item.id}
                          onOpenChange={(open) =>
                            setBatchDeadlineCalendarId(open ? item.id : null)
                          }
                        >
                          <PopoverTrigger asChild>
                            <button
                              className="flex h-10 min-w-[138px] items-center justify-between rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-left text-admin-text"
                              type="button"
                            >
                              <span>
                                {item.bookingCloseRule.split("T")[0] ||
                                  "截止日期"}
                              </span>
                              <CalendarIcon
                                aria-hidden="true"
                                className="h-4 w-4 text-admin-muted"
                              />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="start"
                            className="!z-[60] !w-auto !bg-admin-surface !p-2 !text-admin-text"
                          >
                            <Calendar
                              mode="single"
                              selected={
                                getDateFromInputValue(
                                  item.bookingCloseRule.split("T")[0],
                                ) ?? undefined
                              }
                              onSelect={(date) =>
                                setBatchDeadlineDate(item.id, date)
                              }
                            />
                          </PopoverContent>
                        </Popover>
                        <Input
                          className="h-10 w-12 border-admin-borderStrong bg-admin-bg px-1 text-center font-mono text-admin-text placeholder:text-admin-muted"
                          disabled={!item.bookingCloseRule}
                          inputMode="numeric"
                          maxLength={2}
                          placeholder="HH"
                          ref={(element) => {
                            batchInputRefs.current[`${item.id}-deadline-0`] =
                              element;
                          }}
                          value={
                            item.bookingCloseRule
                              .split("T")[1]
                              ?.split(":")[0] ?? ""
                          }
                          onChange={(event) =>
                            updateBatchDeadlineTimeSegment(
                              item,
                              0,
                              event.target.value,
                            )
                          }
                        />
                        <span>:</span>
                        <Input
                          className="h-10 w-12 border-admin-borderStrong bg-admin-bg px-1 text-center font-mono text-admin-text placeholder:text-admin-muted"
                          disabled={!item.bookingCloseRule}
                          inputMode="numeric"
                          maxLength={2}
                          placeholder="MM"
                          ref={(element) => {
                            batchInputRefs.current[`${item.id}-deadline-1`] =
                              element;
                          }}
                          value={
                            item.bookingCloseRule
                              .split("T")[1]
                              ?.split(":")[1] ?? ""
                          }
                          onChange={(event) =>
                            updateBatchDeadlineTimeSegment(
                              item,
                              1,
                              event.target.value,
                            )
                          }
                        />
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        className="rounded-adminControl border border-red-400/40 px-3 py-2 text-xs font-semibold text-red-300"
                        type="button"
                        onClick={() =>
                          setBatchPreview((current) =>
                            current.filter((preview) => preview.id !== item.id),
                          )
                        }
                      >
                        刪除
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {pendingExcelImport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-excel-import-title"
        >
          <section className="w-full max-w-md rounded-adminPanel border border-admin-borderStrong bg-admin-surface p-5 shadow-adminPanel">
            <h2 className="admin-section-title" id="confirm-excel-import-title">
              Excel 匯入結果
            </h2>
            <p className="mt-3 text-sm leading-6 text-admin-softText">
              已匯入「{pendingExcelImport.fileName}」中的
              <span className="mx-1 font-bold text-adminStatus-enabled">
                {pendingExcelImport.preview.length}
              </span>
              筆批次班次。
            </p>
            {pendingExcelImport.errors.length > 0 && (
              <p className="mt-2 rounded-adminControl border border-star-300/40 bg-star-100/10 px-3 py-2 text-sm leading-6 text-admin-muted">
                略過 {pendingExcelImport.errors.length} 筆格式或資料錯誤的資料：
                {pendingExcelImport.errors.slice(0, 2).join("；")}
              </p>
            )}
            <p className="mt-2 rounded-adminControl border border-admin-border bg-admin-bg px-3 py-2 text-sm leading-6 text-admin-muted">
              請確認下方批次預覽清單後再建立班次。
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="h-10 rounded-adminControl border border-admin-borderStrong px-4 text-sm font-semibold text-admin-softText"
                type="button"
                onClick={() => {
                  setPendingExcelImport(null);
                }}
              >
                取消
              </button>
              <button
                className="h-10 rounded-adminControl bg-adminStatus-enabled px-4 text-sm font-bold text-admin-bg"
                type="button"
                onClick={confirmBatchExcelImport}
              >
                確認
              </button>
            </div>
          </section>
        </div>
      )}

      {isImportDateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-schedules-title"
        >
          <section className="w-full max-w-md rounded-adminPanel border border-admin-borderStrong bg-admin-surface p-5 shadow-adminPanel">
            <h2 className="admin-section-title" id="import-schedules-title">
              複製班次
            </h2>

            <label className="mt-5 block text-sm font-medium text-admin-softText">
              可直接輸入 YYYY-MM-DD，或點選日曆選擇日期。
              <div className="mt-2 flex gap-2">
                <Input
                  className="h-11 border-admin-borderStrong bg-admin-bg text-admin-text placeholder:text-admin-muted"
                  inputMode="numeric"
                  placeholder="YYYY-MM-DD"
                  type="text"
                  value={importSourceDate}
                  onChange={(event) => setImportSourceDate(event.target.value)}
                />
                <Popover
                  open={isImportCalendarOpen}
                  onOpenChange={setIsImportCalendarOpen}
                >
                  <PopoverTrigger asChild>
                    <button
                      aria-label="開啟日曆"
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-adminControl border border-admin-borderStrong bg-admin-bg text-admin-softText hover:border-adminStatus-enabled hover:text-adminStatus-enabled"
                      type="button"
                    >
                      <CalendarIcon aria-hidden="true" className="h-5 w-5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="!z-[60] !w-auto !bg-admin-surface !p-2 !text-admin-text"
                  >
                    <Calendar
                      mode="single"
                      selected={
                        getDateFromInputValue(importSourceDate) ?? undefined
                      }
                      onSelect={(date) => {
                        if (!date) return;
                        setImportSourceDate(formatDate(date));
                        setIsImportCalendarOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </label>
            <p className="mt-2 rounded-adminControl border border-star-300/40 bg-star-100/10 px-3 py-2 text-sm leading-6 text-admin-muted">
              確認後會複製所選日期的班次資料，並以明日作為營運日期、發車前 30
              分鐘作為截止時間。
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="h-10 rounded-adminControl border border-admin-borderStrong px-4 text-sm font-semibold text-admin-softText"
                disabled={isImportingSchedules}
                type="button"
                onClick={() => setIsImportDateModalOpen(false)}
              >
                取消
              </button>
              <button
                className="h-10 rounded-adminControl bg-adminStatus-enabled px-4 text-sm font-bold text-admin-bg disabled:opacity-50"
                disabled={!importSourceDate || isImportingSchedules}
                type="button"
                onClick={() => void importSchedulesFromDate()}
              >
                {isImportingSchedules ? "複製中…" : "確認複製班表"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
