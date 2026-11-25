import type { OpenSchedule } from "../../../types/reservation";

interface ReservationActionBarProps {
  selectedSchedule: OpenSchedule | null;
  hasReservationOnSelectedDate: boolean;
  canReserve: boolean;
  reservingScheduleId: string | null;
  onReserveClick: () => void;
}

export function ReservationActionBar({
  selectedSchedule,
  hasReservationOnSelectedDate,
  canReserve,
  reservingScheduleId,
  onReserveClick,
}: ReservationActionBarProps) {
  const isDisabled =
    hasReservationOnSelectedDate ||
    !selectedSchedule ||
    !canReserve ||
    reservingScheduleId !== null;
  const buttonText = hasReservationOnSelectedDate
    ? "已預約"
    : reservingScheduleId
      ? "處理中"
      : "預約";

  return (
    <>
      <button
        type="button"
        aria-label="回到頁面頂端"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-24 right-4 z-40 grid h-12 w-12 place-items-center rounded-full border border-bus-100 bg-white text-2xl font-black leading-none text-bus-700 shadow-lift transition hover:bg-bus-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bus-100"
      >
        ↑
      </button>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-bus-100 bg-white/95 px-4 py-3 shadow-[0_-12px_30px_rgba(7,43,80,0.12)] backdrop-blur">
        {hasReservationOnSelectedDate ? (
          <button
            type="button"
            disabled
            className="mx-auto block h-12 w-full max-w-[820px] cursor-not-allowed rounded-2xl bg-ink-100 px-4 text-lg font-black text-ink-400"
          >
            已預約
          </button>
        ) : (
          <div className="mx-auto grid w-full max-w-[820px] grid-cols-[1fr_132px] items-center gap-3">
            <div className="min-w-0">
              <p className="text-xs font-black text-ink-500">已選班次</p>
              <p className="truncate text-lg font-black text-ink-900">
                {selectedSchedule
                  ? `${selectedSchedule.openDate} ${selectedSchedule.departureTime}`
                  : "請選擇搭乘時間"}
              </p>
            </div>
            <button
              type="button"
              disabled={isDisabled}
              onClick={onReserveClick}
              className={`h-12 rounded-2xl px-4 text-lg font-black outline-none transition focus-visible:ring-4 focus-visible:ring-bus-100 ${
                isDisabled
                  ? "cursor-not-allowed bg-ink-100 text-ink-400"
                  : "bg-bus-900 text-white shadow-card hover:bg-bus-700 active:scale-[0.98]"
              }`}
            >
              {buttonText}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
