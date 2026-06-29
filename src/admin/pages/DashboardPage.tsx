import { useEffect, useMemo, useState } from "react";
import {
  type DashboardDailyOpenSchedule,
  type DashboardReservation,
  getDashboardDailyOpenSchedules,
  getDashboardScheduleReservations,
} from "../../api/admin/dashboard";
import { DataTable } from "../components/DataTable";

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

function getDateLabel(value: string) {
  const date = getDateFromValue(value);
  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).format(date);
}

function openInputPicker(event: React.MouseEvent<HTMLInputElement>) {
  event.currentTarget.showPicker?.();
}

function formatDepartureTime(value: string) {
  return value.slice(0, 5);
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
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [reservations, setReservations] = useState<DashboardReservation[]>([]);
  const [isSchedulesLoading, setIsSchedulesLoading] = useState(false);
  const [isReservationsLoading, setIsReservationsLoading] = useState(false);
  const [schedulesError, setSchedulesError] = useState("");
  const [reservationsError, setReservationsError] = useState("");
  const todayValue = getTodayValue();
  const tomorrowValue = formatDateValue(addDays(new Date(), 1));

  const selectedSchedule = useMemo(
    () =>
      schedules.find(
        (schedule) => schedule.dailyOpenScheduleId === selectedScheduleId,
      ) ?? null,
    [schedules, selectedScheduleId],
  );

  const reservationRows = useMemo(
    () =>
      reservations.map((reservation) => ({
        ...reservation,
        departureTime: selectedSchedule
          ? formatDepartureTime(selectedSchedule.departureTime)
          : "",
      })),
    [reservations, selectedSchedule],
  );

  const totalReservedCount = schedules.reduce(
    (sum, schedule) => sum + schedule.reservedCount,
    0,
  );
  const totalAvailableSeats = schedules.reduce(
    (sum, schedule) => sum + schedule.availableSeats,
    0,
  );

  const loadDailyOpenSchedules = async () => {
    try {
      setIsSchedulesLoading(true);
      setSchedulesError("");
      setReservations([]);

      const result = await getDashboardDailyOpenSchedules(openDate);
      const sortedSchedules = [...result].sort((a, b) =>
        a.departureTime.localeCompare(b.departureTime),
      );

      setSchedules(sortedSchedules);
      setSelectedScheduleId((current) => {
        if (
          current &&
          sortedSchedules.some((schedule) => schedule.dailyOpenScheduleId === current)
        ) {
          return current;
        }

        return sortedSchedules[0]?.dailyOpenScheduleId ?? null;
      });
    } catch (error) {
      setSchedules([]);
      setSelectedScheduleId(null);
      setSchedulesError(
        error instanceof Error ? error.message : "讀取當日開放班次失敗。",
      );
    } finally {
      setIsSchedulesLoading(false);
    }
  };

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
    let isCurrent = true;

    async function loadReservations() {
      if (!selectedScheduleId) {
        setReservations([]);
        return;
      }

      try {
        setIsReservationsLoading(true);
        setReservationsError("");

        const result = await getDashboardScheduleReservations(selectedScheduleId);
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
      { header: "LINE 暱稱", key: "lineDisplayName", width: 18 },
      { header: "活動碼", key: "activeCode", width: 16 },
      { header: "電話", key: "phone", width: 16 },
      { header: "上車站", key: "pickupStopName", width: 14 },
      { header: "預約時間", key: "bookedAt", width: 22 },
      { header: "取消時間", key: "cancelledAt", width: 22 },
      { header: "狀態", key: "status", width: 12 },
    ];

    reservationRows.forEach((reservation) => {
      worksheet.addRow({
        scheduleName: getScheduleName(selectedSchedule),
        departureTime: reservation.departureTime,
        sequence: reservation.sequence,
        lineDisplayName: reservation.lineDisplayName,
        activeCode: reservation.activeCode,
        phone: reservation.phone,
        pickupStopName: reservation.pickupStopName,
        bookedAt: reservation.bookedAt,
        cancelledAt: reservation.cancelledAt,
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

  const shiftOpenDate = (days: number) => {
    setOpenDate((current) => formatDateValue(addDays(getDateFromValue(current), days)));
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="admin-page-kicker">DASHBOARD</p>
          <h1 className="admin-page-title">今日預約概況</h1>
          <p className="admin-page-description">
            選擇日期查看當日開放預約班次，點選班次後查詢乘客預約清單。
          </p>
        </div>

        <div className="rounded-adminControl border border-admin-border bg-admin-surface p-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm font-medium text-admin-softText">
              查詢日期
              <input
                className="mt-2 h-11 rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-admin-text outline-none focus:border-adminStatus-enabled"
                type="date"
                value={openDate}
                onClick={openInputPicker}
                onChange={(event) => setOpenDate(event.target.value)}
              />
            </label>
            <div className="flex h-11 items-center rounded-adminControl border border-admin-borderStrong bg-admin-bg text-sm font-bold text-admin-text">
              <button
                className="h-full px-3 text-admin-softText hover:text-adminStatus-enabled"
                type="button"
                onClick={() => shiftOpenDate(-1)}
              >
                前一天
              </button>
              <span className="border-x border-admin-borderStrong px-3">
                {getDateLabel(openDate)}
              </span>
              <button
                className="h-full px-3 text-admin-softText hover:text-adminStatus-enabled"
                type="button"
                onClick={() => shiftOpenDate(1)}
              >
                後一天
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
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
              <button
                className={`h-11 rounded-adminControl border px-4 text-sm font-semibold ${
                  openDate === tomorrowValue
                    ? "border-adminStatus-enabled bg-adminStatus-enabled/10 text-adminStatus-enabled"
                    : "border-admin-borderStrong text-admin-softText"
                }`}
                type="button"
                onClick={() => setOpenDate(tomorrowValue)}
              >
                明日
              </button>
            </div>
          <button
            className="h-11 rounded-adminControl border border-admin-borderStrong px-4 text-sm font-semibold text-admin-softText"
            type="button"
            onClick={loadDailyOpenSchedules}
          >
            重新整理
          </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
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

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="admin-section-title">當日開放預約班次</h2>
            <p className="mt-1 text-sm text-admin-muted">{openDate}</p>
          </div>
          {isSchedulesLoading && (
            <span className="text-sm font-semibold text-admin-muted">讀取中…</span>
          )}
        </div>

        {schedulesError ? (
          <p className="rounded-adminControl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {schedulesError}
          </p>
        ) : schedules.length === 0 && !isSchedulesLoading ? (
          <div className="rounded-adminPanel border border-dashed border-admin-borderStrong bg-admin-surface px-5 py-10 text-center text-sm text-admin-muted">
            此日期沒有開放預約班次。
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {schedules.map((schedule) => {
              const isSelected =
                schedule.dailyOpenScheduleId === selectedScheduleId;

              return (
                <button
                  key={schedule.dailyOpenScheduleId}
                  aria-pressed={isSelected}
                  className={`rounded-adminCard border p-5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-adminStatus-enabled ${
                    isSelected
                      ? "border-adminStatus-enabled bg-adminStatus-enabled/10 ring-1 ring-adminStatus-enabled/30"
                      : "border-admin-border bg-admin-elevated hover:border-admin-borderStrong"
                  }`}
                  type="button"
                  onClick={() =>
                    setSelectedScheduleId(schedule.dailyOpenScheduleId)
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-4xl font-bold leading-none text-admin-text">
                        {formatDepartureTime(schedule.departureTime)}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-admin-softText">
                        {schedule.routeNumber}｜{schedule.routeName}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-bold ${
                        schedule.status === "ACTIVE"
                          ? "bg-adminStatus-enabled/10 text-adminStatus-enabled"
                          : "bg-admin-bg text-admin-muted"
                      }`}
                    >
                      {getStatusText(schedule.status)}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-admin-border pt-4 text-sm">
                    <div>
                      <p className="text-admin-muted">名額</p>
                      <p className="font-bold text-admin-text">{schedule.quota}</p>
                    </div>
                    <div>
                      <p className="text-admin-muted">已預約</p>
                      <p className="font-bold text-admin-text">{schedule.reservedCount}</p>
                    </div>
                    <div>
                      <p className="text-admin-muted">已取消</p>
                      <p className="font-bold text-admin-text">{schedule.cancelledCount}</p>
                    </div>
                    <div>
                      <p className="text-admin-muted">剩餘</p>
                      <p className="font-bold text-admin-text">{schedule.availableSeats}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="admin-panel-body">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="admin-section-title">
              {selectedSchedule
                ? `${formatDepartureTime(selectedSchedule.departureTime)} 預約清單`
                : "預約清單"}
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
            <button
              className="h-10 rounded-adminControl bg-adminStatus-enabled px-4 text-sm font-bold text-admin-bg transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!selectedSchedule || reservationRows.length === 0}
              type="button"
              onClick={downloadReservationExcel}
            >
              下載 Excel
            </button>
          </div>
        </div>

        {reservationsError && (
          <p className="mt-4 rounded-adminControl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {reservationsError}
          </p>
        )}

        <div className="mt-4">
          {isReservationsLoading ? (
            <div className="rounded-adminControl border border-admin-border px-4 py-10 text-center text-sm text-admin-muted">
              讀取預約清單中…
            </div>
          ) : (
            <DataTable reservations={reservationRows} />
          )}
        </div>
      </section>
    </div>
  );
}
