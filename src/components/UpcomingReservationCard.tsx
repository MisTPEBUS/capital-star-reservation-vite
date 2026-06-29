import { KeyboardEvent, useEffect, useState } from "react";
import {
  cancelReservation,
  type UpcomingReservation,
} from "../api/reservations";
import { SectionTitle } from "./SectionTitle";

interface UpcomingReservationCardProps {
  reservation: UpcomingReservation | null;
  userId: string | null;
  identityCode: string | null;
  onCancelled: () => Promise<void>;
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

const formatSequence = (sequence: number) => {
  return String(sequence).padStart(2, "0");
};

const getStatusText = (status: string) => {
  if (status === "RESERVED") return "已預約";
  if (status === "CANCELLED") return "已取消";

  return status;
};

const getStopTypeText = (stopType: string) => {
  if (stopType === "ROADSIDE") return "路邊站";
  if (stopType === "STATION") return "場站";

  return stopType;
};

export function UpcomingReservationCard({
  reservation,
  userId,
  identityCode,
  onCancelled,
}: UpcomingReservationCardProps) {
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isTicketExpanded, setIsTicketExpanded] = useState(true);
  const [resultMessage, setResultMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

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
      setResultMessage({
        type: "error",
        message: "尚未取得使用者資料，無法取消預約。",
      });
      return;
    }

