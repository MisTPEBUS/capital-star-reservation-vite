import { useMemo, useState } from "react";

type DensityKey = "current" | "compact";

type DensityConfig = {
  label: string;
  description: string;
  page: string;
  shell: string;
  stack: string;
  card: string;
  cardSoft: string;
  sectionGap: string;
  innerGap: string;
  field: string;
  button: string;
  pill: string;
  ticket: string;
  ticketHeader: string;
};

const densityConfigs: Record<DensityKey, DensityConfig> = {
  current: {
    label: "目前版本",
    description: "維持現有前台的寬鬆留白，卡片與區塊間距較大。",
    page: "px-4 py-4 md:px-6 md:py-8",
    shell: "max-w-[820px]",
    stack: "gap-5 pb-10",
    card: "rounded-panel bg-white p-5 shadow-card ring-1 ring-bus-100/80 md:p-6",
    cardSoft: "rounded-card bg-ink-50 p-5 ring-1 ring-bus-100",
    sectionGap: "mt-5",
    innerGap: "gap-5",
    field: "min-h-[56px] rounded-2xl px-4",
    button: "h-14 rounded-2xl px-4",
    pill: "rounded-full px-3 py-1",
    ticket: "rounded-[22px] p-5",
    ticketHeader: "gap-4",
  },
  compact: {
    label: "建議壓縮版",
    description: "降低頁面外距、卡片內距與表單高度，保留清楚分區。",
    page: "px-3 py-3 md:px-4 md:py-5",
    shell: "max-w-[760px]",
    stack: "gap-3 pb-6 md:gap-4",
    card: "rounded-[24px] bg-white p-4 shadow-card ring-1 ring-bus-100/80 md:p-5",
    cardSoft: "rounded-[20px] bg-ink-50 p-4 ring-1 ring-bus-100",
    sectionGap: "mt-4",
    innerGap: "gap-3",
    field: "min-h-12 rounded-xl px-3",
    button: "h-12 rounded-xl px-4",
    pill: "rounded-full px-2.5 py-1",
    ticket: "rounded-[18px] p-4",
    ticketHeader: "gap-3",
  },
};

const stops = ["市府轉運站", "科技大樓", "礁溪轉運站", "宜蘭轉運站"];
const dates = ["7/8 週三", "7/9 週四", "7/10 週五", "7/11 週六"];
const times = ["09:10", "10:40", "13:20", "16:50"];
const faqs = [
  {
    title: "預約後可以取消嗎？",
    body: "發車前仍可取消，實際截止時間依班次設定顯示。",
  },
  {
    title: "乘車時需要出示什麼？",
    body: "請出示會員識別碼或預約憑證，現場人員會協助核對。",
  },
];

