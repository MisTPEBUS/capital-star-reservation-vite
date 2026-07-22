import { useEffect, useMemo, useState } from "react";
import { FaCaretLeft, FaCaretRight } from "react-icons/fa";
import {
  type DashboardDailyOpenSchedule,
  type DashboardReservation,
  createAdminReservation,
  deleteAdminReservation,
  getDashboardDailyOpenSchedules,
  getDashboardScheduleReservations,
  updateAdminReservation,
} from "../../api/admin/dashboard";
import { getRoutes } from "../../api/admin/routes";
import { cancelDailyOpenSchedule } from "../../api/admin/schedules";
import { DataTable } from "../components/DataTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

const defaultPassengerNotificationText =
  "您好，您預約的首都之星班次因故取消。造成不便，敬請見諒。";

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateFromValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

function getTodayValue() {
  return formatDateValue(new Date());
}

function openInputPicker(event: React.MouseEvent<HTMLInputElement>) {
  event.currentTarget.showPicker?.();
}

function formatDepartureTime(value: string) {
  return value.slice(0, 5);
}

function getScheduleDepartureDate(schedule: DashboardDailyOpenSchedule) {
  const dateMatch = schedule.openDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const timeMatch = schedule.departureTime.match(/^(\d{1,2}):(\d{2})/);

  if (!dateMatch || !timeMatch) return null;

  const [, year, month, day] = dateMatch;
  const [, hour, minute] = timeMatch;

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

function hasScheduleDeparted(schedule: DashboardDailyOpenSchedule) {
  const departureDate = getScheduleDepartureDate(schedule);

  if (!departureDate || Number.isNaN(departureDate.getTime())) return false;

  return departureDate.getTime() <= Date.now();
}

function getScheduleName(schedule: DashboardDailyOpenSchedule) {
  return `${schedule.routeNumber}｜${schedule.routeName}`;
}

function getStatusText(status: string) {
  if (status === "ACTIVE") return "啟用";
  if (status === "INACTIVE") return "停班";
  return status;
}

export function DashboardPage() {
  const [openDate, setOpenDate] = useState(getTodayValue());
  const [schedules, setSchedules] = useState<DashboardDailyOpenSchedule[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState("ALL");
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null,
  );
  const [reservations, setReservations] = useState<DashboardReservation[]>([]);
  const [newReservation, setNewReservation] = useState<{
    name: string;
    phone: string;
    passengerCount: number;
  } | null>(null);
  const [isCreatingReservation, setIsCreatingReservation] = useState(false);
  const [editingReservation, setEditingReservation] = useState<{
    reservationId: string;
    name: string;
    phone: string;
    passengerCount: number;
    pickupStopId: string | null;
  } | null>(null);
  const [isUpdatingReservation, setIsUpdatingReservation] = useState(false);
  const [deletingReservationId, setDeletingReservationId] = useState<
    string | null
  >(null);
  const [reservationRefreshKey, setReservationRefreshKey] = useState(0);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportScope, setExportScope] = useState<"SELECTED" | "DAY">(
    "SELECTED",
  );
  const [exportRouteId, setExportRouteId] = useState("ALL");
  const [includeCancelledForExport, setIncludeCancelledForExport] =
    useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSchedulesLoading, setIsSchedulesLoading] = useState(false);
  const [isReservationsLoading, setIsReservationsLoading] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancellingSchedule, setIsCancellingSchedule] = useState(false);
  const [cancelNotificationText, setCancelNotificationText] = useState(
    defaultPassengerNotificationText,
  );
  const [cancelScheduleError, setCancelScheduleError] = useState("");
  const [hideCancelledReservations, setHideCancelledReservations] =
    useState(false);
  const [schedulesError, setSchedulesError] = useState("");
  const [reservationsError, setReservationsError] = useState("");
  const todayValue = getTodayValue();

  useEffect(() => {
    const timers = [
      schedulesError && window.setTimeout(() => setSchedulesError(""), 5000),
      reservationsError &&
        window.setTimeout(() => setReservationsError(""), 5000),
      cancelScheduleError &&
        window.setTimeout(() => setCancelScheduleError(""), 5000),
    ].filter(Boolean) as number[];

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [schedulesError, reservationsError, cancelScheduleError]);

  const routeOptions = useMemo(
    () =>
      Array.from(
        new Map(
          schedules.map((schedule) => [
            schedule.routeId,
            {
              routeNumber: schedule.routeNumber,
              routeName: schedule.routeName,
            },
          ]),
        ).entries(),
      ).map(([routeId, route]) => ({ routeId, ...route })),
    [schedules],
  );

  const filteredSchedules = useMemo(
    () =>
      selectedRouteId === "ALL"
        ? schedules
        : schedules.filter((schedule) => schedule.routeId === selectedRouteId),
    [schedules, selectedRouteId],
  );

  const selectedSchedule = useMemo(
    () =>
      schedules.find(
        (schedule) => schedule.dailyOpenScheduleId === selectedScheduleId,
      ) ?? null,
    [schedules, selectedScheduleId],
  );

  const isSelectedScheduleDeparted = selectedSchedule
    ? hasScheduleDeparted(selectedSchedule)
    : false;

  const filteredReservations = useMemo(
    () =>
      hideCancelledReservations
        ? reservations.filter(
            (reservation) => reservation.status === "RESERVED",
          )
        : reservations,
    [hideCancelledReservations, reservations],
  );

  const reservationRows = useMemo(
    () =>
      filteredReservations.map((reservation) => ({
        ...reservation,
        departureTime: selectedSchedule
          ? formatDepartureTime(selectedSchedule.departureTime)
          : "",
      })),
    [filteredReservations, selectedSchedule],
  );

  const totalReservedCount = schedules.reduce(
    (sum, schedule) =>
      sum + (schedule.reservedPassengerCount ?? schedule.reservedCount),
    0,
  );
  const totalAvailableSeats = schedules.reduce(
    (sum, schedule) => sum + schedule.availableSeats,
    0,
  );

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      try {
        setIsSchedulesLoading(true);
        setSchedulesError("");
        setReservations([]);

        const result = await getDashboardDailyOpenSchedules(openDate);
        if (!isCurrent) return;

        const sortedSchedules = [...result].sort((a, b) =>
          a.departureTime.localeCompare(b.departureTime),
        );

        setSchedules(sortedSchedules);
        setSelectedScheduleId(sortedSchedules[0]?.dailyOpenScheduleId ?? null);
      } catch (error) {
        if (!isCurrent) return;

        setSchedules([]);
        setSelectedScheduleId(null);
        setSchedulesError(
          error instanceof Error ? error.message : "讀取當日開放班次失敗。",
        );
      } finally {
        if (isCurrent) {
          setIsSchedulesLoading(false);
        }
      }
    }

    load();

    return () => {
      isCurrent = false;
    };
  }, [openDate]);

  useEffect(() => {
    if (
      selectedScheduleId &&
      filteredSchedules.some(
        (schedule) => schedule.dailyOpenScheduleId === selectedScheduleId,
      )
    ) {
      return;
    }

    setSelectedScheduleId(filteredSchedules[0]?.dailyOpenScheduleId ?? null);
  }, [filteredSchedules, selectedScheduleId]);

  useEffect(() => {
    let isCurrent = true;

    async function loadReservations() {
      if (!selectedScheduleId) {
        setReservations([]);
        return;
      }

      try {
        setIsReservationsLoading(true);
        setReservationsError("");

        const result =
          await getDashboardScheduleReservations(selectedScheduleId);
        if (!isCurrent) return;

        setSchedules((current) =>
          current.map((schedule) =>
            schedule.dailyOpenScheduleId === result.schedule.dailyOpenScheduleId
              ? { ...schedule, ...result.schedule }
              : schedule,
          ),
        );
        setReservations(result.reservations);
      } catch (error) {
        if (!isCurrent) return;

        setReservations([]);
        setReservationsError(
          error instanceof Error ? error.message : "讀取班次預約清單失敗。",
        );
      } finally {
        if (isCurrent) {
          setIsReservationsLoading(false);
        }
      }
    }

    loadReservations();

    return () => {
      isCurrent = false;
    };
  }, [selectedScheduleId, reservationRefreshKey]);

  const handleCreateReservation = async () => {
    if (!selectedSchedule || !newReservation) return;

    const name = newReservation.name.trim();
    const phone = newReservation.phone.trim();

    if (!name || !phone) {
      setReservationsError("請填寫姓名與電話。");
      return;
    }

    if (
      !Number.isInteger(newReservation.passengerCount) ||
      newReservation.passengerCount < 1
    ) {
      setReservationsError("搭乘人數至少為 1 人。");
      return;
    }

    try {
      setIsCreatingReservation(true);
      setReservationsError("");

      const routes = await getRoutes();
      const route = routes.find(
        (item) => item.routeId === selectedSchedule.routeId,
      );
      const pickupStopId =
        reservations.find((reservation) => reservation.pickupStopId)
          ?.pickupStopId ??
        [...(route?.stops ?? [])].sort(
          (left, right) => left.sequence - right.sequence,
        )[0]?.stopId;

      if (!pickupStopId) {
        throw new Error("此路線沒有可用上車站，無法建立預約。");
      }

      await createAdminReservation({
        name,
        phone,
        passengerCount: newReservation.passengerCount,
        routeId: selectedSchedule.routeId,
        departureTime: formatDepartureTime(selectedSchedule.departureTime),
        openDate: selectedSchedule.openDate,
        pickupStopId,
      });

      setNewReservation(null);
      setReservationRefreshKey((current) => current + 1);
    } catch (error) {
      setReservationsError(
        error instanceof Error ? error.message : "建立預約失敗，請稍後再試。",
      );
    } finally {
      setIsCreatingReservation(false);
    }
  };

  const handleUpdateReservation = async () => {
    if (!editingReservation) return;

    const { reservationId, name, phone, passengerCount, pickupStopId } =
      editingReservation;

    if (!name.trim() || !phone.trim()) {
      setReservationsError("請填寫姓名與電話。");
      return;
    }

    if (!Number.isInteger(passengerCount) || passengerCount < 1) {
      setReservationsError("搭乘人數至少為 1 人。");
      return;
    }

    if (!pickupStopId) {
      setReservationsError("缺少上車站資料，無法修改預約。");
      return;
    }

    try {
      setIsUpdatingReservation(true);
      setReservationsError("");
      await updateAdminReservation(reservationId, {
        name: name.trim(),
        phone: phone.trim(),
        passengerCount,
        pickupStopId,
      });
      setEditingReservation(null);
      setReservationRefreshKey((current) => current + 1);
    } catch (error) {
      setReservationsError(
        error instanceof Error ? error.message : "修改預約失敗，請稍後再試。",
      );
    } finally {
      setIsUpdatingReservation(false);
    }
  };

  const handleDeleteReservation = async (reservation: DashboardReservation) => {
    if (!window.confirm(`確定刪除「${reservation.name}」的預約？`)) return;

    try {
      setDeletingReservationId(reservation.reservationId);
      setReservationsError("");
      await deleteAdminReservation(reservation.reservationId);
      setEditingReservation(null);
      setReservationRefreshKey((current) => current + 1);
    } catch (error) {
      setReservationsError(
        error instanceof Error ? error.message : "刪除預約失敗，請稍後再試。",
      );
    } finally {
      setDeletingReservationId(null);
    }
  };

  const downloadReservationExcel = async (
    schedulesToExport: DashboardDailyOpenSchedule[],
    includeCancelled: boolean,
  ) => {
    if (schedulesToExport.length === 0) {
      setReservationsError("沒有符合條件的班次可匯出。");
      return;
    }

    try {
      setIsExporting(true);
      const scheduleReservations = await Promise.all(
        schedulesToExport.map(async (schedule) =>
          getDashboardScheduleReservations(schedule.dailyOpenScheduleId),
        ),
      );
      const exportReservations = scheduleReservations
        .sort((a, b) =>
          a.schedule.departureTime.localeCompare(b.schedule.departureTime),
        )
        .flatMap(({ schedule, reservations: scheduleRows }) =>
          scheduleRows
            .filter(
              (reservation) =>
                includeCancelled || reservation.status === "RESERVED",
            )
            .sort((a, b) => a.sequence - b.sequence)
            .map((reservation) => ({ schedule, reservation })),
        );
      const { default: ExcelJS } = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("當日乘客名單");

      worksheet.columns = [
        { header: "班次", key: "scheduleName", width: 28 },
        { header: "發車時間", key: "departureTime", width: 14 },
        { header: "稱謂", key: "name", width: 18 },
        { header: "識別碼", key: "activeCode", width: 16 },
        { header: "上車站", key: "pickupStopName", width: 20 },
        { header: "搭乘人數", key: "passengerCount", width: 12 },

        { header: "乘車序號/電話", key: "sequence", width: 20 },
      ];

      exportReservations.forEach(({ schedule, reservation }) => {
        worksheet.addRow({
          scheduleName: getScheduleName(schedule),
          departureTime: formatDepartureTime(schedule.departureTime),
          name: reservation.name,
          sequence: reservation.sequence,
          activeCode: reservation.activeCode,
          phone: reservation.phone,
          pickupStopName: reservation.pickupStopName,
          passengerCount: reservation.passengerCount,
        });
      });

      worksheet.views = [{ state: "frozen", ySplit: 1 }];
      worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF047857" },
      };

      worksheet.eachRow((row) => {
        row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FF94A3B8" } },
            left: { style: "thin", color: { argb: "FF94A3B8" } },
            bottom: { style: "thin", color: { argb: "FF94A3B8" } },
            right: { style: "thin", color: { argb: "FF94A3B8" } },
          };
          cell.alignment = {
            horizontal: columnNumber === 4 ? "center" : "left",
            vertical: "middle",
          };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${openDate}-班次預約乘客清單.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setReservationsError(
        error instanceof Error ? error.message : "匯出當班乘客名單失敗。",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = async () => {
    const schedulesToExport =
      exportScope === "SELECTED"
        ? selectedSchedule
          ? [selectedSchedule]
          : []
        : schedules.filter(
            (schedule) =>
              exportRouteId === "ALL" || schedule.routeId === exportRouteId,
          );

    await downloadReservationExcel(
      schedulesToExport,
      includeCancelledForExport,
    );

    if (schedulesToExport.length > 0) {
      setIsExportDialogOpen(false);
    }
  };

  const openCancelScheduleModal = () => {
    if (!selectedSchedule || isSelectedScheduleDeparted) return;

    setCancelScheduleError("");
    setCancelNotificationText(defaultPassengerNotificationText);
    setIsCancelModalOpen(true);
  };

  const closeCancelScheduleModal = () => {
    if (isCancellingSchedule) return;

    setIsCancelModalOpen(false);
    setCancelScheduleError("");
  };

  const submitCancelSchedule = async () => {
    if (!selectedSchedule) return;

    const trimmedNotificationText = cancelNotificationText.trim();

    if (!trimmedNotificationText) {
      setCancelScheduleError("請輸入通知乘客的文字內容。");
      return;
    }

    try {
      setIsCancellingSchedule(true);
      setCancelScheduleError("");

      const result = await cancelDailyOpenSchedule(
        selectedSchedule.dailyOpenScheduleId,
        trimmedNotificationText,
      );

      setSchedules((current) =>
        current.map((schedule) =>
          schedule.dailyOpenScheduleId === result.dailyOpenScheduleId
            ? {
                ...schedule,
                status: result.status,
                cancelledCount:
                  schedule.cancelledCount + result.cancelledReservationCount,
                reservedCount: Math.max(
                  schedule.reservedCount - result.cancelledReservationCount,
                  0,
                ),
                availableSeats: Math.max(
                  schedule.quota -
                    Math.max(
                      schedule.reservedCount - result.cancelledReservationCount,
                      0,
                    ),
                  0,
                ),
              }
            : schedule,
        ),
      );
      setIsCancelModalOpen(false);
      await getDashboardScheduleReservations(
        selectedSchedule.dailyOpenScheduleId,
      )
        .then((nextResult) => {
          setReservations(nextResult.reservations);
          setSchedules((current) =>
            current.map((schedule) =>
              schedule.dailyOpenScheduleId ===
              nextResult.schedule.dailyOpenScheduleId
                ? { ...schedule, ...nextResult.schedule, status: result.status }
                : schedule,
            ),
          );
        })
        .catch(() => {
          setReservations([]);
        });
    } catch (error) {
      setCancelScheduleError(
        error instanceof Error ? error.message : "取消班次失敗，請稍後再試。",
      );
    } finally {
      setIsCancellingSchedule(false);
    }
  };

  const shiftOpenDate = (days: number) => {
    setOpenDate((current) =>
      formatDateValue(addDays(getDateFromValue(current), days)),
    );
  };

  return (
    <div className="admin-dashboard flex min-h-[calc(100vh-4.5rem)] flex-col space-y-4">
      {schedulesError ? (
        <p className="rounded-adminControl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {schedulesError}
        </p>
      ) : (
        <section className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className="hidden min-h-0 flex-col xl:flex xl:max-h-[calc(100vh-6.5rem)]">
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {isSchedulesLoading ? (
                <p className="px-3 py-6 text-center text-base text-admin-muted">
                  讀取班次中…
                </p>
              ) : filteredSchedules.length === 0 ? (
                <div className="rounded-adminControl border border-dashed border-admin-borderStrong bg-admin-bg px-4 py-8 text-center text-base text-admin-muted">
                  此日期沒有符合路線的開放預約班次。
                </div>
              ) : (
                filteredSchedules.map((schedule) => {
                  const isSelected =
                    schedule.dailyOpenScheduleId === selectedScheduleId;
                  const isInactive = schedule.status === "INACTIVE";
                  const reservationRate = Math.min(
                    100,
                    Math.round(
                      ((schedule.reservedPassengerCount ??
                        schedule.reservedCount) /
                        Math.max(schedule.quota, 1)) *
                        100,
                    ),
                  );

                  return (
                    <button
                      key={schedule.dailyOpenScheduleId}
                      aria-pressed={isSelected}
                      className={`group relative w-full overflow-hidden rounded-adminControl border p-4 text-left transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-adminStatus-enabled ${
                        isSelected
                          ? "border-[#0d3d2e] bg-[#145a43] shadow-[0_10px_26px_rgba(0,0,0,0.2)]"
                          : isInactive
                            ? "border-red-400/45 bg-red-400/10 hover:border-red-400/75 hover:bg-red-400/15"
                            : "border-adminStatus-enabled/45 bg-adminStatus-enabled/10 hover:-translate-y-0.5 hover:border-adminStatus-enabled hover:bg-adminStatus-enabled/15 hover:shadow-[0_8px_24px_rgba(0,0,0,0.14)]"
                      }`}
                      type="button"
                      onClick={() =>
                        setSelectedScheduleId(schedule.dailyOpenScheduleId)
                      }
                    >
                      <span
                        aria-hidden="true"
                        className={`absolute inset-y-0 left-0 w-1 ${
                          isSelected
                            ? "bg-white/80"
                            : isInactive
                              ? "bg-red-400"
                              : "bg-adminStatus-enabled"
                        }`}
                      />
                      <div className="flex items-center justify-between gap-3">
                        <p className={`text-sm font-bold tracking-[0.12em] ${isSelected ? "text-white/80" : isInactive ? "text-red-200" : "text-adminStatus-enabled"}`}>
                          路線 {schedule.routeNumber}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-sm font-bold ${
                            schedule.status === "ACTIVE"
                              ? isSelected
                                ? "bg-white/15 text-white ring-1 ring-white/25"
                                : "bg-adminStatus-enabled/15 text-adminStatus-enabled ring-1 ring-adminStatus-enabled/25"
                              : "bg-red-400/10 text-red-300 ring-1 ring-red-400/25"
                          }`}
                        >
                          {getStatusText(schedule.status)}
                        </span>
                      </div>
                      <div className="mt-4 flex items-end justify-between gap-4">
                        <div>
                          <p
                            className={`text-3xl font-bold leading-none tabular-nums ${
                              isSelected
                                ? "text-white"
                                : isInactive
                                  ? "text-red-100"
                                  : "text-admin-text"
                            }`}
                          >
                            {formatDepartureTime(schedule.departureTime)}
                          </p>
                          <p className={`mt-2 truncate text-sm font-medium ${isSelected ? "text-white/75" : isInactive ? "text-red-100/75" : "text-admin-softText"}`}>
                            {schedule.routeName}
                          </p>
                        </div>
                        <div className="min-w-[92px] text-right">
                          <p className={`text-sm font-medium ${isSelected ? "text-white/70" : isInactive ? "text-red-100/75" : "text-admin-muted"}`}>
                            預約 / 總人數
                          </p>
                          <p className={`mt-1 text-xl font-bold leading-none tabular-nums ${isSelected ? "text-white" : isInactive ? "text-red-100" : "text-admin-text"}`}>
                            {schedule.reservedPassengerCount ??
                              schedule.reservedCount}
                            <span className={`mx-1 text-base font-medium ${isSelected ? "text-white/65" : isInactive ? "text-red-100/70" : "text-admin-muted"}`}>
                              /
                            </span>
                            {schedule.quota}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <section className="admin-panel-body flex min-h-0 min-w-0 flex-col">
            <section className="  max-w-full rounded-adminControl  bg-admin-surface  ">
              <div className="flex  flex-wrap items-center gap-3">
                <div className=" grid h-11 w-[260px] max-w-full shrink-0 grid-cols-[44px_minmax(0,1fr)_44px] items-center overflow-hidden rounded-adminControl border border-admin-borderStrong bg-admin-bg">
                  <button
                    aria-label="前一天"
                    className="grid h-full place-items-center text-admin-softText hover:text-adminStatus-enabled"
                    title="前一天"
                    type="button"
                    onClick={() => shiftOpenDate(-1)}
                  >
                    <FaCaretLeft aria-hidden="true" className="text-xl" />
                  </button>
                  <label className="h-full border-x border-admin-borderStrong">
                    <input
                      aria-label="選擇日期"
                      className="h-full w-full bg-admin-bg px-3 text-center text-base font-bold text-admin-text outline-none focus:ring-2 focus:ring-inset focus:ring-adminStatus-enabled"
                      type="date"
                      value={openDate}
                      onClick={openInputPicker}
                      onChange={(event) => setOpenDate(event.target.value)}
                    />
                  </label>
                  <button
                    aria-label="後一天"
                    className="grid h-full place-items-center text-admin-softText hover:text-adminStatus-enabled"
                    title="後一天"
                    type="button"
                    onClick={() => shiftOpenDate(1)}
                  >
                    <FaCaretRight aria-hidden="true" className="text-xl" />
                  </button>
                </div>
                <button
                  className={`h-11 rounded-adminControl border px-4 text-base font-semibold ${
                    openDate === todayValue
                      ? "border-adminStatus-enabled bg-adminStatus-enabled/10 text-adminStatus-enabled"
                      : "border-admin-borderStrong text-admin-softText"
                  }`}
                  type="button"
                  onClick={() => setOpenDate(todayValue)}
                >
                  今日
                </button>
                <label className="min-w-[190px] text-base font-medium text-admin-softText">
                  <span className="sr-only">路線篩選</span>
                  <select
                    aria-label="路線篩選"
                    className="h-11 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-base font-semibold text-admin-text outline-none focus:border-adminStatus-enabled"
                    value={selectedRouteId}
                    onChange={(event) => setSelectedRouteId(event.target.value)}
                  >
                    <option value="ALL">全部路線</option>
                    {routeOptions.map((route) => (
                      <option key={route.routeId} value={route.routeId}>
                        {route.routeNumber}｜{route.routeName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex h-10 items-center gap-2 rounded-adminControl border border-admin-borderStrong px-3 text-base font-semibold text-admin-softText">
                  <input
                    className="h-4 w-4 accent-adminStatus-enabled"
                    type="checkbox"
                    checked={hideCancelledReservations}
                    onChange={(event) =>
                      setHideCancelledReservations(event.target.checked)
                    }
                  />
                  不含取消
                </label>
                <button
                  className="h-10 rounded-adminControl bg-adminStatus-enabled px-4 text-base font-bold text-admin-bg transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={schedules.length === 0}
                  type="button"
                  onClick={() => {
                    setExportScope(selectedSchedule ? "SELECTED" : "DAY");
                    setExportRouteId("ALL");
                    setIncludeCancelledForExport(false);
                    setIsExportDialogOpen(true);
                  }}
                >
                  匯出
                </button>
                <button
                  className="h-10 rounded-adminControl bg-adminStatus-enabled px-4 text-base font-bold text-admin-bg transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={
                    !selectedSchedule ||
                    selectedSchedule.status === "INACTIVE" ||
                    isSelectedScheduleDeparted ||
                    Boolean(newReservation)
                  }
                  type="button"
                  onClick={() =>
                    setNewReservation({
                      name: "",
                      phone: "",
                      passengerCount: 1,
                    })
                  }
                >
                  新增
                </button>
                <button
                  className="h-10 rounded-adminControl border border-red-400/50 bg-red-500/10 px-4 text-base font-bold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={
                    !selectedSchedule ||
                    selectedSchedule.status === "INACTIVE" ||
                    isSelectedScheduleDeparted ||
                    isCancellingSchedule
                  }
                  type="button"
                  onClick={openCancelScheduleModal}
                >
                  取消班次
                </button>
              </div>
            </section>

            {reservationsError && (
              <p className="mt-4 rounded-adminControl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                {reservationsError}
              </p>
            )}

            <div className="mt-4 min-h-0 flex-1 overflow-auto rounded-adminControl border border-admin-border">
              {isReservationsLoading ? (
                <div className="px-4 py-10 text-center text-sm text-admin-muted">
                  讀取預約清單中…
                </div>
              ) : (
                <DataTable
                  reservations={reservationRows}
                  newReservation={newReservation}
                  isCreating={isCreatingReservation}
                  onNewReservationChange={setNewReservation}
                  onCreate={handleCreateReservation}
                  onCancelCreate={() => setNewReservation(null)}
                  editingReservation={editingReservation}
                  isUpdating={isUpdatingReservation}
                  deletingReservationId={deletingReservationId}
                  onStartEdit={(reservation) =>
                    setEditingReservation({
                      reservationId: reservation.reservationId,
                      name: reservation.name,
                      phone: reservation.phone,
                      passengerCount: reservation.passengerCount,
                      pickupStopId: reservation.pickupStopId,
                    })
                  }
                  onEditingReservationChange={setEditingReservation}
                  onUpdate={handleUpdateReservation}
                  onCancelEdit={() => setEditingReservation(null)}
                  onDelete={handleDeleteReservation}
                />
              )}
            </div>
          </section>
        </section>
      )}

      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="export-reservations-dialog !max-w-xl !gap-6 !rounded-adminPanel !border !border-admin-borderStrong !bg-admin-surface !p-5 !text-admin-text shadow-adminPanel sm:!p-6">
          <DialogHeader className="border-b border-admin-border pb-5 pr-8">
            <DialogTitle className="text-3xl font-bold text-admin-text">
              匯出預約名單
            </DialogTitle>
            <DialogDescription className="text-base text-admin-muted">
              選擇要匯出的班次範圍與預約規則。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5">
            <fieldset className="grid gap-3">
              <legend className="text-base font-bold text-admin-softText">
                匯出範圍
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={!selectedSchedule}
                  aria-pressed={exportScope === "SELECTED"}
                  onClick={() => setExportScope("SELECTED")}
                  className={`rounded-adminControl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    exportScope === "SELECTED"
                      ? "border-adminStatus-enabled bg-adminStatus-enabled/10 ring-2 ring-adminStatus-enabled/20"
                      : "border-admin-borderStrong bg-admin-bg/50 hover:border-adminStatus-enabled/70 hover:bg-admin-elevated/60"
                  }`}
                >
                  <p className="font-bold text-admin-text">當班</p>
                  <p className="mt-1 text-base leading-6 text-admin-muted">
                    {selectedSchedule
                      ? `${selectedSchedule.routeNumber}｜${formatDepartureTime(selectedSchedule.departureTime)}`
                      : "請先選擇班次"}
                  </p>
                </button>
                <button
                  type="button"
                  aria-pressed={exportScope === "DAY"}
                  onClick={() => setExportScope("DAY")}
                  className={`rounded-adminControl border p-4 text-left transition ${
                    exportScope === "DAY"
                      ? "border-adminStatus-enabled bg-adminStatus-enabled/10 ring-2 ring-adminStatus-enabled/20"
                      : "border-admin-borderStrong bg-admin-bg/50 hover:border-adminStatus-enabled/70 hover:bg-admin-elevated/60"
                  }`}
                >
                  <p className="font-bold text-admin-text">當日</p>
                  <p className="mt-1 text-base leading-6 text-admin-muted">
                    {openDate} 的所有符合班次
                  </p>
                </button>
              </div>
            </fieldset>

            {exportScope === "DAY" && (
              <label className="grid gap-2 text-base font-bold text-admin-softText">
                選擇路線
                <select
                  value={exportRouteId}
                  onChange={(event) => setExportRouteId(event.target.value)}
                  className="h-11 rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-lg font-semibold text-admin-text outline-none focus:border-adminStatus-enabled focus:ring-4 focus:ring-adminStatus-enabled/20"
                >
                  <option value="ALL">全部路線</option>
                  {routeOptions.map((route) => (
                    <option key={route.routeId} value={route.routeId}>
                      {route.routeNumber}｜{route.routeName}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="flex items-center gap-3 rounded-adminControl border border-admin-borderStrong bg-admin-bg/50 p-4 text-base font-bold text-admin-softText">
              <input
                type="checkbox"
                checked={includeCancelledForExport}
                onChange={(event) =>
                  setIncludeCancelledForExport(event.target.checked)
                }
                className="h-4 w-4 accent-adminStatus-enabled"
              />
              預約規則：含取消
            </label>
          </div>

          <DialogFooter className="border-t border-admin-border pt-5">
            <button
              type="button"
              onClick={() => setIsExportDialogOpen(false)}
              disabled={isExporting}
              className="h-10 rounded-adminControl border border-admin-borderStrong px-4 text-base font-bold text-admin-softText transition hover:bg-admin-elevated disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={
                isExporting || (exportScope === "SELECTED" && !selectedSchedule)
              }
              className="h-10 rounded-adminControl bg-adminStatus-enabled px-5 text-base font-bold text-admin-bg transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExporting ? "匯出中…" : "匯出"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isCancelModalOpen && selectedSchedule && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-schedule-title"
        >
          <section className="w-full max-w-xl rounded-adminPanel border border-admin-borderStrong bg-admin-surface p-5 shadow-adminPanel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  className="text-xl font-bold text-admin-text"
                  id="cancel-schedule-title"
                >
                  取消班次確認
                </h2>
              </div>
              <button
                aria-label="關閉"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-admin-borderStrong text-xl font-semibold leading-none text-admin-softText transition hover:border-adminStatus-enabled hover:text-adminStatus-enabled"
                disabled={isCancellingSchedule}
                type="button"
                onClick={closeCancelScheduleModal}
              >
                ×
              </button>
            </div>

            <div className="mt-4 rounded-adminControl border border-red-400/30 bg-red-400/10 px-4 py-3 text-base leading-6 text-red-200">
              <p className="font-bold">
                {" "}
                取消後此班次將停用，已預約乘客的預約會被取消，系統也會通知所有預約乘客。請確認原因與通知內容後再送出。
              </p>
              <p className="mt-1">
                班次 : {formatDepartureTime(selectedSchedule.departureTime)}{" "}
                {getScheduleName(selectedSchedule)}{" "}
              </p>
            </div>

            <label className="mt-5 block text-sm font-medium text-admin-softText">
              乘客通知文字
              <textarea
                className="mt-2 min-h-32 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 py-2 text-admin-text outline-none focus:border-adminStatus-enabled focus:ring-4 focus:ring-adminStatus-enabled/15"
                value={cancelNotificationText}
                onChange={(event) =>
                  setCancelNotificationText(event.target.value)
                }
              />
            </label>

            {cancelScheduleError && (
              <p className="mt-4 rounded-adminControl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                {cancelScheduleError}
              </p>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                className="h-11 rounded-adminControl border border-admin-borderStrong px-5 text-sm font-semibold text-admin-softText disabled:opacity-60"
                disabled={isCancellingSchedule}
                type="button"
                onClick={closeCancelScheduleModal}
              >
                返回
              </button>
              <button
                className="h-11 rounded-adminControl bg-red-500 px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isCancellingSchedule}
                type="button"
                onClick={submitCancelSchedule}
              >
                {isCancellingSchedule ? "送出中…" : "送出並取消班次"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
