import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createDailyOpenSchedule,
  createDailyOpenSchedulesBatch,
  type DailyOpenSchedulePayload,
} from "../../api/admin/schedules";
import {
  type AdminRoute,
  getRoutes,
  type RouteStop,
} from "../../api/admin/routes";

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

interface PreviewSchedule {
  id: string;
  date: string;
  time: string;
  routeId: string;
  routeName: string;
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
const departureTimeOptions = ["05:30", "06:00", "06:30", "07:00", "07:30", "08:00"];

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

function getBookingCloseAt(operationDate: string) {
  const date = getDateFromInputValue(operationDate);
  if (!date) return "";
  return `${formatDate(addDays(date, -1))}T23:59`;
}

function createEmptyScheduleForm(): ScheduleForm {
  const operationDate = formatDate(addDays(new Date(), 1));

  return {
    routeId: "",
    operationDate,
    departureTime: "06:30",
    scheduleName: "",
    totalQuota: 20,
    bookingCloseAt: getBookingCloseAt(operationDate),
  };
}

function formatTime(date: Date) {
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
}

function formatDateTimeInput(date: Date) {
  return `${formatDate(date)}T${formatTime(date)}`;
}

function getDateTimeFromValues(dateValue: string, timeValue: string) {
  const date = getDateFromInputValue(dateValue);
  if (!date) return null;

  const [hour, minute] = timeValue.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;

  date.setHours(hour, minute, 0, 0);
  return date;
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedRoute = useMemo(
    () => getRoute(routes, scheduleForm.routeId),
    [routes, scheduleForm.routeId],
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
      const firstRoute = loadedRoutes[0] ?? null;

      setRoutes(loadedRoutes);
      setScheduleForm((current) => {
        const currentRoute = getRoute(loadedRoutes, current.routeId);
        return { ...current, routeId: currentRoute?.routeId ?? "" };
      });
      setStopSettings((current) => {
        const currentRoute = getRoute(loadedRoutes, scheduleForm.routeId);
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
    setStopSettings(buildStopSettings(route, scheduleForm.totalQuota));
  };

  const handleOperationDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    setOperationDate(event.target.value);
  };

  const setOperationDate = (operationDate: string) => {
    setScheduleForm((current) => ({
      ...current,
      operationDate,
      bookingCloseAt: getBookingCloseAt(operationDate),
    }));
  };

  const shiftOperationDate = (days: number) => {
    const date = getDateFromInputValue(scheduleForm.operationDate);
    if (!date) return;
    setOperationDate(formatDate(addDays(date, days)));
  };

  const setDepartureTime = (departureTime: string) => {
    updateScheduleForm("departureTime", departureTime);
  };

  const adjustDepartureTime = (minutes: number) => {
    setDepartureTime(addMinutesToTime(scheduleForm.departureTime, minutes));
  };

  const setBookingCloseAtByRule = (
    rule: "previous-day-2359" | "previous-day-1800" | "departure-minus-30",
  ) => {
    const operationDate = getDateFromInputValue(scheduleForm.operationDate);
    if (!operationDate) return;

    if (rule === "previous-day-2359") {
      updateScheduleForm(
        "bookingCloseAt",
        `${formatDate(addDays(operationDate, -1))}T23:59`,
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

    if (
      !scheduleForm.routeId ||
      !scheduleForm.operationDate ||
      !scheduleForm.departureTime ||
      !scheduleForm.bookingCloseAt
    ) {
      setNotice({
        type: "error",
        message: "請填寫路線、營運日期、班次時間與預約截止。",
      });
      return;
    }

    if (enabledStopQuota <= 0) {
      setNotice({ type: "error", message: "可預約名額必須大於 0。" });
      return;
    }

    if (stopSettings.every((stop) => !stop.isEnabled)) {
      setNotice({ type: "error", message: "請至少開放一個可預約上車站。" });
      return;
    }

    const payload: DailyOpenSchedulePayload = {
      routeId: scheduleForm.routeId,
      departureTime: scheduleForm.departureTime,
      openDate: scheduleForm.operationDate,
      quota: enabledStopQuota,
      status: "ACTIVE",
    };

    try {
      setIsSavingSchedule(true);
      const created = await createDailyOpenSchedule(payload);
      setNotice({
        type: "success",
        message: `已建立派班資料：${generatedScheduleName}，名額 ${created.quota}。`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "建立派班資料失敗。",
      });
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const saveBatchSchedules = async () => {
    if (batchPreview.length === 0) return;

    const schedules: DailyOpenSchedulePayload[] = batchPreview.map((item) => ({
      routeId: item.routeId,
      departureTime: item.time,
      openDate: item.date,
      quota: item.quota,
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

  const downloadBatchTemplate = async () => {
    const { default: ExcelJS } = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("批次班次匯入");

    worksheet.columns = [
      { header: "路線編號", key: "routeNumber", width: 16 },
      { header: "路線名稱", key: "routeName", width: 24 },
      { header: "營運日期", key: "date", width: 16 },
      { header: "班次時間", key: "time", width: 14 },
      { header: "預約名額", key: "quota", width: 12 },
      { header: "預約截止", key: "bookingCloseAt", width: 24 },
    ];

    worksheet.addRows([
      {
        routeNumber: "1571",
        routeName: "宜蘭－市府轉運站",
        date: "2026-07-01",
        time: "05:30",
        quota: 20,
        bookingCloseAt: "2026/6/30 11:59:00 PM",
      },
      {
        routeNumber: "1571",
        routeName: "宜蘭－市府轉運站",
        date: "2026-07-01",
        time: "06:00",
        quota: 20,
        bookingCloseAt: "2026/6/30 11:59:00 PM",
      },
    ]);

    worksheet.views = [{ state: "frozen", ySplit: 1 }];
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF047857" },
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

  const importBatchExcel = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
        const routeNameText = getCellText(row.getCell(2).value);
        const date = getCellDate(row.getCell(3).value);
        const time = getCellTime(row.getCell(4).value);
        const quota = Number(getCellText(row.getCell(5).value));
        const bookingCloseAt = getCellDateTime(row.getCell(6).value);
        const isEmptyRow = [routeNumber, routeNameText, date, time].every(
          (value) => !value,
        );

        if (isEmptyRow) return;

        const route = routes.find(
          (item) =>
            item.routeNumber === routeNumber ||
            item.routeName === routeNameText,
        );

        if (!routeNumber && !routeNameText) {
          errors.push(`第 ${rowNumber} 列缺少路線編號或路線名稱`);
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
          errors.push(`第 ${rowNumber} 列預約名額必須大於 0`);
          return;
        }

        if (!bookingCloseAt) {
          errors.push(
            `第 ${rowNumber} 列預約截止格式錯誤，請使用 YYYY/M/D h:mm:ss AM/PM`,
          );
          return;
        }

        if (!route) {
          errors.push(`第 ${rowNumber} 列找不到對應路線`);
          return;
        }

        preview.push({
          id: `${date}-${time}-${rowNumber}`,
          date,
          time,
          routeId: route.routeId,
          routeName: route.routeName,
          quota,
          bookingCloseRule: bookingCloseAt,
        });
      });

      setBatchPreview(preview);
      setNotice({
        type: errors.length ? "error" : "success",
        message: errors.length
          ? `已匯入 ${preview.length} 筆，另有 ${errors.length} 筆錯誤：${errors.slice(0, 3).join("；")}`
          : `已匯入 ${preview.length} 筆批次班次。`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "匯入 Excel 失敗。",
      });
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="admin-page-kicker">DISPATCH MANAGEMENT</p>
          <h1 className="admin-page-title">班次設定</h1>
          <p className="admin-page-description">
            建立營運預約班次，提供路線、站位、預約時段與可預約人數設定。
          </p>
        </div>
      </section>

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

      <form
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]"
        onSubmit={saveSchedule}
      >
        <div className="space-y-6">
          <section className="admin-panel-body">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="admin-section-title">一、基本資料</h2>
                <p className="mt-1 text-sm text-admin-muted">
                  指定路線、日期、班次時間與預約截止。
                </p>
              </div>
              <span className="rounded-full bg-admin-elevated px-3 py-1 text-xs font-bold text-admin-softText">
                單筆建立
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-admin-softText">
                路線 <span className="text-red-300">*</span>
                <select
                  className={inputClass}
                  disabled={isRoutesLoading || routes.length === 0}
                  value={scheduleForm.routeId}
                  onChange={handleRouteChange}
                >
                  {isRoutesLoading ? (
                    <option value="">讀取路線中…</option>
                  ) : routes.length === 0 ? (
                    <option value="">目前沒有路線資料</option>
                  ) : (
                    routes.map((route) => (
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
                <input
                  className={inputClass}
                  type="date"
                  value={scheduleForm.operationDate}
                  onClick={openInputPicker}
                  onChange={handleOperationDateChange}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    className="rounded-adminControl border border-admin-borderStrong px-3 py-1.5 text-xs font-semibold text-admin-softText"
                    type="button"
                    onClick={() => shiftOperationDate(-1)}
                  >
                    前一天
                  </button>
                  <button
                    className="rounded-adminControl border border-admin-borderStrong px-3 py-1.5 text-xs font-semibold text-admin-softText"
                    type="button"
                    onClick={() => shiftOperationDate(1)}
                  >
                    後一天
                  </button>
                  {dateQuickOptions.map((option) => {
                    const value = formatDate(addDays(new Date(), option.offset));
                    const isActive = scheduleForm.operationDate === value;

                    return (
                      <button
                        className={`rounded-adminControl border px-3 py-1.5 text-xs font-semibold ${
                          isActive
                            ? "border-adminStatus-enabled bg-adminStatus-enabled/10 text-adminStatus-enabled"
                            : "border-admin-borderStrong text-admin-softText"
                        }`}
                        key={option.label}
                        type="button"
                        onClick={() => setOperationDate(value)}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </label>

              <label className="text-sm font-medium text-admin-softText">
                班次時間 <span className="text-red-300">*</span>
                <input
                  className={inputClass}
                  type="time"
                  value={scheduleForm.departureTime}
                  onClick={openInputPicker}
                  onChange={(event) =>
                    updateScheduleForm("departureTime", event.target.value)
                  }
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    className="rounded-adminControl border border-admin-borderStrong px-3 py-1.5 text-xs font-semibold text-admin-softText"
                    type="button"
                    onClick={() => adjustDepartureTime(-10)}
                  >
                    -10 分
                  </button>
                  <button
                    className="rounded-adminControl border border-admin-borderStrong px-3 py-1.5 text-xs font-semibold text-admin-softText"
                    type="button"
                    onClick={() => adjustDepartureTime(10)}
                  >
                    +10 分
                  </button>
                  {departureTimeOptions.map((time) => {
                    const isActive = scheduleForm.departureTime === time;

                    return (
                      <button
                        className={`rounded-adminControl border px-3 py-1.5 text-xs font-semibold ${
                          isActive
                            ? "border-adminStatus-enabled bg-adminStatus-enabled/10 text-adminStatus-enabled"
                            : "border-admin-borderStrong text-admin-softText"
                        }`}
                        key={time}
                        type="button"
                        onClick={() => setDepartureTime(time)}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </label>

              <label className="text-sm font-medium text-admin-softText">
                班次名稱
                <input
                  className={inputClass}
                  placeholder={generatedScheduleName}
                  value={scheduleForm.scheduleName}
                  onChange={(event) =>
                    updateScheduleForm("scheduleName", event.target.value)
                  }
                />
                <span className="mt-1 block text-xs text-admin-muted">
                  留空會使用：{generatedScheduleName}
                </span>
              </label>

              <label className="text-sm font-medium text-admin-softText">
                預約截止 <span className="text-red-300">*</span>
                <input
                  className={inputClass}
                  type="datetime-local"
                  value={scheduleForm.bookingCloseAt}
                  onClick={openInputPicker}
                  onChange={(event) =>
                    updateScheduleForm("bookingCloseAt", event.target.value)
                  }
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    className="rounded-adminControl border border-admin-borderStrong px-3 py-1.5 text-xs font-semibold text-admin-softText"
                    type="button"
                    onClick={() => setBookingCloseAtByRule("previous-day-2359")}
                  >
                    前一天 23:59
                  </button>
                  <button
                    className="rounded-adminControl border border-admin-borderStrong px-3 py-1.5 text-xs font-semibold text-admin-softText"
                    type="button"
                    onClick={() => setBookingCloseAtByRule("previous-day-1800")}
                  >
                    前一天 18:00
                  </button>
                  <button
                    className="rounded-adminControl border border-admin-borderStrong px-3 py-1.5 text-xs font-semibold text-admin-softText"
                    type="button"
                    onClick={() => setBookingCloseAtByRule("departure-minus-30")}
                  >
                    發車前 30 分
                  </button>
                </div>
              </label>
            </div>
          </section>

          <section className="admin-panel-body">
            <h2 className="admin-section-title">二、站位預約設定</h2>
            <p className="mt-1 text-sm text-admin-muted">
              依路線帶出站位，可控制該班次哪些站位開放預約與站位名額。
            </p>

            <div className="mt-5 space-y-3">
              {stopSettings.map((stop, index) => (
                <div
                  className={`grid gap-3 rounded-adminControl border px-4 py-3 md:grid-cols-[auto_minmax(0,1fr)_160px_auto] md:items-center ${
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
                    <p className="font-bold text-admin-text">{stop.stopName}</p>
                    <p className="mt-1 text-xs text-admin-muted">
                      {stop.isEnabled ? "此站開放預約" : "此站不開放預約"}
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
                              ? { ...item, quota: Number(event.target.value) }
                              : item,
                          ),
                        )
                      }
                    />
                  </label>
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
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="admin-panel-body">
            <h2 className="admin-section-title">三、預約控制設定</h2>
            <p className="mt-1 text-sm text-admin-muted">
              確認目前設定後建立派班資料。
            </p>

            <div className="mt-5 rounded-adminControl border border-admin-border bg-admin-bg p-4">
              <p className="text-xs font-bold text-admin-muted">目前設定摘要</p>
              <p className="mt-2 text-sm text-admin-softText">
                班次：
                <span className="font-bold text-admin-text">
                  {scheduleForm.scheduleName || generatedScheduleName}
                </span>
              </p>
              <p className="mt-1 text-sm text-admin-softText">
                營運日期：
                <span className="font-bold text-admin-text">
                  {scheduleForm.operationDate}
                </span>
              </p>
              <p className="mt-1 text-sm text-admin-softText">
                預約截止：
                <span className="font-bold text-admin-text">
                  {scheduleForm.bookingCloseAt.replace("T", " ")}
                </span>
              </p>
              <p className="mt-1 text-sm text-admin-softText">
                開放站位名額合計：
                <span className="font-bold text-admin-text">
                  {enabledStopQuota}
                </span>
              </p>
              <p className="mt-1 text-sm text-admin-softText">
                開放站位數：
                <span className="font-bold text-admin-text">
                  {stopSettings.filter((stop) => stop.isEnabled).length}
                </span>
              </p>
            </div>

            <button
              className="mt-5 h-11 w-full rounded-adminControl bg-adminStatus-enabled px-5 text-sm font-bold text-admin-bg disabled:opacity-60"
              disabled={isSavingSchedule}
              type="submit"
            >
              {isSavingSchedule ? "建立中…" : "建立派班資料"}
            </button>
          </section>
        </aside>
      </form>

      <section className="admin-panel-body">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="admin-section-title">四、批次建立班次</h2>
            <p className="mt-1 text-sm text-admin-muted">
              下載 Excel 格式填寫班次資料，匯入後會顯示於下方批次清單。
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="rounded-adminControl border border-admin-border bg-admin-bg p-4">
            <p className="text-sm font-bold text-admin-text">Excel 欄位格式</p>
            <p className="mt-2 text-sm leading-6 text-admin-muted">
              路線編號、路線名稱、營運日期、班次時間、預約名額、預約截止。
              營運日期請使用 YYYY-MM-DD，班次時間請使用 HH:mm，預約截止可使用
              2026/6/26 11:59:00 PM。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="h-11 rounded-adminControl border border-admin-borderStrong px-5 text-sm font-semibold text-admin-softText"
              type="button"
              onClick={downloadBatchTemplate}
            >
              下載 Excel 格式
            </button>
            <button
              className="h-11 rounded-adminControl bg-adminStatus-enabled px-5 text-sm font-bold text-admin-bg"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              匯入 Excel
            </button>
            <input
              accept=".xlsx,.xls"
              className="hidden"
              ref={fileInputRef}
              type="file"
              onChange={importBatchExcel}
            />
          </div>
        </div>
      </section>

      <section className="admin-panel-body overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-admin-border px-5 py-4">
          <div>
            <h2 className="admin-section-title">五、匯入批次清單</h2>
            <p className="mt-1 text-sm text-admin-muted">
              確認匯入的日期、時間、名額與預約截止後再送出。
            </p>
          </div>
          <button
            className="h-10 rounded-adminControl border border-admin-borderStrong px-4 text-sm font-semibold text-admin-softText disabled:opacity-50"
            disabled={batchPreview.length === 0 || isSavingBatch}
            type="button"
            onClick={saveBatchSchedules}
          >
            {isSavingBatch ? "建立中…" : "確認建立批次班次"}
          </button>
        </div>

        {batchPreview.length === 0 ? (
          <p className="px-5 py-8 text-center text-admin-muted">
            尚未匯入批次清單。
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-admin-bg text-admin-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">日期</th>
                  <th className="px-5 py-3 font-semibold">時間</th>
                  <th className="px-5 py-3 font-semibold">路線</th>
                  <th className="px-5 py-3 font-semibold">預約名額</th>
                  <th className="px-5 py-3 font-semibold">預約截止</th>
                  <th className="px-5 py-3 font-semibold">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {batchPreview.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3 text-admin-softText">
                      {item.date}
                    </td>
                    <td className="px-5 py-3 font-bold text-admin-text">
                      {item.time}
                    </td>
                    <td className="px-5 py-3 text-admin-softText">
                      {item.routeName}
                    </td>
                    <td className="px-5 py-3 text-admin-softText">
                      {item.quota}
                    </td>
                    <td className="px-5 py-3 text-admin-softText">
                      {item.bookingCloseRule}
                    </td>
                    <td className="px-5 py-3">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
