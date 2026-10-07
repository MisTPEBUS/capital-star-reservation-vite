import { useState } from "react";
import { BookingForm } from "../components/BookingForm";
import { GpsCoordinatesCard } from "../components/GpsCoordinatesCard";
import { ReservationDialog } from "../components/ReservationDialog";
import { ScheduleList } from "../components/ScheduleList";
import { SystemGuideDialog, type SystemGuideStep } from "../components/SystemGuideDialog";
import { demoDates, demoSchedules, demoStops } from "../data/systemGuideDemo";
import { useGeolocation } from "../hooks/useGeolocation";
import type { BookingSelection, ReservationResult } from "../types/reservation";
import guideSearch from "../assets/guide-search.svg";
import guideSchedule from "../assets/guide-schedule.svg";
import guideTicket from "../assets/guide-ticket.svg";

const guideSteps: SystemGuideStep[] = [
  { imageSrc: guideSearch, imageAlt: "系統說明：選擇上車站和搭乘日期，搜尋可預約班次。" },
  { imageSrc: guideSchedule, imageAlt: "系統說明：選擇合適的班次並確認預約資料。" },
  { imageSrc: guideTicket, imageAlt: "系統說明：預約完成後查看乘車憑證。" },
];

const initialSelection: BookingSelection = {
  routeId: "demo-route",
  pickupStopId: demoStops[0].stopId,
  openDate: demoDates[0].value,
  timePeriod: "ALL",
};

const getTimePeriod = (departureTime: string) => {
  const hour = Number(departureTime.slice(0, 2));
  if (hour < 12) return "MORNING";
  if (hour < 18) return "AFTERNOON";
  return "EVENING";
};