    try {
      setIsCancelling(true);
      await cancelReservation(reservation.reservationId, userId);
      setIsConfirmingCancel(false);
      setResultMessage({ type: "success", message: "您的預約班次已取消。" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "取消預約失敗，請稍後再試。";
      setIsConfirmingCancel(false);
      setResultMessage({ type: "error", message });
    } finally {
      setIsCancelling(false);
    }
  };

  const closeResult = async () => {
    const resultType = resultMessage?.type;
    setResultMessage(null);

    if (resultType === "success") {
      await onCancelled();
    }
  };

  const departureTime = formatDepartureTime(reservation.departureTime);
  const bookedAt = formatBookedAt(reservation.bookedAt);
  const sequence = reservation.pickupStop.sequence;
  const statusText = getStatusText(reservation.status);
  const stopTypeText = getStopTypeText(reservation.pickupStop.stopType);

  const ticketNo = reservation.reservationId
    .replaceAll("-", "")
    .slice(0, 12)
    .toUpperCase();

  const handleTicketKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsTicketExpanded(true);
    }
  };

  return (
    <section className="overflow-hidden rounded-panel bg-white p-5 shadow-card ring-1 ring-[#D7B94A]/70 md:p-6">
      <SectionTitle eyebrow="" title="預約乘車憑證" description="" />
      <article
        aria-label="預約乘車憑證，點擊可全螢幕檢視"
        aria-modal={isTicketExpanded || undefined}
        className={`overflow-hidden rounded-[22px] border-2 border-[#D7B94A] bg-[#FFF3B0] shadow-[0_20px_45px_rgba(107,90,37,0.22)] transition-transform duration-200 ${
          isTicketExpanded
            ? "fixed inset-3 z-50 m-0 overflow-y-auto shadow-[0_0_0_100vmax_rgba(15,23,42,0.72)] md:inset-8"
            : "mt-5 cursor-zoom-in hover:scale-[1.01]"
        }`}
        role={isTicketExpanded ? "dialog" : "button"}
        tabIndex={0}
        onClick={() => !isTicketExpanded && setIsTicketExpanded(true)}
        onKeyDown={handleTicketKeyDown}
      >
        <div
          className="relative px-5 pt-5"
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
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-md font-bold text-[#6B5A25]">首都客運</p>

              <h3 className="mt-1 text-4xl font-black leading-none tracking-tight text-[#C9151E]">
                1571
              </h3>
              <p className="text-md font-bold text-[#6B5A25]">
                宜蘭 - 市府轉運站
              </p>
            </div>

            <div className="shrink-0 rounded-xl border border-[#D7B94A] bg-[#FFF8D6] px-3 py-2 text-right">
              <p className="text-base font-black text-[#C9151E]">乘車序號</p>
              <p className="mt-1 text-5xl font-black text-[#1F1A17]">
                {sequence}
              </p>
            </div>
          </div>

          <div className="mt-5 border-t-2 border-dashed border-[#D7B94A]" />
        </div>

        <div className="px-5 py-5">
          <div className="grid gap-4">
            <div>
              <p className="text-md font-black text-[#C9151E]">乘車日期</p>
              <p className="mt-1 text-2xl font-black text-[#1F1A17]">
                {reservation.openDate}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#D7B94A] bg-[#FFF8D6] p-4">
                <p className="text-md font-black text-[#C9151E]">上車站</p>
                <p className="mt-1 break-words text-4xl font-black text-[#1F1A17]">
                  {reservation.pickupStop.stopName}
                </p>
              </div>

              <div className="rounded-2xl border border-[#C9151E] bg-[#C9151E] p-4 text-white">
                <p className="text-md font-black text-red-100">班次時刻</p>
                <p className="mt-1 text-3xl font-black tracking-tight">
                  {departureTime}
                </p>
              </div>
            </div>

            <div className="hidden rounded-2xl border border-[#D7B94A] bg-[#FFF8D6] p-4">
              <div className="flex items-start justify-between gap-3">
                {/*  <div>
                  <p className="text-md font-black text-[#C9151E]">班次代碼</p>
                  <p className="mt-1 text-2xl font-black text-[#1F1A17]">
                    {reservation.routeNumber}
                  </p>
                </div> */}

                {/*  <span className="shrink-0 rounded-full bg-[#C9151E] px-3 py-1 text-base font-black text-white">
                  {statusText}
                </span> */}
              </div>
            </div>
          </div>

          {/*  <div className="mt-5 rounded-xl bg-white p-3 ring-1 ring-[#D7B94A]">
            <div
              className="h-[54px] rounded-sm"
              style={{
                background:
                  "repeating-linear-gradient(90deg, #111 0 2px, transparent 2px 4px, #111 4px 5px, transparent 5px 9px, #111 9px 12px, transparent 12px 15px)",
              }}
            />
            <p className="mt-2 text-center text-base font-bold tracking-[0.18em] text-[#6B5A25]">
              {ticketNo}
            </p>
          </div> */}

          <div className="mt-4 grid grid-cols-2 gap-3 text-md">
            <div>
              <p className="font-black text-[#C9151E]">預約時間</p>
              <p className="mt-1 text-2xl font-black text-[#1F1A17]">
                {bookedAt}
              </p>
            </div>

            <div>
              <p className="font-black text-[#C9151E]">憑證狀態</p>
              <p className="mt-1 text-2xl font-black text-[#1F1A17]">
                {statusText}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[#D7B94A] bg-[#FFF8D6] p-4">
            <p className="font-black text-[#C9151E]">使用者身分識別碼</p>
            <p className="mt-1 break-all text-xl font-black text-[#1F1A17]">
              {identityCode || "-"}
            </p>
          </div>
        </div>

        <div className="relative border-t-2 border-dashed border-[#D7B94A] bg-[#F6DF79] px-5 py-4">
          <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-white" />
          <div className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-white" />

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className=" text-xl font-black text-[#C9151E]">
                乘車時請出示此畫面，並依預約日期與班次時刻到站候車。
              </p>
            </div>

            <span className="hidden rounded-full bg-[#C9151E] px-3 py-1 text-base font-black text-white">
              {reservation.routeNumber}
            </span>
          </div>

          <button
            className="mt-4 h-10 w-full rounded-xl border border-[#C9151E]/30 bg-white px-4 text-2xl font-black text-[#C9151E] transition hover:bg-[#C9151E] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isCancelling}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsConfirmingCancel(true);
            }}
          >
            取消預約
          </button>
        </div>
      </article>

      {isConfirmingCancel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/55 p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-reservation-title"
        >
          <div className="w-full max-w-sm rounded-panel bg-white p-6 text-center shadow-soft ring-1 ring-bus-100">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-coral/10 text-2xl font-black text-coral">
              !
            </div>
            <h2
              id="cancel-reservation-title"
              className="mt-5 text-xl font-black text-ink-900"
            >
              確定取消預約？
            </h2>
            <p className="mt-3 text-md leading-6 text-ink-500">
              取消後將釋出此班次座位，且無法復原。
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
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

      {resultMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/55 p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-result-title"
        >
          <div className="w-full max-w-sm rounded-panel bg-white p-6 text-center shadow-soft ring-1 ring-bus-100">
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-xl font-black ${
                resultMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-coral/10 text-coral"
              }`}
            >
              {resultMessage.type === "success" ? "OK" : "!"}
            </div>
            <h2
              id="cancel-result-title"
              className="mt-5 text-xl font-black text-ink-900"
            >
              {resultMessage.type === "success"
                ? "取消預約成功"
                : "取消預約失敗"}
            </h2>
            <p className="mt-3 text-md leading-6 text-ink-500">
              {resultMessage.message}
            </p>
            <button
              className="mt-6 h-11 w-full rounded-xl bg-bus-700 px-4 text-md font-black text-white transition hover:bg-bus-900"
              type="button"
              onClick={closeResult}
            >
              確定
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
