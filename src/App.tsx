import { useEffect, useMemo, useState } from "react";
import busHero from "./assets/bus-main.png";
import busSide from "./assets/bus-side.png";
import { BookingForm } from "./components/BookingForm";
import { MemberCard } from "./components/MemberCard";
import { ScheduleList } from "./components/ScheduleList";
import { SuccessModal } from "./components/SuccessModal";
import { AuthProfile, getAuthProfile } from "./api/auth";
import { createReservation } from "./api/reservations";
import { getSchedules } from "./api/schedules";
import { getAvailableDates, passengerProfile, routes } from "./data/mockData";
import type {
  BookingSelection,
  OpenSchedule,
  ReservationResult,
  TimePeriod,
} from "./types/reservation";
import { initLiff, LiffProfile } from "./liff/liffClient";

const route = routes[0];
const defaultPickupStopId = "440e3872-ea19-44f2-b27e-1db0bc9702c7";

const getPeriod = (time: string): TimePeriod => {
  const hour = Number(time.split(":")[0]);

  if (hour < 12) return "MORNING";
  if (hour < 18) return "AFTERNOON";
  return "EVENING";
};

const formatDateTime = (value: string | Date) => {
  return new Intl.DateTimeFormat("zh-TW", {
    dateStyle: "short",
    timeStyle: "short",
    hour12: false,
  }).format(new Date(value));
};

