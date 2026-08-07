import {
  cancellationBuckets,
  channelShares,
  heatmapPeriods,
  heatmapRows,
  noShowRates,
  retentionMonths,
  retentionSeries,
} from "../../data/analyticsMockData";
import { AnalyticsCard, EmptyChartGrid } from "./AnalyticsCard";
import { LineChart } from "./LineChart";

function heatColor(value: number) {
  if (value >= 85) return "rgb(248 113 113 / .88)";
  if (value >= 70) return "rgb(251 191 36 / .76)";
  if (value >= 50) return "rgb(52 211 153 / .55)";
  return "rgb(96 165 250 / .28)";
}

function DemandHeatmap() {
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[42rem] grid-cols-[5rem_repeat(7,minmax(4.5rem,1fr))] gap-2">
        <span />
        {heatmapPeriods.map((period) => <span className="pb-1 text-center text-xs font-bold text-admin-muted" key={period}>{period}</span>)}
        {heatmapRows.flatMap((row) => [
          <span className="flex items-center font-black text-admin-softText" key={`${row.route}-label`}>{row.route}</span>,
          ...row.values.map((value, index) => (
            <div
              aria-label={`${row.route} ${heatmapPeriods[index]} 平均上座率 ${value}%`}
              className="grid h-14 place-items-center rounded-lg border border-white/10 text-sm font-black text-white shadow-inner"
              key={`${row.route}-${heatmapPeriods[index]}`}
              role="img"
              style={{ backgroundColor: heatColor(value) }}
            >{value}%</div>
          )),
        ])}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-end gap-3 text-xs text-admin-muted">
        <span>低需求</span><span className="h-3 w-16 rounded-full bg-gradient-to-r from-blue-400/30 via-emerald-400/60 to-red-400" /><span>高需求</span>
      </div>
    </div>
  );
}

function NoShowChart() {
  const max = Math.max(...noShowRates.map((item) => item.rate));
  return (
    <div className="space-y-3">
      {noShowRates.map((item, index) => (
        <div className="grid grid-cols-[6.5rem_minmax(0,1fr)_3.5rem] items-center gap-3" key={item.label}>
          <span className="truncate text-xs font-bold text-admin-softText">{item.label}</span>
          <div className="h-7 overflow-hidden rounded-md bg-admin-bg/70">
            <div className={`h-full rounded-md ${index < 2 ? "bg-red-400" : "bg-amber-300"}`} style={{ width: `${(item.rate / max) * 100}%` }} />
          </div>
          <span className="text-right text-sm font-black text-admin-text">{item.rate}%</span>
        </div>
      ))}
    </div>
  );
}

function CancellationHistogram() {
  const max = Math.max(...cancellationBuckets.map((item) => item.count));
  return (
    <div className="overflow-x-auto">
      <div className="flex h-64 min-w-[42rem] items-end gap-3 border-b border-admin-borderStrong px-2">
        {cancellationBuckets.map((item, index) => (
          <div className="flex min-w-0 flex-1 flex-col items-center" key={item.label}>
            <span className="mb-2 text-sm font-black text-admin-text">{item.count}</span>
            <div className={`w-full max-w-16 rounded-t-md ${index === 0 ? "bg-red-400" : "bg-sky-400"}`} style={{ height: `${(item.count / max) * 180}px` }} />
            <span className="flex h-12 items-center text-center text-[10px] leading-3 text-admin-muted">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChannelShareChart() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-xs font-bold text-admin-muted"><span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-adminStatus-enabled" />WEB</span><span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-amber-300" />電話</span></div>
      {channelShares.map((item) => (
        <div className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3" key={item.route}>
          <span className="font-black text-admin-softText">{item.route}</span>
          <div className="flex h-10 overflow-hidden rounded-adminControl bg-admin-bg" role="img" aria-label={`${item.route} WEB ${item.web}%，電話 ${item.phone}%`}>
            <div className="grid place-items-center bg-adminStatus-enabled text-xs font-black text-admin-bg" style={{ width: `${item.web}%` }}>WEB {item.web}%</div>
            <div className="grid place-items-center bg-amber-300 text-xs font-black text-slate-900" style={{ width: `${item.phone}%` }}>{item.phone >= 25 ? `電話 ${item.phone}%` : `${item.phone}%`}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ManagementAnalytics() {
  return (
    <div className="space-y-5">
      <AnalyticsCard badge="近 8 週｜全預約通路" description="路線 × 發車時段的平均預約上座率；藍色為低需求、紅色為接近滿載。" hypothesis="H4" insight="1573 在 06–08 與 14–16 長期偏冷，可優先測試減班；1571 晚尖峰持續高載，適合加密班距。" title="需求熱力圖">
        <EmptyChartGrid><DemandHeatmap /></EmptyChartGrid>
      </AnalyticsCard>

      <AnalyticsCard badge="口徑：僅 WEB 單人預約" description="依班次 no-show 率由高至低排列；排除電話、多人成行與營運取消。" hypothesis="H5" insight="no-show 呈現長尾，問題集中在 1572 08:00 與 1573 14:00；先對這兩班增加核銷提醒，不需全面改流程。" title="No-show 率排行">
        <EmptyChartGrid><NoShowChart /></EmptyChartGrid>
      </AnalyticsCard>

      <AnalyticsCard badge="已排除營運取消" description="取消發生時間距離發車時間的分布；颱風、停班與調度取消不納入。" hypothesis="H6" insight="最後一小時取消占比最高，座位通常來不及再售；可據此評估候補名單與發車前遞補通知。" title="取消提前量分布">
        <EmptyChartGrid><CancellationHistogram /></EmptyChartGrid>
      </AnalyticsCard>

      <AnalyticsCard badge="近 30 日｜依路線" description="每條路線的 WEB 與電話建立預約座位占比，使用百分比堆疊呈現。" hypothesis="H7" insight="1573 電話占比達 57%，是電話轉 WEB 的第一優先路線；1571 已具備較成熟的數位客群。" title="WEB vs 電話通路占比">
        <EmptyChartGrid><ChannelShareChart /></EmptyChartGrid>
      </AnalyticsCard>

      <AnalyticsCard badge="口徑：LINE 8 碼｜WEB 為主" description="依乘客首次預約月份分 cohort，追蹤之後每月仍有預約的乘客比例。" hypothesis="H8" insight="各 cohort 的 M1 留存約 55–63%，M3 仍有約四成回流，已具備常客經營基礎；可再用 RFM 細分推播對象。" title="乘客世代留存曲線">
        <EmptyChartGrid><LineChart ariaLabel="各月份首次預約乘客的月留存率" labels={retentionMonths} series={retentionSeries} /></EmptyChartGrid>
      </AnalyticsCard>
    </div>
  );
}
