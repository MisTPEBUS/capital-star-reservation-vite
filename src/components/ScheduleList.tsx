import type { OpenSchedule } from "../types/reservation";
import { SectionTitle } from "./SectionTitle";

interface ScheduleListProps {
  schedules: OpenSchedule[];
  onReserve: (schedule: OpenSchedule) => void;
}

export function ScheduleList({ schedules, onReserve }: ScheduleListProps) {
  return (
    <section className="rounded-panel bg-white p-4 shadow-card ring-1 ring-bus-100/80 md:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <SectionTitle
          eyebrow="Section 3"
          title="班次清單"
          description="列表會依照上車地點、日期、時段篩選。"
        />

        <div className="shrink-0 rounded-2xl bg-bus-50 px-3 py-2 text-right ring-1 ring-bus-100">
          <p className="text-[11px] font-bold text-ink-500">可選</p>
          <p className="text-xl font-black leading-none text-bus-700">
            {schedules.length}
          </p>
        </div>
      </div>

      {schedules.length === 0 ? (
        <div className="rounded-card bg-ink-50 p-6 text-center ring-1 ring-ink-100">
          <p className="text-base font-black text-ink-800">
            目前沒有符合條件的班次
          </p>
          <p className="mt-2 text-sm text-ink-500">
            請切換日期、上車地點或時段。
          </p>
        </div>
      ) : (
        <div className="grid gap-2.5">
          {schedules.map((schedule) => {
            const isFull = schedule.availableSeats <= 0;
            const isReserved = schedule.userReservation === "RESERVED";
            const disabled = isFull || isReserved;

            return (
              <article
                key={schedule.dailyOpenScheduleId}
                className="overflow-hidden rounded-card border border-bus-100 bg-white shadow-sm ring-1 ring-bus-50"
              >
                {/* Row 1：時間、班次、剩餘人數 */}
                <div className="grid grid-cols-[1fr_auto] items-center gap-3 p-3.5">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <p className="shrink-0 font-mono text-3xl font-black leading-none tracking-tight text-ink-900">
                        {schedule.departureTime}
                      </p>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-black leading-5 text-ink-800">
                          {schedule.scheduleCode}
                        </p>
                        <p className="text-xs font-bold text-ink-400">
                          出發班次
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 rounded-2xl bg-bus-50 px-3 py-2 text-right ring-1 ring-bus-100">
                    <p className="text-[11px] font-bold leading-none text-ink-500">
                      剩餘
                    </p>
                    <p
                      className={`mt-1 text-2xl font-black leading-none ${
                        isFull ? "text-coral" : "text-bus-700"
                      }`}
                    >
                      {schedule.availableSeats}
                      <span className="ml-0.5 text-xs font-bold text-ink-500">
                        人
                      </span>
                    </p>
                  </div>
                </div>

                {/* Row 2：狀態、備註、按鈕 */}
                <div className="grid grid-cols-[1fr_96px] items-center gap-3 border-t border-bus-100 bg-gradient-to-r from-bus-50/80 to-white p-3.5">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="shrink-0 rounded-full bg-star-300 px-2.5 py-1 text-[11px] font-black text-bus-900">
                        截止 {schedule.bookingDeadline}
                      </span>

                      {isReserved ? (
                        <span className="shrink-0 rounded-full bg-ink-900 px-2.5 py-1 text-[11px] font-black text-white">
                          已預約
                        </span>
                      ) : isFull ? (
                        <span className="shrink-0 rounded-full bg-coral/10 px-2.5 py-1 text-[11px] font-black text-coral">
                          已滿
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-bus-600 px-2.5 py-1 text-[11px] font-black text-white">
                          可預約
                        </span>
                      )}
                    </div>

                    <p className="mt-1 truncate text-xs font-bold leading-5 text-ink-500">
                      {schedule.note}｜總量 {schedule.quota}・已約{" "}
                      {schedule.reservedCount}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onReserve(schedule)}
                    className={`h-11 rounded-2xl text-sm font-black outline-none transition focus-visible:ring-4 focus-visible:ring-bus-100 ${
                      disabled
                        ? "cursor-not-allowed bg-ink-100 text-ink-400"
                        : "bg-bus-900 text-white shadow-sm hover:bg-bus-700 active:scale-[0.98]"
                    }`}
                  >
                    {isReserved ? "已預約" : isFull ? "已滿" : "預約"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