function App() {
  const availableDates = useMemo(() => getAvailableDates(), []);
  const [liffProfile, setLiffProfile] = useState<LiffProfile | null>(null);
  const [liffLoading, setLiffLoading] = useState(true);
  const [liffError, setLiffError] = useState("");
  const [authProfile, setAuthProfile] = useState<AuthProfile | null>(null);
  const [authProfileError, setAuthProfileError] = useState("");

  const [selection, setSelection] = useState<BookingSelection>({
    routeId: route.routeId,
    pickupStopId: defaultPickupStopId,
    openDate: availableDates[0].value,
    timePeriod: "ALL",
  });
  const [schedules, setSchedules] = useState<OpenSchedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [schedulesError, setSchedulesError] = useState("");
  const [canReserve, setCanReserve] = useState(true);
  const [reservationError, setReservationError] = useState("");
  const [reservingScheduleId, setReservingScheduleId] = useState<string | null>(
    null,
  );

  const [reservationResult, setReservationResult] =
    useState<ReservationResult | null>(null);

  const filteredSchedules = useMemo(() => {
    return schedules
      .filter(
        (schedule) =>
          selection.timePeriod === "ALL" ||
          getPeriod(schedule.departureTime) === selection.timePeriod,
      )
      .sort((a, b) => a.departureTime.localeCompare(b.departureTime));
  }, [schedules, selection.timePeriod]);

  const displayPassengerProfile = {
    ...passengerProfile,
    userId: authProfile?.userId ?? passengerProfile.userId,
    displayName:
      authProfile?.displayName ??
      liffProfile?.displayName ??
      passengerProfile.displayName,
    pictureUrl: liffProfile?.pictureUrl ?? "",
    lineUserId: liffProfile?.lineUserId ?? passengerProfile.userId,
    activeCode: authProfile?.activeCode ?? passengerProfile.activeCode,
    phoneNumber: authProfile?.phone ?? passengerProfile.phoneNumber,
    email: authProfile?.email ?? passengerProfile.email,
    status: authProfile?.status ?? passengerProfile.status,
  };

  useEffect(() => {
    async function bootLiff() {
      try {
        const profile = await initLiff();

        if (profile) {
          setLiffProfile(profile);
        }
      } catch (error) {
        console.error("LIFF_INIT_ERROR:", error);

        const message =
          error instanceof Error ? error.message : "LINE LIFF 初始化失敗";

        setLiffError(message);
      } finally {
        setLiffLoading(false);
      }
    }

    bootLiff();
  }, []);

  useEffect(() => {
    async function loadAuthProfile() {
      if (!liffProfile?.lineUserId) return;

      try {
        setAuthProfileError("");

        const profile = await getAuthProfile(liffProfile.lineUserId);

        setAuthProfile(profile);
      } catch (error) {
        console.error("AUTH_PROFILE_ERROR:", error);

        const message =
          error instanceof Error ? error.message : "會員資料讀取失敗";

        setAuthProfileError(message);
      }
    }

    loadAuthProfile();
  }, [liffProfile?.lineUserId]);

  const loadSchedules = async () => {
    if (liffLoading || !liffProfile?.lineUserId) return;

    try {
      setSchedulesLoading(true);
      setSchedulesError("");

      const result = await getSchedules({
        date: selection.openDate,
        pickupStopId: selection.pickupStopId,
        lineUserId: liffProfile.lineUserId,
      });

      setSchedules(result.schedules);
      setCanReserve(result.canReserve);
    } catch (error) {
      console.error("SCHEDULES_ERROR:", error);

      const message =
        error instanceof Error ? error.message : "班次資料讀取失敗";

      setSchedules([]);
      setCanReserve(false);
      setSchedulesError(message);
    } finally {
      setSchedulesLoading(false);
    }
  };

  useEffect(() => {
    let isCurrent = true;

    async function loadCurrentSchedules() {
      if (liffLoading || !liffProfile?.lineUserId) return;

      try {
        setSchedulesLoading(true);
        setSchedulesError("");

        const result = await getSchedules({
          date: selection.openDate,
          pickupStopId: selection.pickupStopId,
          lineUserId: liffProfile.lineUserId,
        });

        if (!isCurrent) return;

        setSchedules(result.schedules);
        setCanReserve(result.canReserve);
      } catch (error) {
        if (!isCurrent) return;

        console.error("SCHEDULES_ERROR:", error);

        const message =
          error instanceof Error ? error.message : "班次資料讀取失敗";

        setSchedules([]);
        setCanReserve(false);
        setSchedulesError(message);
      } finally {
        if (isCurrent) {
          setSchedulesLoading(false);
        }
      }
    }

    loadCurrentSchedules();

    return () => {
      isCurrent = false;
    };
  }, [
    liffLoading,
    liffProfile?.lineUserId,
    selection.openDate,
    selection.pickupStopId,
  ]);

  const handleReserve = async (schedule: OpenSchedule) => {
    if (!liffProfile?.lineUserId) {
      setReservationError("無法取得 LINE 使用者資料，請重新開啟頁面。");
      return;
    }

    if (!authProfile?.userId) {
      setReservationError("會員資料尚未載入完成，請稍後再試。");
      return;
    }

    try {
      setReservationError("");
      setReservingScheduleId(schedule.dailyOpenScheduleId);

      const reservation = await createReservation({
        userId: authProfile.userId,
        routeId: schedule.routeId,
        departureTime: schedule.departureTime,
        openDate: schedule.openDate,
        pickupStopId: selection.pickupStopId,
        lineUserId: liffProfile.lineUserId,
      });

      setReservationResult({
        reservationId: reservation.reservationId,
        scheduleCode: `${reservation.routeNumber}-${reservation.departureTime.slice(
          0,
          5,
        )}`,
        departureTime: reservation.departureTime.slice(0, 5),
        openDate: reservation.openDate,
        pickupStopName: reservation.pickupStop.stopName,
        activeCode: displayPassengerProfile.activeCode,
        passengerName: displayPassengerProfile.displayName,
        bookedAt: formatDateTime(reservation.bookedAt),
        qrCode: reservation.qrCode,
      });

      await loadSchedules();
    } catch (error) {
      console.error("CREATE_RESERVATION_ERROR:", error);

      const message = error instanceof Error ? error.message : "預約建立失敗";

      setReservationError(message);
    } finally {
      setReservingScheduleId(null);
    }
  };

  if (liffLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bus-50 px-5 text-center">
        <div className="rounded-panel bg-white p-6 shadow-card ring-1 ring-bus-100">
          <p className="text-lg font-black text-ink-900">
            正在啟動 LINE 會員資料
          </p>
          <p className="mt-2 text-sm font-bold text-ink-500">請稍候</p>
        </div>
      </div>
    );
  }

  if (liffError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bus-50 px-5 text-center">
        <div className="rounded-panel bg-white p-6 shadow-card ring-1 ring-coral/20">
          <p className="text-lg font-black text-coral">{liffError}</p>
          <p className="mt-2 text-sm font-bold text-ink-500">
            請確認 LIFF ID 與 Endpoint URL 是否正確。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d7f3ff_0,#f7fbff_35%,#fff8e6_100%)] px-4 py-4 text-ink-900 md:px-6 md:py-8">
        <div className="mx-auto w-full max-w-[820px]">
          <header className="hidden overflow-hidden rounded-panel bg-bus-900 text-white shadow-soft ring-1 ring-white/60">
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
            <MemberCard passenger={displayPassengerProfile} route={route} />

            {authProfileError && (
              <div className="rounded-panel bg-white p-4 text-sm font-bold text-coral shadow-card ring-1 ring-coral/20">
                {authProfileError}
              </div>
            )}

            <section className="hidden overflow-hidden rounded-panel bg-white shadow-card ring-1 ring-bus-100/80">
              <div className="grid md:grid-cols-[180px_1fr] md:items-center">
                <img
                  src={busSide}
                  alt="Capital Star 車側視覺"
                  className="h-40 w-full object-cover md:h-full"
                />
                <div className="p-5 md:p-6">
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-bus-600">
                    Route Preview
                  </p>
                  <h2 className="mt-1 text-xl font-black text-ink-900">
                    {route.routeName}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-ink-500">
                    {route.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {route.stops.map((stop) => (
                      <span
                        key={stop.stopId}
                        className="rounded-full bg-bus-50 px-3 py-1 text-xs font-black text-bus-700 ring-1 ring-bus-100"
                      >
                        {stop.shortLabel}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <BookingForm
              stops={route.stops}
              dates={availableDates}
              selection={selection}
              onChange={setSelection}
            />

            <ScheduleList
              schedules={filteredSchedules}
              isLoading={schedulesLoading}
              errorMessage={schedulesError}
              reservationErrorMessage={reservationError}
              canReserve={canReserve}
              reservingScheduleId={reservingScheduleId}
              onReserve={handleReserve}
            />
          </div>
        </div>

        <SuccessModal
          result={reservationResult}
          onClose={() => setReservationResult(null)}
        />
      </main>
    </div>
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
