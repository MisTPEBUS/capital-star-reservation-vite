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
}

const timePeriods: { value: TimePeriod; label: string }[] = [
  { value: "ALL", label: "全部時段" },
  { value: "MORNING", label: "上午" },
  { value: "AFTERNOON", label: "下午" },
  { value: "EVENING", label: "晚上" },
];

export function BookingForm({
  stops,
  dates,
  selection,
  onChange,
}: BookingFormProps) {
  const update = <K extends keyof BookingSelection>(
    key: K,
    value: BookingSelection[K],
  ) => {
    onChange({ ...selection, [key]: value });
  };

  return (
    <section className="rounded-panel bg-white p-5 shadow-card ring-1 ring-bus-100/80 md:p-6">
      <SectionTitle
        eyebrow="Section 2"
        title="選擇預約條件"
        description="選擇上車站與搭乘日期，系統會依條件顯示可預約班次。"
      />

      <div className="grid gap-5">
        {/* 上車地點 */}
        <div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-black text-ink-800">上車地點</p>
              <p className="mt-1 text-xs font-bold text-ink-500">
                請選擇你的上車站
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            {stops.map((stop) => {
              const isActive = selection.pickupStopId === stop.stopId;

              return (
                <button
                  key={stop.stopId}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => update("pickupStopId", stop.stopId)}
                  className={`min-h-[56px] rounded-2xl px-4 text-left outline-none transition focus-visible:ring-4 focus-visible:ring-bus-100 ${
                    isActive
                      ? "bg-bus-600 text-white shadow-card"
                      : "bg-ink-50 text-ink-800 ring-1 ring-bus-100 hover:bg-bus-50"
                  }`}
                >
                  <span className="block text-base font-black">
                    {stop.stopName}
                  </span>
                  <span
                    className={`mt-1 block text-xs font-bold ${
                      isActive ? "text-bus-50" : "text-ink-500"
                    }`}
                  >
                    點選此站作為上車地點
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 日期 */}
        <div>
          <div>
            <p className="text-sm font-black text-ink-800">日期</p>
            <p className="mt-1 text-xs font-bold text-ink-500">
              選擇預計搭乘日期
            </p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
            {dates.map((date) => {
              const isActive = selection.openDate === date.value;

              return (
                <button
                  key={date.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => update("openDate", date.value)}
                  className={`min-h-[64px] rounded-2xl px-3 text-center outline-none transition focus-visible:ring-4 focus-visible:ring-bus-100 ${
                    isActive
                      ? "bg-bus-600 text-white shadow-card"
                      : "bg-ink-50 text-ink-800 ring-1 ring-bus-100 hover:bg-bus-50"
                  }`}
                >
                  <span className="block text-sm font-black">{date.label}</span>
                  <span
                    className={`mt-1 block text-xs font-bold ${
                      isActive ? "text-bus-50" : "text-ink-500"
                    }`}
                  >
                    可預約
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 時間 */}
        <div>
          <p className="text-sm font-black text-ink-800">時間</p>
          <p className="mt-1 text-xs font-bold text-ink-500">
            篩選想搭乘的出發時段
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
            {timePeriods.map((period) => {
              const isActive = selection.timePeriod === period.value;

              return (
                <button
                  key={period.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => update("timePeriod", period.value)}
                  className={`min-h-12 rounded-2xl px-3 text-sm font-black outline-none transition focus-visible:ring-4 focus-visible:ring-bus-100 ${
                    isActive
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
