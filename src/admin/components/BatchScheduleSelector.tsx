import { FaCheck } from "react-icons/fa";
import type { DashboardDailyOpenSchedule } from "../../api/admin/dashboard";

interface BatchScheduleSelectorProps {
  schedules: DashboardDailyOpenSchedule[];
  selectedScheduleIds: string[];
  onToggle: (schedule: DashboardDailyOpenSchedule) => void;
  canSelect: (schedule: DashboardDailyOpenSchedule) => boolean;
}

export function BatchScheduleSelector({
  schedules,
  selectedScheduleIds,
  onToggle,
  canSelect,
}: BatchScheduleSelectorProps) {
  return (
    <section
      aria-labelledby="batch-schedule-selector-title"
      className="rounded-adminControl border border-red-400/30 bg-red-400/5 p-4 xl:hidden"
    >
      <div className="mb-3">
        <h2
          className="text-base font-bold text-admin-text"
          id="batch-schedule-selector-title"
        >
          選擇要停班的班次
        </h2>
        <p className="mt-1 text-sm text-admin-muted">
          點選班次可加入或移除，灰色班次無法操作。
        </p>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {schedules.map((schedule) => {
          const isSelected = selectedScheduleIds.includes(
            schedule.dailyOpenScheduleId,
          );
          const isSelectable = canSelect(schedule);

          return (
            <button
              key={schedule.dailyOpenScheduleId}
              aria-pressed={isSelected}
              className={`relative min-w-[11rem] rounded-adminControl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 ${
                isSelected
                  ? "border-red-300 bg-red-500/15"
                  : "border-admin-borderStrong bg-admin-bg"
              } ${!isSelectable ? "cursor-not-allowed opacity-40" : ""}`}
              disabled={!isSelectable}
              type="button"
              onClick={() => onToggle(schedule)}
            >
              <span
                className={`absolute right-2.5 top-2.5 grid h-6 w-6 place-items-center rounded-full border ${
                  isSelected
                    ? "border-red-300 bg-red-500 text-white"
                    : "border-admin-borderStrong text-transparent"
                }`}
              >
                <FaCheck aria-hidden="true" className="text-xs" />
              </span>
              <p className="pr-8 text-xl font-bold tabular-nums text-admin-text">
                {schedule.departureTime.slice(0, 5)}
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-admin-softText">
                {schedule.routeNumber}｜{schedule.routeName}
              </p>
              <p className="mt-2 text-xs text-admin-muted">
                預約{" "}
                {schedule.reservedPassengerCount ?? schedule.reservedCount} 人
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
