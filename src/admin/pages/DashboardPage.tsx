import { useEffect, useMemo, useState } from "react";
import { FaCaretLeft, FaCaretRight } from "react-icons/fa";
import {
  type DashboardDailyOpenSchedule,
  type DashboardReservation,
  getDashboardDailyOpenSchedules,
  getDashboardScheduleReservations,
} from "../../api/admin/dashboard";
import { cancelDailyOpenSchedule } from "../../api/admin/schedules";
import { DataTable } from "../components/DataTable";

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
  if (status === "INACTIVE") return "停用";
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
    (sum, schedule) => sum + schedule.reservedCount,
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
  }, [selectedScheduleId]);

  const downloadReservationExcel = async () => {
    if (!selectedSchedule) return;

    const { default: ExcelJS } = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("預約清單");

    worksheet.columns = [
      { header: "班次", key: "scheduleName", width: 28 },
      { header: "發車時間", key: "departureTime", width: 12 },
      { header: "乘車序號", key: "sequence", width: 12 },
      { header: "稱謂", key: "name", width: 14 },
      { header: "LINE 名稱", key: "lineDisplayName", width: 18 },
      { header: "識別碼", key: "activeCode", width: 16 },
      { header: "上車站", key: "pickupStopName", width: 14 },
      { header: "預約時間", key: "bookedAt", width: 22 },
      { header: "狀態", key: "status", width: 12 },
    ];

    reservationRows.forEach((reservation) => {
      worksheet.addRow({
        scheduleName: getScheduleName(selectedSchedule),
        departureTime: reservation.departureTime,
        sequence: reservation.sequence,
        name: reservation.name,
        lineDisplayName: reservation.lineDisplayName,
        activeCode: reservation.activeCode,
        pickupStopName: reservation.pickupStopName,
        bookedAt: reservation.bookedAt,
        status: reservation.status === "RESERVED" ? "已預約" : "已取消",
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
          horizontal: columnNumber === 3 ? "center" : "left",
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
    link.download = `${selectedSchedule.routeNumber}-${selectedSchedule.openDate}-${formatDepartureTime(selectedSchedule.departureTime).replace(":", "")}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
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
    <div className="flex min-h-[calc(100vh-4.5rem)] flex-col space-y-4">
      <section className=" gap-3 sm:grid-cols-3 hidden">
        <div className="admin-stat-card">
          <p className="admin-stat-label">當日開放班次</p>
          <p className="admin-stat-value">{schedules.length}</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-label">已預約人數</p>
          <p className="admin-stat-value">{totalReservedCount}</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-label">剩餘名額</p>
          <p className="admin-stat-value">{totalAvailableSeats}</p>
        </div>
      </section>

      {schedulesError ? (
        <p className="rounded-adminControl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {schedulesError}
        </p>
      ) : (
        <section className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className="admin-panel-body flex min-h-0 flex-col">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-admin-text">
                  班次
                </h3>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-auto pr-1">
              {isSchedulesLoading ? (
                <p className="px-3 py-6 text-center text-sm text-admin-muted">
                  讀取班次中…
                </p>
              ) : filteredSchedules.length === 0 ? (
                <div className="rounded-adminControl border border-dashed border-admin-borderStrong bg-admin-bg px-4 py-8 text-center text-sm text-admin-muted">
                  此日期沒有符合路線的開放預約班次。
                </div>
              ) : (
                filteredSchedules.map((schedule) => {
                  const isSelected =
                    schedule.dailyOpenScheduleId === selectedScheduleId;
                  const isInactive = schedule.status === "INACTIVE";

                  return (
                    <button
                      key={schedule.dailyOpenScheduleId}
                      aria-pressed={isSelected}
                      className={`w-full rounded-adminControl border px-3 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-adminStatus-enabled ${
                        isSelected && isInactive
                          ? "border-red-400/60 bg-red-400/10"
                          : isSelected
                            ? "border-adminStatus-enabled bg-adminStatus-enabled/10"
                            : isInactive
                              ? "border-admin-borderStrong bg-admin-bg/70 opacity-80 hover:border-red-400/40"
                              : "border-admin-border bg-admin-elevated hover:border-admin-borderStrong"
                      }`}
                      type="button"
                      onClick={() =>
                        setSelectedScheduleId(schedule.dailyOpenScheduleId)
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p
                            className={`text-2xl font-bold leading-none ${
                              isInactive
                                ? "text-admin-muted"
                                : "text-admin-text"
                            }`}
                          >
                            {formatDepartureTime(schedule.departureTime)}
                          </p>
                          <p
                            className={`mt-2 truncate text-sm font-semibold ${
                              isInactive
                                ? "text-admin-muted"
                                : "text-admin-softText"
                            }`}
                          >
                            {schedule.routeNumber}｜{schedule.routeName}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${
                            schedule.status === "ACTIVE"
                              ? "bg-adminStatus-enabled/10 text-adminStatus-enabled"
                              : "bg-red-400/10 text-red-300 ring-1 ring-red-400/25"
                          }`}
                        >
                          {getStatusText(schedule.status)}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-admin-muted">已預約</p>
                          <p className="mt-1 font-bold text-admin-text">
                            {schedule.reservedCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-admin-muted">剩餘</p>
                          <p className="mt-1 font-bold text-admin-text">
                            {schedule.availableSeats}
                          </p>
                        </div>
                        <div>
                          <p className="text-admin-muted">名額</p>
                          <p className="mt-1 font-bold text-admin-text">
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
            <section className="mb-4 max-w-full rounded-adminControl border border-admin-border bg-admin-surface p-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="grid h-11 w-[260px] max-w-full shrink-0 grid-cols-[44px_minmax(0,1fr)_44px] items-center overflow-hidden rounded-adminControl border border-admin-borderStrong bg-admin-bg">
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
                      className="h-full w-full bg-admin-bg px-3 text-center text-sm font-bold text-admin-text outline-none focus:ring-2 focus:ring-inset focus:ring-adminStatus-enabled"
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
                  className={`h-11 rounded-adminControl border px-4 text-sm font-semibold ${
                    openDate === todayValue
                      ? "border-adminStatus-enabled bg-adminStatus-enabled/10 text-adminStatus-enabled"
                      : "border-admin-borderStrong text-admin-softText"
                  }`}
                  type="button"
                  onClick={() => setOpenDate(todayValue)}
                >
                  今日
                </button>
                <label className="min-w-[190px] text-sm font-medium text-admin-softText">
                  <span className="sr-only">路線篩選</span>
                  <select
                    aria-label="路線篩選"
                    className="h-11 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-sm font-semibold text-admin-text outline-none focus:border-adminStatus-enabled"
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
              </div>
            </section>

            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="admin-section-title">
                  {selectedSchedule
                    ? `${formatDepartureTime(selectedSchedule.departureTime)} 預約乘客清單`
                    : "預約乘客清單"}
                </h2>
                {selectedSchedule && (
                  <p className="mt-1 text-sm text-admin-muted">
                    {getScheduleName(selectedSchedule)}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-admin-muted">
                  已預約 {selectedSchedule?.reservedCount ?? 0} 人
                </span>
                <label className="flex h-10 items-center gap-2 rounded-adminControl border border-admin-borderStrong px-3 text-sm font-semibold text-admin-softText">
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
                  className="h-10 rounded-adminControl bg-adminStatus-enabled px-4 text-sm font-bold text-admin-bg transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!selectedSchedule || reservationRows.length === 0}
                  type="button"
                  onClick={downloadReservationExcel}
                >
                  下載 Excel
                </button>
                <button
                  className="h-10 rounded-adminControl border border-red-400/50 bg-red-500/10 px-4 text-sm font-bold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
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
            </div>

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
                <DataTable reservations={reservationRows} />
              )}
            </div>
          </section>
        </section>
      )}

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