export function FrontendUIKitPage() {
  const [density, setDensity] = useState<DensityKey>("current");
  const ui = densityConfigs[density];

  const metrics = useMemo(
    () => [
      { label: "頁面外距", current: "16 / 24 / 32px", compact: "12 / 16 / 20px" },
      { label: "卡片內距", current: "20 / 24px", compact: "16 / 20px" },
      { label: "區塊間距", current: "20px", compact: "12-16px" },
      { label: "選項高度", current: "56px", compact: "48px" },
    ],
    [],
  );

  return (
    <main
      className={`min-h-screen bg-[radial-gradient(circle_at_top_left,#d7f3ff_0,#f7fbff_35%,#fff8e6_100%)] text-ink-900 ${ui.page}`}
    >
      <div className={`mx-auto w-full ${ui.shell}`}>
        <header className="sticky top-0 z-20 -mx-3 bg-white/85 px-3 py-3 shadow-sm ring-1 ring-bus-100/70 backdrop-blur md:rounded-[24px]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-bus-600">
                Frontend UI Kit
              </p>
              <h1 className="mt-1 text-2xl font-black text-ink-900">
                前台間距版本比較
              </h1>
            </div>
            <div className="grid grid-cols-2 rounded-2xl bg-ink-100 p-1">
              {(Object.keys(densityConfigs) as DensityKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDensity(key)}
                  className={`h-10 rounded-xl px-4 text-sm font-black transition ${
                    density === key
                      ? "bg-bus-900 text-white shadow-sm"
                      : "text-ink-600 hover:bg-white"
                  }`}
                >
                  {densityConfigs[key].label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className={`grid ${ui.stack}`}>
          <section className={ui.card}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-black text-bus-600">{ui.label}</p>
                <h2 className="mt-1 text-2xl font-black text-ink-900">
                  {ui.description}
                </h2>
              </div>
              <span className={`${ui.pill} bg-star-100 text-sm font-black text-bus-900 ring-1 ring-star-300`}>
                Demo Data
              </span>
            </div>
            <div className={`${ui.sectionGap} grid gap-2 sm:grid-cols-4`}>
              {metrics.map((metric) => (
                <div key={metric.label} className={ui.cardSoft}>
                  <p className="text-sm font-black text-ink-500">{metric.label}</p>
                  <p className="mt-1 text-lg font-black text-bus-700">
                    {density === "current" ? metric.current : metric.compact}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className={ui.card}>
            <div className={`grid ${ui.innerGap}`}>
              <SectionHeader eyebrow="Member" title="會員與路線卡片" />
              <div className="rounded-card bg-gradient-to-br from-bus-900 via-bus-700 to-bus-500 p-5 text-white shadow-lift">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-star-300">測試會員</p>
                    <h3 className="mt-2 text-2xl font-black">王小明</h3>
                    <p className="mt-1 text-sm font-bold text-bus-100">
                      Capital Star 1571 宜蘭線
                    </p>
                  </div>
                  <span className={`${ui.pill} bg-white/15 text-xs font-black text-star-300 ring-1 ring-white/20`}>
                    ACTIVE
                  </span>
                </div>
                <div className={`${ui.sectionGap} rounded-2xl bg-white/12 p-4 ring-1 ring-white/15`}>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-bus-100">
                    Identity Code
                  </p>
                  <p className="mt-2 font-mono text-3xl font-black tracking-[0.14em] text-star-300">
                    A8K2
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className={ui.card}>
            <div className={`grid ${ui.innerGap}`}>
              <SectionHeader eyebrow="Booking" title="預約表單元件" />
              <div className="border-t border-bus-100 pt-5">
                <p className="text-xl font-black text-ink-800">選擇上車站</p>
                <div className={`${ui.sectionGap} grid grid-cols-1 gap-2 md:grid-cols-2`}>
                  {stops.map((stop, index) => (
                    <button
                      key={stop}
                      type="button"
                      className={`${ui.field} text-left text-lg font-black outline-none ring-1 transition ${
                        index === 0
                          ? "bg-bus-900 text-white ring-bus-900"
                          : "bg-bus-50 text-bus-800 ring-bus-100"
                      }`}
                    >
                      {stop}
                    </button>
                  ))}
                </div>
              </div>
              <div className="border-t border-bus-100 pt-5">
                <p className="text-xl font-black text-ink-800">選擇日期</p>
                <div className={`${ui.sectionGap} grid grid-cols-2 gap-2 md:grid-cols-4`}>
                  {dates.map((date, index) => (
                    <button
                      key={date}
                      type="button"
                      className={`${ui.field} text-center text-lg font-black ${
                        index === 1
                          ? "bg-star-300 text-bus-900"
                          : "bg-white text-ink-700 ring-1 ring-bus-100"
                      }`}
                    >
                      {date}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className={ui.card}>
            <div className={`mb-4 flex items-start justify-between ${ui.ticketHeader}`}>
              <SectionHeader eyebrow="Schedule" title="班次列表與操作" />
              <div className="shrink-0 rounded-2xl bg-bus-50 px-3 py-2 text-right ring-1 ring-bus-100">
                <p className="text-sm font-bold text-ink-500">可選</p>
                <p className="text-2xl font-black leading-none text-bus-700">4</p>
              </div>
            </div>
            <div className="grid gap-2.5">
              {times.map((time, index) => (
                <div
                  key={time}
                  className="overflow-hidden rounded-card border border-bus-100 bg-white shadow-sm ring-1 ring-bus-50"
                >
                  <div className={`grid grid-cols-[1fr_auto] items-center ${ui.ticketHeader} p-3.5`}>
                    <div>
                      <p className="font-mono text-4xl font-black leading-none text-ink-900">
                        {time}
                      </p>
                      <p className="mt-1 text-base font-bold text-ink-500">
                        尚有 {18 - index * 3} 位可預約
                      </p>
                    </div>
                    <button
                      type="button"
                      className={`${ui.button} bg-bus-900 text-xl font-black text-white transition hover:bg-bus-700`}
                    >
                      預約
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={ui.card}>
            <SectionHeader eyebrow="Ticket" title="預約憑證卡片" />
            <div
              className={`${ui.sectionGap} overflow-hidden border-2 border-[#D7B94A] bg-[#FFF3B0] shadow-[0_20px_45px_rgba(107,90,37,0.18)] ${ui.ticket}`}
            >
              <div className={`flex items-start justify-between ${ui.ticketHeader}`}>
                <div>
                  <p className="text-base font-bold text-[#6B5A25]">首都客運</p>
                  <h3 className="mt-1 text-4xl font-black leading-none text-[#C9151E]">
                    1571
                  </h3>
                </div>
                <div className="rounded-xl border border-[#D7B94A] bg-[#FFF8D6] px-3 py-2 text-right">
                  <p className="text-base font-black text-[#C9151E]">乘車序號</p>
                  <p className="mt-1 text-5xl font-black text-[#1F1A17]">08</p>
                </div>
              </div>
              <div className={`${ui.sectionGap} grid grid-cols-2 gap-3`}>
                <InfoTile label="上車站" value="市府轉運站" />
                <InfoTile label="班次時刻" value="10:40" strong />
              </div>
            </div>
          </section>

          <section className={ui.card}>
            <SectionHeader eyebrow="FAQ" title="常見問題列表" />
            <div className={`${ui.sectionGap} grid ${density === "current" ? "gap-3" : "gap-2"}`}>
              {faqs.map((faq) => (
                <details
                  key={faq.title}
                  className="group rounded-xl border-2 border-blue-400 bg-white p-2 shadow-[0_1px_0_rgba(15,23,42,0.08),0_10px_26px_rgba(15,23,42,0.05)] open:border-bus-600"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl p-2 text-left">
                    <span className="text-lg font-black text-ink-900">
                      {faq.title}
                    </span>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ink-300 bg-white text-xl font-black text-ink-700 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-2 border-t border-ink-100 px-2 pt-3 text-base leading-7 text-ink-500">
                    {faq.body}
                  </p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-base font-black uppercase tracking-[0.24em] text-bus-600">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-2xl font-black text-ink-900">{title}</h2>
    </div>
  );
}

function InfoTile({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        strong
          ? "border-[#C9151E] bg-[#C9151E] text-white"
          : "border-[#D7B94A] bg-[#FFF8D6]"
      }`}
    >
      <p className={`text-base font-black ${strong ? "text-red-100" : "text-[#C9151E]"}`}>
        {label}
      </p>
      <p className={`mt-1 text-3xl font-black ${strong ? "text-white" : "text-[#1F1A17]"}`}>
        {value}
      </p>
    </div>
  );
}
