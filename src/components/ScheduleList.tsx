import type { OpenSchedule } from "../types/reservation";
import { SectionTitle } from "./SectionTitle";

interface ScheduleListProps {
  schedules: OpenSchedule[];
  isLoading?: boolean;
  errorMessage?: string;
  reservationErrorMessage?: string;
  canReserve?: boolean;
  unavailableReason?: "ACTIVE_RESERVATION" | "UNOPENED";
  reservingScheduleId?: string | null;
  onRetry?: () => void;
  onReserve: (schedule: OpenSchedule) => void;
}

const parseLocalDateTime = (dateValue: string, timeValue: string) => {
  if (!dateValue || !timeValue) return null;

  const dateMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const timeMatch = timeValue.match(/^(\d{1,2}):(\d{2})/);

  if (!dateMatch || !timeMatch) return null;

  return new Date(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]),
    Number(timeMatch[1]),
    Number(timeMatch[2]),
  );
};

const getDeadlineDate = (schedule: OpenSchedule) => {
  if (!schedule.bookingDeadline) return null;

  const explicitDate = new Date(schedule.bookingDeadline);
  if (!Number.isNaN(explicitDate.getTime())) return explicitDate;

  return parseLocalDateTime(schedule.openDate, schedule.bookingDeadline);
};

