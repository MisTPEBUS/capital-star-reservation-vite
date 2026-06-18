import { useMemo, useState } from 'react';
import busHero from './assets/bus-main.png';
import busSide from './assets/bus-side.png';
import { BookingForm } from './components/BookingForm';
import { MemberCard } from './components/MemberCard';
import { ScheduleList } from './components/ScheduleList';
import { SuccessModal } from './components/SuccessModal';
import { availableDates, openSchedules, passengerProfile, routes } from './data/mockData';
import type { BookingSelection, OpenSchedule, ReservationResult, TimePeriod } from './types/reservation';

const route = routes[0];

const getPeriod = (time: string): TimePeriod => {
  const hour = Number(time.split(':')[0]);

  if (hour < 12) return 'MORNING';
  if (hour < 18) return 'AFTERNOON';
  return 'EVENING';
};

const formatNow = () => {
  return new Intl.DateTimeFormat('zh-TW', {
    dateStyle: 'short',
    timeStyle: 'short',
    hour12: false,
  }).format(new Date());
};

function App() {
  const [selection, setSelection] = useState<BookingSelection>({
    routeId: route.routeId,
    pickupStopId: route.stops[0].stopId,
    openDate: availableDates[0].value,
    timePeriod: 'ALL',
  });

  const [reservationResult, setReservationResult] = useState<ReservationResult | null>(null);

  const filteredSchedules = useMemo(() => {
    return openSchedules
      .filter((schedule) => schedule.routeId === selection.routeId)
      .filter((schedule) => schedule.openDate === selection.openDate)
      .filter((schedule) => schedule.pickupStopIds.includes(selection.pickupStopId))
      .filter((schedule) => selection.timePeriod === 'ALL' || getPeriod(schedule.departureTime) === selection.timePeriod)
      .sort((a, b) => a.departureTime.localeCompare(b.departureTime));
  }, [selection]);

  const selectedStop = route.stops.find((stop) => stop.stopId === selection.pickupStopId) ?? route.stops[0];

  const handleReserve = (schedule: OpenSchedule) => {
    setReservationResult({
      reservationId: `RSV-${Date.now()}`,
      scheduleCode: schedule.scheduleCode,
      departureTime: schedule.departureTime,
      openDate: schedule.openDate,
      pickupStopName: selectedStop.stopName,
      activeCode: passengerProfile.activeCode,
      passengerName: passengerProfile.displayName,
      bookedAt: formatNow(),
    });
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d7f3ff_0,#f7fbff_35%,#fff8e6_100%)] px-4 py-4 text-ink-900 md:px-6 md:py-8">
      <div className="mx-auto w-full max-w-[820px]">
        <header className="overflow-hidden rounded-panel bg-bus-900 text-white shadow-soft ring-1 ring-white/60">
          <div className="grid gap-0 md:grid-cols-[1.08fr_0.92fr] md:items-stretch">
            <div className="p-5 md:p-7">
              <div className="inline-flex rounded-full bg-white/12 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-star-300 ring-1 ring-white/15">
                Capital Star Reservation
              </div>
              <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight md:text-4xl">
                旅遊預約訂購平台
              </h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-bus-100">
                手機與平板優先的預約介面。以藍色車身與黃色星形識別為主視覺，流程保持單頁完成。
              </p>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <HeroMetric label="路線" value={route.routeNumber} />
                <HeroMetric label="站點" value={`${route.stops.length}`} />
                <HeroMetric label="截止" value="18:00" />
              </div>
            </div>

            <div className="relative min-h-[210px] bg-gradient-to-br from-bus-600 to-bus-300 p-4 md:min-h-full">
              <div className="absolute right-4 top-4 h-16 w-16 rounded-full bg-star-300/90 blur-xl" />
              <img
                src={busHero}
                alt="Capital Star 藍色旅遊巴士"
                className="relative z-10 h-full min-h-[180px] w-full rounded-[24px] object-cover object-center shadow-lift ring-1 ring-white/30"
              />
            </div>
          </div>
        </header>

        <div className="mt-5 grid gap-5 pb-10">
          <MemberCard passenger={passengerProfile} route={route} />

          <section className="overflow-hidden rounded-panel bg-white shadow-card ring-1 ring-bus-100/80">
            <div className="grid md:grid-cols-[180px_1fr] md:items-center">
              <img src={busSide} alt="Capital Star 車側視覺" className="h-40 w-full object-cover md:h-full" />
              <div className="p-5 md:p-6">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-bus-600">Route Preview</p>
                <h2 className="mt-1 text-xl font-black text-ink-900">{route.routeName}</h2>
                <p className="mt-2 text-sm leading-6 text-ink-500">{route.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {route.stops.map((stop) => (
                    <span key={stop.stopId} className="rounded-full bg-bus-50 px-3 py-1 text-xs font-black text-bus-700 ring-1 ring-bus-100">
                      {stop.shortLabel}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <BookingForm stops={route.stops} dates={availableDates} selection={selection} onChange={setSelection} />

          <ScheduleList schedules={filteredSchedules} onReserve={handleReserve} />
        </div>
      </div>

      <SuccessModal result={reservationResult} onClose={() => setReservationResult(null)} />
    </main>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
      <p className="text-[11px] font-bold text-bus-100">{label}</p>
      <p className="mt-1 text-lg font-black text-star-300">{value}</p>
    </div>
  );
}

export default App;
