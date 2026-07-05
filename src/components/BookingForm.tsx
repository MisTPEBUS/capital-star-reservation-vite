import type {
  BookingSelection,
  PickupStop,
  TimePeriod,
} from "../types/reservation";
import { SectionTitle } from "./SectionTitle";

interface BookingFormProps {
  stops: PickupStop[];
  dates: { value: string; label: string }[];
  selection: BookingSelection;
  onChange: (next: BookingSelection) => void;
  isStopsLoading?: boolean;
  stopsError?: string;
  onRetryStops?: () => void;
}

const timePeriods: { value: TimePeriod; label: string }[] = [
  { value: "ALL", label: "全部時段" },
  { value: "MORNING", label: "上午" },
  { value: "AFTERNOON", label: "下午" },
  { value: "EVENING", label: "晚上" },
];

const getStopTypeLabel = (stopType: PickupStop["stopType"]) => {
  if (stopType === "MAIN_STATION" || stopType === "TRANSIT") return "轉運站";
  if (stopType === "ROADSIDE") return "路邊站";
  return "上車站";
};

function StepHeading({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-bus-700 text-sm font-black text-white">
        {step}
      </span>
      <div>
        <p className="text-xl font-black text-ink-800">{title}</p>
        <p className="mt-1 text-lg font-bold text-ink-500">{description}</p>
      </div>
    </div>
  );
}

export function BookingForm({
  stops,
  dates,
  selection,
  onChange,
  isStopsLoading = false,
  stopsError = "",
  onRetryStops,
}: BookingFormProps) {
  const update = <K extends keyof BookingSelection>(
    key: K,
    value: BookingSelection[K],
  ) => {
    onChange({ ...selection, [key]: value });
  };

  return (
    <section
      id="booking-form"
      className="rounded-panel bg-white p-5 shadow-card ring-1 ring-bus-100/80 md:p-6"
    >
      <SectionTitle
        eyebrow="選擇預約條件"
        title=""
        description="選擇上車站與搭乘日期，系統會依條件顯示可預約班次。"
      />

      <div className="grid gap-5">
        {/* 上車地點 */}
        <div className="border-t border-bus-100 pt-5">
          <StepHeading
            step="1"
            title="上車地點"
            description="請選擇你的上車站"
          />

          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            {isStopsLoading ? (
              <>
                <div className="h-[76px] rounded-2xl bg-ink-100 animate-pulse md:col-span-1" />
                <div className="h-[76px] rounded-2xl bg-ink-100 animate-pulse md:col-span-1" />
              </>
            ) : stopsError ? (
              <div className="rounded-2xl bg-coral/10 px-4 py-5 text-lg font-black text-coral ring-1 ring-coral/20 md:col-span-2">
                <p>{stopsError}</p>
                {onRetryStops && (
                  <button
                    type="button"
                    onClick={onRetryStops}
                    className="mt-4 h-10 rounded-xl border border-coral bg-white px-4 text-base font-black text-coral transition hover:bg-coral hover:text-white"
                  >
                    重新載入
                  </button>
                )}
              </div>
            ) : stops.length === 0 ? (
              <div className="rounded-2xl bg-ink-50 px-4 py-5 text-lg font-black text-ink-500 ring-1 ring-bus-100 md:col-span-2">
                目前沒有可預約上車站
              </div>
            ) : (
              stops.map((stop) => {
                const isActive = selection.pickupStopId === stop.stopId;

                return (
                  <button
                    key={stop.stopId}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => update("pickupStopId", stop.stopId)}
                    className={`min-h-[56px] rounded-2xl px-4 text-left outline-none transition focus-visible:ring-4 focus-visible:ring-bus-100 ${
                      isActive
                        ? "border-l-8 border-star-300 bg-bus-600 text-white shadow-card"
                        : "border-l-8 border-transparent bg-ink-50 text-ink-800 ring-1 ring-bus-100 hover:bg-bus-50"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-xl font-black">
                      {isActive && <span aria-hidden="true">✓</span>}
                      <span>{stop.stopName}</span>
                    </span>
                    <span
                      className={`mt-1 block text-lg font-bold ${
                        isActive ? "text-bus-50" : "text-ink-500"
                      }`}
                    >
                      {getStopTypeLabel(stop.stopType)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* 日期 */}
        <div className="border-t border-bus-100 pt-5">
          <StepHeading step="2" title="日期" description="選擇預計搭乘日期" />

          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
            {dates.map((date) => {
              const isActive = selection.openDate === date.value;

              return (
                <button
                  key={date.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => update("openDate", date.value)}
                  className={`min-h-[56px] rounded-2xl px-3 text-center outline-none transition focus-visible:ring-4 focus-visible:ring-bus-100 ${
                    isActive
                      ? "bg-bus-600 text-white shadow-card"
                      : "bg-ink-50 text-ink-800 ring-1 ring-bus-100 hover:bg-bus-50"
                  }`}
                >
                  <span className="block text-xl font-black">{date.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 時間 */}
        <div className="border-t border-bus-100 pt-5">
          <StepHeading
            step="3"
            title="時間"
            description="篩選想搭乘的出發時段"
          />

          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
            {timePeriods.map((period) => {
              const isActive = selection.timePeriod === period.value;

              return (
                <button
                  key={period.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => update("timePeriod", period.value)}
                  className={`min-h-12 rounded-2xl px-3 text-xl font-black outline-none transition focus-visible:ring-4 focus-visible:ring-bus-100 ${
                    isActive && period.value === "ALL"
                      ? "bg-white text-bus-700 ring-2 ring-bus-600"
                      : isActive
                        ? "bg-bus-600 text-white shadow-card"
                        : "bg-ink-50 text-ink-700 ring-1 ring-bus-100 hover:bg-bus-50"
                  }`}
                >
                  {period.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
