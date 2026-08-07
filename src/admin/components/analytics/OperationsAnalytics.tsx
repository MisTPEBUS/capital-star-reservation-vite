import { AlertTriangle, ArrowDown, BusFront } from "lucide-react";
import {
  pickupDays,
  pickupSeries,
  pickupWarnings,
  tomorrowLoads,
} from "../../data/analyticsMockData";
import { AnalyticsCard, EmptyChartGrid } from "./AnalyticsCard";
import { LineChart } from "./LineChart";

function TomorrowLoadChart() {
  const maxValue = Math.max(...tomorrowLoads.map((item) => item.booked), 48);
  const capacity = tomorrowLoads[0].capacity;
  return (
    <div className="overflow-x-auto">
      <div className="relative min-w-[42rem] pt-7">
        <div
          className="pointer-events-none absolute left-0 right-0 z-10 border-t-2 border-dashed border-amber-300/80"
          style={{ bottom: `${(capacity / maxValue) * 224 + 44}px` }}
        >
          <span className="absolute right-0 -top-6 text-xs font-bold text-amber-200">核定座位 {capacity}</span>
        </div>
        <div className="flex h-72 items-end gap-3 border-b border-admin-borderStrong px-2">
          {tomorrowLoads.map((item) => {
            const loadRate = Math.round((item.booked / item.capacity) * 100);
            const tone = item.booked > item.capacity ? "bg-red-400" : loadRate < 35 ? "bg-slate-400" : loadRate >= 85 ? "bg-amber-300" : "bg-adminStatus-enabled";
            return (
              <div className="flex min-w-0 flex-1 flex-col items-center" key={`${item.route}-${item.time}`}>
                <span className="mb-2 text-sm font-black text-admin-text">{item.booked}</span>
                <div
                  aria-label={`${item.route} ${item.time}，預約 ${item.booked} 席，載客率 ${loadRate}%`}
                  className={`w-full max-w-14 rounded-t-md ${tone}`}
                  role="img"
                  style={{ height: `${(item.booked / maxValue) * 224}px` }}
                />
                <div className="h-11 pt-2 text-center text-[11px] leading-4 text-admin-muted">
                  <span className="block font-bold text-admin-softText">{item.time}</span>
                  {item.route}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function OperationsAnalytics({
  route,
  time,
}: {
  route: string;
  time: string;
}) {
  return (
    <div className="space-y-5">
      <AnalyticsCard
        badge={`${route}｜${time}｜40 席`}
        description="同路線、同發車時段的歷史班次，與目前 8/8 班次截至 T-2 的累積預約進度。"
        hypothesis="H1"
        insight="歷史曲線已形成窄幅帶狀；目前班次 T-2 為 71%，高於歷史同期約 9 個百分點，建議預備加班車。"
        title="Pickup 預約累積曲線"
      >
        <EmptyChartGrid>
          <LineChart ariaLabel={`${route} 路線 ${time} 班次的預約累積百分比折線圖`} labels={pickupDays} series={pickupSeries} showHistoricalBand />
        </EmptyChartGrid>
      </AnalyticsCard>

      <AnalyticsCard
        badge="明日 8/8"
        description="各班次目前預約座位數；虛線為核定座位，紅色代表已超過核定運能，灰色代表低於 35%。"
        hypothesis="H2"
        insight="1571 07:00 已超載 3 席，1573 17:30 接近滿載；1572 08:00 僅 23%，是優先併班候選。"
        title="明日班次負載"
      >
        <EmptyChartGrid><TomorrowLoadChart /></EmptyChartGrid>
      </AnalyticsCard>

      <AnalyticsCard
        badge="門檻：落後 ≥ 10%"
        description="自動列出目前預約進度低於同路線、同時段歷史同期的班次，依落後幅度排序。"
        hypothesis="H3"
        insight="四班需要處理，其中 1572 08:00 落後最明顯；先確認是否有活動、停駛或通路異常，再決定減班。"
        title="Pickup 落後預警清單"
      >
        <div className="overflow-x-auto rounded-adminControl border border-admin-border">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="bg-admin-bg/45 text-xs uppercase tracking-wider text-admin-muted">
              <tr><th className="px-4 py-3">班次</th><th className="px-4 py-3">發車日</th><th className="px-4 py-3">目前進度</th><th className="px-4 py-3">歷史同期</th><th className="px-4 py-3">差距</th><th className="px-4 py-3">建議</th></tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {pickupWarnings.map((item) => (
                <tr className="hover:bg-admin-elevated/30" key={item.id}>
                  <td className="px-4 py-3 font-black text-admin-text">{item.route}・{item.time}</td>
                  <td className="px-4 py-3 text-admin-muted">{item.departure}</td>
                  <td className="px-4 py-3">{item.current}%</td><td className="px-4 py-3">{item.historical}%</td>
                  <td className="px-4 py-3 font-black text-red-300"><span className="inline-flex items-center gap-1"><ArrowDown className="h-4 w-4" />{Math.abs(item.gap)}%</span></td>
                  <td className="px-4 py-3"><span className="rounded-full bg-amber-300/15 px-2.5 py-1 text-xs font-bold text-amber-200">{item.action}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-admin-muted">
          <span className="inline-flex items-center gap-1"><AlertTriangle className="h-4 w-4 text-amber-300" />假資料示意，尚未觸發派班動作</span>
          <span className="inline-flex items-center gap-1"><BusFront className="h-4 w-4 text-adminStatus-enabled" />共 4 班待檢視</span>
        </div>
      </AnalyticsCard>
    </div>
  );
}