export function SystemGuideDemoPage() {
  const [isGuideOpen, setIsGuideOpen] = useState(true);
  const [selection, setSelection] = useState<BookingSelection>(initialSelection);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [reservationResult, setReservationResult] = useState<ReservationResult | null>(null);
  const geolocation = useGeolocation();

  const filteredSchedules = demoSchedules.filter((schedule) =>
    schedule.openDate === selection.openDate &&
    schedule.pickupStopIds.includes(selection.pickupStopId) &&
    (selection.timePeriod === "ALL" || getTimePeriod(schedule.departureTime) === selection.timePeriod),
  );
  const selectedSchedule = filteredSchedules.find((schedule) => schedule.dailyOpenScheduleId === selectedScheduleId) ?? null;
  const pickupStopName = demoStops.find((stop) => stop.stopId === selection.pickupStopId)?.stopName ?? "";
  const hasReservationOnSelectedDate = reservationResult?.openDate === selection.openDate;

  const handleConfirm = (name: string, passengerCount: number) => {
    if (!selectedSchedule || !pickupStopName) return;

    setReservationResult({
      reservationId: `demo-${Date.now()}`,
      scheduleCode: selectedSchedule.scheduleCode,
      departureTime: selectedSchedule.departureTime,
      openDate: selectedSchedule.openDate,
      pickupStopName,
      activeCode: "DEMO1234",
      passengerName: name,
      passengerCount,
      bookedAt: new Intl.DateTimeFormat("zh-TW", { dateStyle: "short", timeStyle: "short", hour12: false }).format(new Date()),
    });
    setIsReservationOpen(false);
    setSelectedScheduleId(null);
  };

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top_left,#d7f3ff_0,#f7fbff_35%,#fff8e6_100%)] px-3 py-5 pb-32 text-ink-900 md:px-4">
      <div className="mx-auto grid w-full max-w-[820px] gap-4">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-panel bg-bus-900 px-5 py-5 text-white shadow-card md:px-7">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-star-300">CAPITAL STAR</p>
            <h1 className="mt-1 text-2xl font-black">首都之星預約服務</h1>
            <p className="mt-1 text-sm text-bus-100">預約首頁操作示範</p>
          </div>
          <button type="button" onClick={() => setIsGuideOpen(true)} className="min-h-11 rounded-xl bg-white px-4 font-bold text-bus-900 transition hover:bg-bus-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-star-300">
            查看系統說明
          </button>
        </header>

        <section className="rounded-panel border-2 border-star-300 bg-cream p-4 shadow-card md:p-5">
          <h2 className="text-lg font-black text-bus-900">預約須知</h2>
          <p className="mt-2 text-base font-bold leading-7 text-ink-800">
            此頁為操作示範。請選擇上車地點、日期與班次，再按下預約按鈕體驗完整流程。預約資料只存在此頁面，不會建立正式預約。
          </p>
        </section>

        <section className="rounded-panel bg-white p-5 shadow-card ring-1 ring-bus-100 md:p-6">
          <p className="text-xs font-black tracking-widest text-bus-600">示範乘客</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-2xl font-black text-ink-900">王小明</h2>
              <p className="mt-1 text-sm font-bold text-ink-500">宜蘭 — 五結旅遊線</p>
            </div>
            <span className="rounded-full bg-bus-50 px-3 py-1 text-sm font-bold text-bus-700">識別碼 DEMO1234</span>
          </div>
        </section>

        <section className="rounded-panel bg-white p-5 shadow-card ring-1 ring-bus-100 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-ink-900">裝置 GPS 定位</h2>
              <p className="mt-1 text-sm text-ink-500">使用瀏覽器取得裝置目前位置。</p>
            </div>
            <button
              type="button"
              disabled={geolocation.state.status === "loading"}
              onClick={() => { void geolocation.requestPosition().catch(() => undefined); }}
              className="min-h-11 rounded-xl bg-bus-500 px-4 font-bold text-white transition hover:bg-bus-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bus-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
            >
              {geolocation.state.status === "loading" ? "定位中…" : "取得目前位置"}
            </button>
          </div>
          <div aria-live="polite" className="mt-3 text-sm font-bold text-ink-700">
            {geolocation.state.status === "idle" && "點選按鈕後，瀏覽器會請求定位權限。"}
            {geolocation.state.status === "loading" && "正在讀取裝置位置…"}
            {geolocation.state.status === "success" && `緯度 ${geolocation.state.latitude.toFixed(6)}、經度 ${geolocation.state.longitude.toFixed(6)}（精確度約 ${Math.round(geolocation.state.accuracy)} 公尺）`}
          </div>
          <GpsCoordinatesCard state={geolocation.state} />
        </section>

        {reservationResult && (
          <section role="status" className="rounded-panel border border-bus-100 bg-bus-50 p-5 shadow-card">
            <h2 className="text-xl font-black text-bus-900">示範預約成功</h2>
            <p className="mt-2 font-bold text-ink-800">
              {reservationResult.openDate} {reservationResult.departureTime} · {reservationResult.pickupStopName} · {reservationResult.passengerName}
            </p>
            <p className="mt-1 text-sm text-ink-500">這是模擬結果，不會產生真正的乘車憑證。</p>
            <button type="button" onClick={() => setReservationResult(null)} className="mt-3 rounded-xl border border-bus-500 bg-white px-4 py-2 font-bold text-bus-700 hover:bg-bus-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bus-500">
              重設示範預約
            </button>
          </section>
        )}

        <BookingForm
          stops={demoStops}
          dates={demoDates}
          selection={selection}
          onChange={(next) => { setSelection(next); setSelectedScheduleId(null); }}
        />
        <ScheduleList
          schedules={filteredSchedules}
          selectedScheduleId={selectedScheduleId}
          canReserve={!hasReservationOnSelectedDate}
          unavailableReason="ACTIVE_RESERVATION"
          onSelect={(schedule) => setSelectedScheduleId(schedule.dailyOpenScheduleId)}
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-bus-100 bg-white/95 px-4 py-3 shadow-[0_-12px_30px_rgba(7,43,80,0.12)] backdrop-blur">
        <div className="mx-auto grid w-full max-w-[820px] grid-cols-[1fr_132px] items-center gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black text-ink-500">已選班次</p>
            <p className="truncate text-lg font-black text-ink-900">
              {selectedSchedule ? `${selectedSchedule.openDate} ${selectedSchedule.departureTime}` : "請選擇搭乘時間"}
            </p>
          </div>
          <button
            type="button"
            disabled={!selectedSchedule || hasReservationOnSelectedDate}
            onClick={() => setIsReservationOpen(true)}
            className="h-12 rounded-2xl bg-bus-900 px-4 text-lg font-black text-white shadow-card transition hover:bg-bus-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bus-100 disabled:cursor-not-allowed disabled:bg-ink-100 disabled:text-ink-400 disabled:shadow-none"
          >
            {hasReservationOnSelectedDate ? "已預約" : "確認預約"}
          </button>
        </div>
      </div>

      <SystemGuideDialog open={isGuideOpen} onOpenChange={setIsGuideOpen} steps={guideSteps} />
      <ReservationDialog
        open={isReservationOpen}
        onOpenChange={setIsReservationOpen}
        schedule={selectedSchedule}
        pickupStopName={pickupStopName}
        passengerName="王小明"
        onConfirm={handleConfirm}
      />
    </main>
  );
}
