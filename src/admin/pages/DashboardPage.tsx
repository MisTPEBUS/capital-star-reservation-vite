import { useMemo, useState } from "react";
import { DataTable } from "../components/DataTable";
import { dashboardSchedules } from "../data/dashboard";

export function DashboardPage() {
  const [selectedScheduleId, setSelectedScheduleId] = useState(
    dashboardSchedules[0].dailyOpenScheduleId,
  );

  const selectedSchedule = useMemo(
    () =>
      dashboardSchedules.find(
        (schedule) => schedule.dailyOpenScheduleId === selectedScheduleId,
      ) ?? dashboardSchedules[0],
    [selectedScheduleId],
  );

  const reservationRows = selectedSchedule.reservations.map((reservation) => ({
    ...reservation,
    departureTime: selectedSchedule.departureTime,
  }));

  const downloadReservationExcel = async () => {
    const { default: ExcelJS } = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("預約清單");

    worksheet.columns = [
      { header: "班次", key: "scheduleName", width: 20 },
      { header: "發車時間", key: "departureTime", width: 12 },
      { header: "乘車序號", key: "sequence", width: 12 },
      { header: "LINE 暱稱", key: "lineDisplayName", width: 18 },
      { header: "活動碼", key: "activeCode", width: 16 },
      { header: "電話", key: "phone", width: 16 },
      { header: "上車站", key: "pickupStopName", width: 14 },
      { header: "預約時間", key: "bookedAt", width: 20 },
      { header: "狀態", key: "status", width: 12 },
    ];

    reservationRows.forEach((reservation) => {
      worksheet.addRow({
        scheduleName: selectedSchedule.scheduleName,
        departureTime: reservation.departureTime,
        sequence: reservation.sequence,
        lineDisplayName: reservation.lineDisplayName,
        activeCode: reservation.activeCode,
        phone: reservation.phone,
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
    const routeNumber = selectedSchedule.scheduleName.split("-")[0];

    link.href = url;
    link.download = `${routeNumber}-${selectedSchedule.openDate}-${selectedSchedule.departureTime.replace(":", "")}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <section>
        <p className="admin-page-kicker">DASHBOARD</p>
        <h1 className="admin-page-title">今日預約概況</h1>
        <p className="admin-page-description">
          選取班次以查看該時段的預約清單。
        </p>
      </section>

      <section className="">
        {/*  <div>
          <h2 className="admin-section-title">班次預約狀況</h2>
          <p className="mt-1 text-sm text-admin-muted">依發車時段與上車站彙整目前預約人數。</p>
        </div> */}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardSchedules.map((schedule) => {
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
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-4xl font-bold leading-none text-admin-text">
                    {schedule.departureTime}
                    </p>
                    <p className="mt-2 text-xs font-semibold tracking-wide text-admin-muted">
                      {schedule.scheduleName}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-adminStatus-enabled">
                    共 {schedule.reservedCount} 人
                  </span>
                </div>
                <div className="mt-4 space-y-2 border-t border-admin-border pt-4">
                  {schedule.pickupStopSummaries.map((summary) => (
                    <div
                      key={summary.pickupStopName}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="font-medium text-admin-softText">
                        {summary.pickupStopName}
                      </span>
                      <span className="text-admin-muted">
                        預約人數{" "}
                        <strong className="font-semibold text-admin-text">
                          {summary.reservedCount}
                        </strong>{" "}
                        人
                      </span>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="admin-panel-body">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="admin-section-title">
              {selectedSchedule.departureTime} 預約清單
            </h2>
          </div>
          <button
            className="h-10 rounded-adminControl bg-adminStatus-enabled px-4 text-sm font-bold text-admin-bg transition hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-adminStatus-enabled"
            type="button"
            onClick={downloadReservationExcel}
          >
            下載 Excel
          </button>
          <span className="text-sm text-admin-muted">
            已預約 {selectedSchedule.reservedCount} 人
          </span>
        </div>
        <div className="mt-4">
          <DataTable reservations={reservationRows} />
        </div>
      </section>
    </div>
  );
}