const getDeadlineBadge = (schedule: OpenSchedule) => {
  const deadline = getDeadlineDate(schedule);
  const timeLabel = deadline
    ? new Intl.DateTimeFormat("zh-TW", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(deadline)
    : schedule.bookingDeadline?.slice(0, 5) || "";

  if (!deadline) {
    return {
      text: timeLabel ? `截止 ${timeLabel}` : "截止時間未提供",
      className: timeLabel ? "bg-star-300 text-bus-900" : "bg-ink-200 text-ink-600",
    };
  }

  if (deadline.getTime() < Date.now()) {
    return {
      text: "已截止",
      className: "bg-ink-200 text-ink-600",
    };
  }

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const dateKey = (date: Date) =>
    `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  const deadlineKey = dateKey(deadline);
  const relativeDate =
    deadlineKey === dateKey(today)
      ? "今日"
      : deadlineKey === dateKey(tomorrow)
        ? "明日"
        : `${deadline.getMonth() + 1}/${deadline.getDate()}`;

  return {
    text: `截止 ${relativeDate} ${timeLabel}`,
    className: "bg-star-300 text-bus-900",
  };
};

function ScheduleSkeleton() {
  return (
    <div className="grid gap-2.5">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-[132px] rounded-2xl bg-ink-100 animate-pulse"
        />
      ))}
    </div>
  );
}

export function ScheduleList({
  schedules,
  isLoading = false,
  errorMessage = "",
  reservationErrorMessage = "",
  canReserve = true,
  unavailableReason = "UNOPENED",
  reservingScheduleId = null,
  onRetry,
  onReserve,
}: ScheduleListProps) {
  const unavailableText =
    unavailableReason === "ACTIVE_RESERVATION"
      ? "您已有進行中的預約，仍可查看班次時刻表。"
      : "此日期尚未開放預約，仍可查看班次時刻表。";
  const unavailableButtonText =
    unavailableReason === "ACTIVE_RESERVATION" ? "已預約" : "未開放";

  return (
    <section className="rounded-panel bg-white p-4 shadow-card ring-1 ring-bus-100/80 md:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <SectionTitle
          eyebrow="班次清單"
          title=""
          description="列表會依照上車地點、日期、時段篩選。"
        />

        <div className="shrink-0 rounded-2xl bg-bus-50 px-3 py-2 text-right ring-1 ring-bus-100">
          <p className="text-md font-bold text-ink-500">可選</p>
          <p className="text-2xl font-black leading-none text-bus-700">
            {schedules.length}
          </p>
        </div>
      </div>

      {reservationErrorMessage && (
        <div className="mb-4 rounded-card bg-coral/10 p-4 text-base font-bold text-coral ring-1 ring-coral/20">
          {reservationErrorMessage}
        </div>
      )}

      {isLoading ? (
        <ScheduleSkeleton />
      ) : errorMessage ? (
        <div className="rounded-card bg-coral/10 p-6 text-center ring-1 ring-coral/20">
          <p className="text-xl font-black text-coral">班次資料讀取失敗</p>
          <p className="mt-2 text-base font-bold text-ink-600">
            {errorMessage}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 h-10 rounded-xl border border-coral bg-white px-4 text-base font-black text-coral transition hover:bg-coral hover:text-white"
            >
              重新載入
            </button>
          )}
        </div>
      ) : schedules.length === 0 ? (
        <div className="rounded-card bg-ink-50 p-6 text-center ring-1 ring-ink-100">
          <p className="text-xl font-black text-ink-800">
            目前沒有符合條件的班次
          </p>
          <p className="mt-2 text-base text-ink-500">
            請切換日期、上車地點或時段。
          </p>
        </div>
      ) : (
        <div className="grid gap-2.5">
          {!canReserve && (
            <div className="rounded-card bg-star-100/70 p-4 text-base font-black text-bus-900 ring-1 ring-star-300">
              {unavailableText}
            </div>
          )}
          {schedules.map((schedule) => {
            const isFull = schedule.availableSeats <= 0;
            const isReserved = schedule.userReservation === "RESERVED";
            const isReserving =
              reservingScheduleId === schedule.dailyOpenScheduleId;
            const deadlineBadge = getDeadlineBadge(schedule);
            const isPastDeadline = deadlineBadge.text === "已截止";
            const disabled =
              isFull ||
              isReserved ||
              isPastDeadline ||
              !canReserve ||
              reservingScheduleId !== null;

            return (
              <article
                key={schedule.dailyOpenScheduleId}
                className={`overflow-hidden rounded-card border border-bus-100 shadow-sm ring-1 ring-bus-50 ${
                  isFull ? "bg-ink-50 opacity-60" : "bg-white"
                }`}
              >
                {/* Row 1：時間、班次、剩餘人數 */}
                <div className="grid grid-cols-[1fr_auto] items-center gap-3 p-3.5">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <p className="shrink-0 font-mono text-4xl font-black leading-none tracking-tight text-ink-900">
                        {schedule.departureTime}
                      </p>

                      <div className="min-w-0">
                        <p className="truncate text-base font-black leading-5 text-ink-800">
                          {schedule.scheduleCode}
                        </p>
                        <p className="text-xl font-bold text-ink-400">
                          宜蘭→五結
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 rounded-2xl bg-bus-50 px-3 py-2 text-right ring-1 ring-bus-100">
                    <p className="text-xl font-bold leading-none text-ink-500">
                      剩餘
                    </p>
                    <p
                      className={`mt-1 text-3xl font-black leading-none ${
                        isFull ? "text-coral" : "text-bus-700"
                      }`}
                    >
                      {schedule.availableSeats}
                      <span className="ml-0.5 text-sm font-bold text-ink-500">
                        人
                      </span>
                    </p>
                  </div>
                </div>

                {/* Row 2：狀態、備註、按鈕 */}
                <div className="grid grid-cols-[1fr_120px] items-center gap-3 border-t border-bus-100 bg-gradient-to-r from-bus-50/80 to-white p-3.5">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-sm font-black ${deadlineBadge.className}`}
                      >
                        {deadlineBadge.text}
                      </span>

                      {isPastDeadline ? (
                        <span className="shrink-0 rounded-full bg-ink-200 px-2.5 py-1 text-sm font-black text-ink-600">
                          已截止
                        </span>
                      ) : isReserved ? (
                        <span className="shrink-0 rounded-full bg-ink-900 px-2.5 py-1 text-sm font-black text-white">
                          已預約
                        </span>
                      ) : isFull ? (
                        <span className="shrink-0 rounded-full bg-coral/10 px-2.5 py-1 text-sm font-black text-coral">
                          已滿
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-bus-600 px-2.5 py-1 text-sm font-black text-white">
                          可預約
                        </span>
                      )}
                    </div>

                    <p className="mt-1 truncate text-sm font-bold leading-5 text-ink-500">
                      {schedule.note}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onReserve(schedule)}
                    className={`h-14 text-2xl rounded-2xl px-4 text-base font-black outline-none transition focus-visible:ring-4 focus-visible:ring-bus-100 ${
                      disabled
                        ? "cursor-not-allowed bg-ink-100 text-ink-400"
                        : "bg-bus-900 text-white shadow-sm hover:bg-bus-700 active:scale-[0.98]"
                    }`}
                  >
                    {isReserving
                      ? "處理中"
                      : !canReserve
                        ? unavailableButtonText
                        : isPastDeadline
                          ? "已截止"
                          : isReserved
                            ? "已預約"
                            : isFull
                              ? "已滿"
                              : "預約"}
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
