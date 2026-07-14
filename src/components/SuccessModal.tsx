import type { ReservationResult } from "../types/reservation";

interface SuccessModalProps {
  result: ReservationResult | null;
  onClose: () => void;
}

export function SuccessModal({ result, onClose }: SuccessModalProps) {
  if (!result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/55 px-3 pb-3 pt-10 backdrop-blur-sm md:items-center md:pb-10">
      <section className="w-full max-w-[520px] overflow-hidden rounded-panel bg-white shadow-soft ring-1 ring-white/70">
        <div className="bg-gradient-to-br from-bus-900 via-bus-700 to-bus-500 p-5 text-white">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-star-300 text-3xl font-black text-bus-900 shadow-card">
            ✓
          </div>
          <h2 className="mt-4 text-center text-2xl font-black tracking-tight">
            預約成功
          </h2>
          <p className="mt-2 text-center text-sm leading-6 text-bus-100">
            系統已建立乘車預約，請於上車時出示會員識別碼。
          </p>
        </div>

        <div className="p-4 md:p-5">
          <div className="rounded-card bg-cream p-3 ring-1 ring-star-100 md:p-4">
            <DetailRow label="乘客" value={result.passengerName} />
            <DetailRow label="識別碼" value={result.activeCode} mono />
            <DetailRow
              label="班次"
              value={`${result.scheduleCode}｜${result.departureTime}`}
            />
            <DetailRow label="日期" value={result.openDate} />
            <DetailRow label="上車地點" value={result.pickupStopName} />
            <DetailRow label="預約時間" value={result.bookedAt} />
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-11 w-full rounded-xl bg-bus-900 text-base font-black text-white outline-none transition hover:bg-bus-700 focus-visible:ring-4 focus-visible:ring-bus-100"
            >
              完成
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-star-100 py-2.5 last:border-b-0">
      <p className="text-xl font-bold text-ink-500">{label}</p>
      <p
        className={`text-right text-xl font-black text-ink-900 ${mono ? "font-mono tracking-[0.16em]" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
