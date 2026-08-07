import { useState } from "react";
import { BarChart3, BusFront, CalendarClock, Database, TrendingUp } from "lucide-react";
import { ManagementAnalytics } from "../components/analytics/ManagementAnalytics";
import { OperationsAnalytics } from "../components/analytics/OperationsAnalytics";

type AnalyticsView = "operations" | "management";

const viewOptions = [
  { id: "operations" as const, label: "站務／派班", description: "日尺度・單班次", icon: BusFront },
  { id: "management" as const, label: "管理層", description: "週／月尺度・路線", icon: TrendingUp },
];

export function AnalyticsPage() {
  const [view, setView] = useState<AnalyticsView>("operations");
  const [route, setRoute] = useState("1571");
  const [time, setTime] = useState("07:00");

  return (
    <div className="space-y-4 pb-10">
      <section className="rounded-adminPanel border border-admin-border bg-admin-surface p-4 shadow-adminPanel sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-adminStatus-enabled/15 px-3 py-1 text-xs font-black text-adminStatus-enabled">
                <Database className="h-3.5 w-3.5" />DEMO DATA
              </span>
              <span className="text-xs font-semibold text-admin-muted">資料截至 2026/08/07 08:00</span>
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-admin-text sm:text-3xl">營運決策圖表</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-admin-muted">
              從預約累積節奏、明日運能到長期路線效率，把假設轉成每日調度與管理決策。以下目前皆為假資料示意。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-adminControl border border-admin-border bg-admin-bg/40 p-1.5">
            {viewOptions.map((option) => {
              const Icon = option.icon;
              const isActive = view === option.id;
              return (
                <button
                  aria-pressed={isActive}
                  className={`flex min-h-14 items-center gap-2 rounded-lg px-3 text-left transition ${isActive ? "bg-adminStatus-enabled text-admin-bg shadow" : "text-admin-muted hover:bg-admin-elevated hover:text-admin-text"}`}
                  key={option.id}
                  type="button"
                  onClick={() => setView(option.id)}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span><span className="block text-sm font-black">{option.label}</span><span className="block text-[11px] font-semibold opacity-80">{option.description}</span></span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section aria-label="決策摘要" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "明日需處理", value: "3 班", note: "1 超載・2 低載", tone: "text-red-200" },
          { label: "Pickup 預警", value: "4 班", note: "低於歷史同期 10%", tone: "text-amber-200" },
          { label: "平均上座率", value: "68%", note: "近 8 週 +3.2%", tone: "text-adminStatus-enabled" },
          { label: "WEB 通路占比", value: "63%", note: "近 30 日 +5.1%", tone: "text-sky-200" },
        ].map((item) => (
          <article className="rounded-adminCard border border-admin-border bg-admin-elevated/60 p-4" key={item.label}>
            <p className="text-xs font-bold text-admin-muted">{item.label}</p>
            <p className={`mt-1 text-2xl font-black ${item.tone}`}>{item.value}</p>
            <p className="mt-1 text-xs text-admin-muted">{item.note}</p>
          </article>
        ))}
      </section>

      {view === "operations" && (
        <section aria-labelledby="operations-view-title" className="space-y-4">
          <div className="flex flex-col gap-3 rounded-adminCard border border-admin-border bg-admin-surface p-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="inline-flex items-center gap-2 text-xs font-black tracking-wider text-adminStatus-enabled"><CalendarClock className="h-4 w-4" />每日站務檢視</p><h2 className="mt-1 text-xl font-black text-admin-text" id="operations-view-title">先看明日風險，再處理落後班次</h2></div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs font-bold text-admin-muted">分析路線<select className="mt-1 block h-10 rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-sm font-bold text-admin-text outline-none focus:border-adminStatus-enabled" value={route} onChange={(event) => setRoute(event.target.value)}><option>1571</option><option>1572</option><option>1573</option><option>1575</option></select></label>
              <label className="text-xs font-bold text-admin-muted">比較時段<select className="mt-1 block h-10 rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-sm font-bold text-admin-text outline-none focus:border-adminStatus-enabled" value={time} onChange={(event) => setTime(event.target.value)}><option>07:00</option><option>08:00</option><option>09:30</option><option>14:00</option></select></label>
            </div>
          </div>
          <OperationsAnalytics route={route} time={time} />
        </section>
      )}

      {view === "management" && (
        <section aria-labelledby="management-view-title" className="space-y-4">
          <div className="rounded-adminCard border border-admin-border bg-admin-surface p-4"><p className="inline-flex items-center gap-2 text-xs font-black tracking-wider text-adminStatus-enabled"><BarChart3 className="h-4 w-4" />管理層週月檢視</p><h2 className="mt-1 text-xl font-black text-admin-text" id="management-view-title">辨識長期低效、通路結構與乘客價值</h2></div>
          <ManagementAnalytics />
        </section>
      )}
    </div>
  );
}
