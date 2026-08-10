import { Check } from "lucide-react";
import type { DashboardDailyOpenSchedule } from "../../api/admin/dashboard";
import type { ParsedReservationText } from "../../api/admin/reservationTextParser";

interface QuickReservationFormProps {
  parsed: ParsedReservationText;
  schedules: DashboardDailyOpenSchedule[];
  selectedScheduleId: string;
  isLoadingSchedules: boolean;
  onParsedChange: (value: ParsedReservationText) => void;
  onScheduleSelect: (scheduleId: string) => void;
}

function hasScheduleDeparted(schedule: DashboardDailyOpenSchedule) {
  const departureAt = new Date(
    `${schedule.openDate}T${schedule.departureTime.slice(0, 5)}:00`,
  );
  return !Number.isNaN(departureAt.getTime()) && departureAt <= new Date();
}

export function isScheduleAvailable(
  schedule: DashboardDailyOpenSchedule,
  passengerCount: number,
) {
  return (
    schedule.status !== "INACTIVE" &&
    !hasScheduleDeparted(schedule) &&
    schedule.availableSeats >= passengerCount
  );
}

export function QuickReservationForm({
  parsed,
  schedules,
  selectedScheduleId,
  isLoadingSchedules,
  onParsedChange,
  onScheduleSelect,
}: QuickReservationFormProps) {
  const requestedTime = parsed.time.slice(0, 5);

  return (
    <section
      aria-labelledby="parsed-reservation-title"
      className="rounded-adminPanel border border-admin-borderStrong bg-admin-surface p-4 shadow-sm sm:p-5"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-adminStatus-enabled text-sm font-black text-admin-bg">
            2
          </span>
          <div>
            <h3
              className="text-lg font-bold text-admin-text"
              id="parsed-reservation-title"
            >
              確認預約資料
            </h3>
            <p className="mt-0.5 text-sm text-admin-muted">
              系統辨識時間：{requestedTime}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-adminStatus-enabled/15 px-2.5 py-1 text-xs font-bold text-adminStatus-enabled">
          可修改
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-bold text-admin-softText">
          姓名
          <input
            autoComplete="name"
            className="mt-1.5 h-12 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-base text-admin-text outline-none focus:border-adminStatus-enabled"
            id="quick-reservation-name"
            name="quick-reservation-name"
            value={parsed.name}
            onChange={(event) =>
              onParsedChange({ ...parsed, name: event.target.value })
            }
          />
        </label>

        <label className="block text-sm font-bold text-admin-softText">
          電話
          <input
            autoComplete="tel"
            className="mt-1.5 h-12 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-base text-admin-text outline-none focus:border-adminStatus-enabled"
            id="quick-reservation-phone"
            inputMode="tel"
            name="quick-reservation-phone"
            value={parsed.phone}
            onChange={(event) =>
              onParsedChange({ ...parsed, phone: event.target.value })
            }
          />
        </label>

        <label className="block text-sm font-bold text-admin-softText">
          人數
          <input
            className="mt-1.5 h-12 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-base text-admin-text outline-none focus:border-adminStatus-enabled"
            id="quick-reservation-passenger-count"
            min="1"
            name="quick-reservation-passenger-count"
            type="number"
            value={parsed.passengerCount}
            onChange={(event) =>
              onParsedChange({
                ...parsed,
                passengerCount: Number(event.target.value),
              })
            }
          />
        </label>
      </div>

      {isLoadingSchedules && (
        <p className="mt-5 rounded-adminControl border border-admin-border bg-admin-bg px-4 py-5 text-center text-sm text-admin-muted">
          讀取今日班次中…
        </p>
      )}

      {!isLoadingSchedules && schedules.length > 0 && (
        <fieldset className="mt-5 border-t border-admin-border pt-5">
          <legend className="text-sm font-bold text-admin-softText">
            選擇今日班次
          </legend>
          <p className="mt-1 text-xs text-admin-muted">
            已優先配對 {requestedTime}，也可以直接改選其他可用班次。
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {schedules.map((schedule) => {
              const isSelected =
                schedule.dailyOpenScheduleId === selectedScheduleId;
              const isAvailable = isScheduleAvailable(
                schedule,
                parsed.passengerCount,
              );

              return (
                <label
                  key={schedule.dailyOpenScheduleId}
                  className={`relative rounded-adminControl border p-3 transition ${
                    isAvailable
                      ? "cursor-pointer border-admin-borderStrong bg-admin-bg hover:border-adminStatus-enabled/70 hover:bg-admin-elevated/40"
                      : "cursor-not-allowed border-admin-border bg-admin-bg/40 opacity-45"
                  } ${
                    isSelected
                      ? "border-adminStatus-enabled bg-adminStatus-enabled/15 ring-2 ring-adminStatus-enabled/25"
                      : ""
                  }`}
                >
                  <input
                    className="sr-only"
                    checked={isSelected}
                    disabled={!isAvailable}
                    name="quick-reservation-schedule"
                    type="radio"
                    value={schedule.dailyOpenScheduleId}
                    onChange={() =>
                      onScheduleSelect(schedule.dailyOpenScheduleId)
                    }
                  />
                  {isSelected && (
                    <Check
                      aria-hidden="true"
                      className="absolute right-2 top-2 h-4 w-4 text-adminStatus-enabled"
                    />
                  )}
                  <p className="font-mono text-lg font-black text-admin-text">
                    {schedule.departureTime.slice(0, 5)}
                  </p>
                  <p
                    className={`mt-1 text-sm font-bold ${
                      isAvailable
                        ? "text-adminStatus-enabled"
                        : "text-red-300"
                    }`}
                  >
                    {schedule.status === "INACTIVE"
                      ? "已停班"
                      : hasScheduleDeparted(schedule)
                        ? "已發車"
                        : `剩 ${schedule.availableSeats} 人`}
                  </p>
                  <p className="mt-1 truncate text-xs text-admin-muted">
                    路線 {schedule.routeNumber}
                  </p>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {!isLoadingSchedules && schedules.length === 0 && (
        <p className="mt-4 rounded-adminControl border border-dashed border-admin-borderStrong px-4 py-4 text-center text-sm text-admin-muted">
          今日沒有已建立的班次。
        </p>
      )}
    </section>
  );
}
