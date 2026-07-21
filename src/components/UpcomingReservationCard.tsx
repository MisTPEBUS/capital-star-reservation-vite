import { KeyboardEvent, useEffect, useState } from "react";
import {
  cancelReservation,
  type UpcomingReservation,
} from "../api/reservations";
import { Toast, type ToastMessage } from "./Toast";

interface UpcomingReservationCardProps {
  reservation: UpcomingReservation | null;
  userId: string | null;
  identityCode: string | null;
  passengerName?: string | null;
  onCancelled: () => Promise<void>;
  canCancel?: boolean;
}

const formatBookedAt = (bookedAt: string) => {
  const date = new Date(bookedAt);

  if (Number.isNaN(date.getTime())) return bookedAt;

  return new Intl.DateTimeFormat("zh-TW", {
    dateStyle: "short",
    timeStyle: "short",
    hour12: false,
    timeZone: "Asia/Taipei",
  }).format(date);
};

const formatDepartureTime = (departureTime: string) => {
  if (!departureTime) return "-";

  return departureTime.slice(0, 5);
};

const formatSequence = (sequence?: number | null) => {
  if (sequence === null || sequence === undefined) return "-";

  return String(sequence).padStart(2, "0");
};

const getStatusText = (status: string) => {
  if (status === "RESERVED") return "已預約";
  if (status === "CANCELLED") return "已取消";

  return status;
};

export function UpcomingReservationCard({
  reservation,
  userId,
  identityCode,
  passengerName,
  onCancelled,
  canCancel = reservation?.status === "RESERVED",
}: UpcomingReservationCardProps) {
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isTicketExpanded, setIsTicketExpanded] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    if (!isTicketExpanded) return;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setIsTicketExpanded(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTicketExpanded]);

  if (!reservation) return null;

  const handleCancel = async () => {
    if (!userId) {
      setIsConfirmingCancel(false);
      setToast({
        type: "error",
        message: "尚未取得使用者資料，無法取消預約。",
      });
      return;
    }

    try {
      setIsCancelling(true);
      await cancelReservation(reservation.reservationId, userId);
      setIsConfirmingCancel(false);
      setToast({ type: "success", message: "您的預約班次已取消。" });
      await onCancelled();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "取消預約失敗，請稍後再試。";
      setIsConfirmingCancel(false);
      setToast({ type: "error", message });
    } finally {
      setIsCancelling(false);
    }
  };

  const departureTime = formatDepartureTime(reservation.departureTime);
  const bookedAt = formatBookedAt(reservation.bookedAt);
  const sequence = formatSequence(reservation.sequenceNo);
  const statusText = getStatusText(reservation.status);
  const identityCodePrefix = identityCode?.slice(0, -3) ?? "";
  const identityCodeSuffix = identityCode?.slice(-3) ?? "";

  const handleTicketKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsTicketExpanded(true);
    }
  };

  return (
    <section
      id="upcoming-reservation"
      className="overflow-hidden rounded-panel"
    >
      {/* <SectionTitle eyebrow="" title="預約乘車憑證" description="" /> */}
      <article
        aria-label="預約乘車憑證，點擊可全螢幕檢視"
        aria-modal={isTicketExpanded || undefined}
        className={`overflow-hidden rounded-[22px] border-2 border-[#D7B94A] bg-[#FFF3B0] shadow-[0_20px_45px_rgba(107,90,37,0.22)] transition-transform duration-200 ${
          isTicketExpanded
            ? "fixed inset-3 z-50 m-0 overflow-y-auto shadow-[0_0_0_100vmax_rgba(15,23,42,0.72)] md:inset-8"
            : "mt-4 cursor-zoom-in hover:scale-[1.01]"
        }`}
        role={isTicketExpanded ? "dialog" : "button"}
        tabIndex={0}
        onClick={() => setIsTicketExpanded((current) => !current)}
        onKeyDown={handleTicketKeyDown}
      >
        <div
          className="relative px-4 pt-4 md:px-5 md:pt-5"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(159,17,24,0.09) 1px, transparent 0)",
            backgroundSize: "12px 12px",
          }}
        >
          {isTicketExpanded && (
            <button
              aria-label="關閉全螢幕乘車憑證"
              className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-2xl font-black text-[#C9151E] shadow-md transition hover:bg-white"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setIsTicketExpanded(false);
              }}
            >
              ×
            </button>
          )}

          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-bold text-[#6B5A25]">首都客運</p>
              <h3 className="mt-1 text-5xl font-black leading-none tracking-tight text-[#C9151E]">
                {reservation.routeNumber}
              </h3>
            </div>
            <div className="rounded-2xl border border-[#D7B94A] bg-[#FFF8D6] p-3 md:p-4">
              <p className="text-md font-black text-[#C9151E]">上車站</p>
              <p className="mt-1 break-words text-4xl font-black text-[#1F1A17]">
                {reservation.pickupStop.stopName}
              </p>
            </div>
          </div>

          <div className="mt-4 border-t-2 border-dashed border-[#D7B94A]" />
        </div>

        <div className="px-4 py-4 md:px-5">
          <div className="grid gap-3">
            <div>
              <p className="text-md font-black text-[#C9151E]">乘車日期</p>
              <p className="mt-1 text-2xl font-black text-[#1F1A17]">
                {reservation.openDate}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 md:gap-3">
              <div className="rounded-2xl border border-[#C9151E] bg-[#C9151E] p-3 text-white md:p-4">
                <p className="text-md font-black text-red-100">班次時刻</p>
                <p className="mt-1 text-3xl font-black tracking-tight text-center">
                  {departureTime}
                </p>
              </div>

              <div className="shrink-0 rounded-xl border border-[#D7B94A] bg-[#FFF8D6] px-3 py-2 text-left">
                <p className="text-base font-black text-[#C9151E]">乘車序號</p>
                <p className="mt-1 text-5xl font-black text-[#1F1A17] text-center">
                  {sequence}
                </p>
              </div>
            </div>
            {passengerName || identityCode ? (
              <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border-2 border-[#C9151E] bg-white p-3 shadow-[0_8px_18px_rgba(201,21,30,0.12)] md:p-4">
                <div className="min-w-0">
                  <p className="text-md font-black text-[#C9151E]">乘客</p>
                  <p className="mt-1 break-words text-4xl font-black leading-none text-[#1F1A17]">
                    {passengerName || "-"}
                  </p>
                  <p className="mt-3 text-lg font-black text-[#C9151E]">
                    預約搭乘人數：{reservation.passengerCount ?? 1} 人
                  </p>
                </div>
                <div className="shrink-0 rounded-xl bg-[#FFF8D6] px-3 py-2 text-right ring-1 ring-[#D7B94A]">
                  <p className="text-md font-black text-[#C9151E] text-left">
                    識別碼
                  </p>
                  <p className="mt-1 max-w-[140px] truncate font-mono text-base font-black tracking-[0.12em] text-[#1F1A17]">
                    {identityCode ? (
                      <>
                        {identityCodePrefix}
                        <span className="text-3xl text-[#C9151E]">
                          {identityCodeSuffix}
                        </span>
                      </>
                    ) : (
                      "-"
                    )}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 text-md">
            {/*  <div>
              <p className="font-black text-[#C9151E]">預約時間</p>
              <p className="mt-1 text-2xl font-black text-[#1F1A17]">
                {bookedAt}
              </p>
            </div> */}
          </div>
        </div>

        <div className="relative border-t-2 border-dashed border-[#D7B94A] bg-[#F6DF79] px-4 py-3 md:px-5">
          <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-white" />
          <div className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-white" />
          <p className="text-xl font-black text-[#C9151E]  text-center">
            乘車時請出示此畫面，並依預約日期與班次時刻到站候車。
          </p>
          {!isTicketExpanded && (
            <p className="mt-2 text-base font-black text-[#6B5A25] text-center">
              點選隨意區塊可以放大乘車證
            </p>
          )}
        </div>
      </article>

      {canCancel && (
        <button
          className="mt-3 h-11 w-full rounded-xl border-2 border-[#C9151E] bg-white px-4 text-base font-black text-[#C9151E] transition hover:bg-[#C9151E] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isCancelling}
          type="button"
          onClick={() => setIsConfirmingCancel(true)}
        >
          取消預約
        </button>
      )}

      {isConfirmingCancel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-reservation-title"
        >
          <div className="w-full max-w-sm rounded-panel bg-white p-5 text-center shadow-soft ring-1 ring-bus-100">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-coral/10 text-2xl font-black text-coral">
              !
            </div>
            <h2
              id="cancel-reservation-title"
              className="mt-4 text-xl font-black text-ink-900"
            >
              確定取消預約？
            </h2>
            <p className="mt-3 text-md leading-6 text-ink-500">
              取消後將釋出此班次座位，且無法復原。
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                className="h-11 rounded-xl bg-ink-100 px-4 text-md font-black text-ink-700 transition hover:bg-ink-300"
                disabled={isCancelling}
                type="button"
                onClick={() => setIsConfirmingCancel(false)}
              >
                返回
              </button>
              <button
                className="h-11 rounded-xl bg-coral px-4 text-md font-black text-white transition hover:bg-[#e36736] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isCancelling}
                type="button"
                onClick={handleCancel}
              >
                {isCancelling ? "取消中..." : "確定取消"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </section>
  );
}
