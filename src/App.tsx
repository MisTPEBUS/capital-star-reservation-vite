import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import busHero from "./assets/bus-main.png";
import busSide from "./assets/bus-side.png";
import {
  BookingForm,
  type BookingSelectionChangeSource,
} from "./components/BookingForm";
import { MemberCard } from "./components/MemberCard";
import { ScheduleList } from "./components/ScheduleList";
import { SuccessModal } from "./components/SuccessModal";
import { UpcomingReservationCard } from "./components/UpcomingReservationCard";
import {
  AuthProfile,
  getPreferredProfileName,
  getAuthProfile,
  isProfileRegistrationRequired,
} from "./api/auth";
import {
  createReservation,
  getUpcomingReservations,
  UpcomingReservation,
} from "./api/reservations";
import { getSchedules } from "./api/schedules";
import { type AdminStop, getStops } from "./api/admin/stops";
import { getAvailableDates, passengerProfile } from "./data/mockData";
import type {
  BookingSelection,
  OpenSchedule,
  PickupStop,
  ReservationResult,
  RouteInfo,
  TimePeriod,
} from "./types/reservation";
import { initLiff, LiffProfile } from "./liff/liffClient";

const route: RouteInfo = {
  routeId: "route_yilan_wujie",
  routeNumber: "1571",
  routeName: "宜蘭 — 五結旅遊線",
  description: "Capital Star 藍色旅遊車款，適合活動接駁與景點預約。",
  stops: [],
};

const toPickupStop = (stop: AdminStop): PickupStop => ({
  stopId: stop.stopId,
  stopName: stop.stopName,
  stopType: stop.stopType === "STATION" ? "MAIN_STATION" : "ROADSIDE",
  address: stop.address ?? "",
  shortLabel: stop.stopName,
});

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

const getReservationDepartureTimestamp = (reservation: UpcomingReservation) => {
  const dateMatch = reservation.openDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const timeMatch = reservation.departureTime.match(/^(\d{1,2}):(\d{2})/);

  if (!dateMatch || !timeMatch) return Number.NaN;

  const [, year, month, day] = dateMatch;
  const [, hour, minute] = timeMatch;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  ).getTime();
};

function App() {
  const navigate = useNavigate();
  const availableDates = useMemo(() => getAvailableDates(), []);
  const [liffProfile, setLiffProfile] = useState<LiffProfile | null>(null);
  const [liffLoading, setLiffLoading] = useState(true);
  const [liffError, setLiffError] = useState("");
  const [authProfile, setAuthProfile] = useState<AuthProfile | null>(null);
  const [authProfileError, setAuthProfileError] = useState("");
  const [upcomingReservations, setUpcomingReservations] = useState<
    UpcomingReservation[]
  >([]);
  const [pickupStops, setPickupStops] = useState<PickupStop[]>([]);
  const [pickupStopsLoading, setPickupStopsLoading] = useState(true);
  const [pickupStopsError, setPickupStopsError] = useState("");
  const [pickupStopsRetryKey, setPickupStopsRetryKey] = useState(0);

  const [selection, setSelection] = useState<BookingSelection>({
    routeId: route.routeId,
    pickupStopId: "",
    openDate: availableDates[0].value,
    timePeriod: "ALL",
  });
  const [schedules, setSchedules] = useState<OpenSchedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [schedulesError, setSchedulesError] = useState("");
  const [canReserve, setCanReserve] = useState(true);
  const [reservationError, setReservationError] = useState("");
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null,
  );
  const [pendingScrollTarget, setPendingScrollTarget] = useState<
    "time" | "schedules" | null
  >(null);
  const [isScheduleControlsVisible, setIsScheduleControlsVisible] =
    useState(false);
  const [reservingScheduleId, setReservingScheduleId] = useState<string | null>(
    null,
  );

  const [reservationResult, setReservationResult] =
    useState<ReservationResult | null>(null);

  useEffect(() => {
    document.title = "預約首頁 — Capital Star";
  }, []);

  const displayRoute = useMemo<RouteInfo>(
    () => ({
      ...route,
      stops: pickupStops,
    }),
    [pickupStops],
  );

  const filteredSchedules = useMemo(() => {
    return schedules
      .filter(
        (schedule) =>
          selection.timePeriod === "ALL" ||
          getPeriod(schedule.departureTime) === selection.timePeriod,
      )
      .sort((a, b) => a.departureTime.localeCompare(b.departureTime));
  }, [schedules, selection.timePeriod]);

  const activeUpcomingReservation = useMemo(() => {
    const now = Date.now();

    return (
      upcomingReservations.find(
        (reservation) =>
          reservation.status === "RESERVED" &&
          getReservationDepartureTimestamp(reservation) > now,
      ) ?? null
    );
  }, [upcomingReservations]);

  const selectedSchedule = useMemo(
    () =>
      filteredSchedules.find(
        (schedule) => schedule.dailyOpenScheduleId === selectedScheduleId,
      ) ?? null,
    [filteredSchedules, selectedScheduleId],
  );

  useEffect(() => {
    if (
      selectedScheduleId &&
      !filteredSchedules.some(
        (schedule) => schedule.dailyOpenScheduleId === selectedScheduleId,
      )
    ) {
      setSelectedScheduleId(null);
    }
  }, [filteredSchedules, selectedScheduleId]);

  useEffect(() => {
    if (!pendingScrollTarget || schedulesLoading) return;

    const hasSchedules =
      pendingScrollTarget === "time"
        ? schedules.length > 0
        : filteredSchedules.length > 0;

    if (!schedulesError && hasSchedules) {
      const targetId =
        pendingScrollTarget === "time" ? "booking-time" : "schedule-list";

      window.setTimeout(() => {
        document
          .getElementById(targetId)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }

    setPendingScrollTarget(null);
  }, [
    filteredSchedules.length,
    pendingScrollTarget,
    schedules.length,
    schedulesError,
    schedulesLoading,
  ]);

  useEffect(() => {
    const updateScheduleControlsVisibility = () => {
      const scheduleList = document.getElementById("schedule-list");

      if (!scheduleList) {
        setIsScheduleControlsVisible(false);
        return;
      }

      const rect = scheduleList.getBoundingClientRect();
      setIsScheduleControlsVisible(rect.top <= window.innerHeight * 0.55);
    };

    updateScheduleControlsVisibility();
    window.addEventListener("scroll", updateScheduleControlsVisibility, {
      passive: true,
    });
    window.addEventListener("resize", updateScheduleControlsVisibility);

    return () => {
      window.removeEventListener("scroll", updateScheduleControlsVisibility);
      window.removeEventListener("resize", updateScheduleControlsVisibility);
    };
  }, []);

  const displayPassengerProfile = {
    ...passengerProfile,
    userId: authProfile?.userId ?? passengerProfile.userId,
    displayName: authProfile
      ? getPreferredProfileName(
          authProfile,
          liffProfile?.displayName ?? passengerProfile.displayName,
        )
      : (liffProfile?.displayName ?? passengerProfile.displayName),
    firstName: authProfile?.firstName ?? null,
    sex: authProfile?.sex ?? null,
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
    let isCurrent = true;

    async function loadPickupStops() {
      try {
        setPickupStopsLoading(true);
        setPickupStopsError("");

        const stops = await getStops();
        const activeStops = stops
          .filter((stop) => stop.status === "ACTIVE")
          .map(toPickupStop);

        if (!isCurrent) return;

        setPickupStops(activeStops);
        setSelection((current) => {
          const hasCurrentStop = activeStops.some(
            (stop) => stop.stopId === current.pickupStopId,
          );

          return {
            ...current,
            pickupStopId: hasCurrentStop
              ? current.pickupStopId
              : (activeStops[0]?.stopId ?? ""),
          };
        });
      } catch (error) {
        if (!isCurrent) return;

        console.error("PICKUP_STOPS_ERROR:", error);

        const message =
          error instanceof Error ? error.message : "上車站資料讀取失敗";

        setPickupStops([]);
        setSelection((current) => ({ ...current, pickupStopId: "" }));
        setPickupStopsError(message);
      } finally {
        if (isCurrent) {
          setPickupStopsLoading(false);
        }
      }
    }

    loadPickupStops();

    return () => {
      isCurrent = false;
    };
  }, [pickupStopsRetryKey]);

  useEffect(() => {
    async function loadAuthProfile() {
      if (!liffProfile?.lineUserId) return;

      try {
        setAuthProfileError("");

        const profile = await getAuthProfile(liffProfile.lineUserId);

        if (isProfileRegistrationRequired(profile)) {
          navigate("/register", {
            replace: true,
            state: { returnTo: "/" },
          });
          return;
        }

        setAuthProfile(profile);
      } catch (error) {
        console.error("AUTH_PROFILE_ERROR:", error);

        const message =
          error instanceof Error ? error.message : "會員資料讀取失敗";

        setAuthProfileError(message);
      }
    }

    loadAuthProfile();
  }, [liffProfile?.lineUserId, navigate]);

  const loadUpcomingReservations = async (userId: string) => {
    try {
      const reservations = await getUpcomingReservations(userId);
      setUpcomingReservations(reservations);
    } catch (error) {
      console.error("UPCOMING_RESERVATIONS_ERROR:", error);
      setUpcomingReservations([]);
    }
  };

  useEffect(() => {
    let isCurrent = true;

    async function loadCurrentUpcomingReservations() {
      if (!authProfile?.userId) {
        setUpcomingReservations([]);
        return;
      }

      try {
        const reservations = await getUpcomingReservations(authProfile.userId);

        if (isCurrent) {
          setUpcomingReservations(reservations);
        }
      } catch (error) {
        if (!isCurrent) return;

        console.error("UPCOMING_RESERVATIONS_ERROR:", error);
        setUpcomingReservations([]);
      }
    }

    loadCurrentUpcomingReservations();

    return () => {
      isCurrent = false;
    };
  }, [authProfile?.userId]);

  const loadSchedules = async () => {
    if (liffLoading || !liffProfile?.lineUserId || !selection.pickupStopId) {
      setSchedules([]);
      setCanReserve(false);
      return;
    }

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
      if (liffLoading || !liffProfile?.lineUserId || !selection.pickupStopId) {
        setSchedules([]);
        setCanReserve(false);
        return;
      }

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
        scheduleCode: `${reservation.routeNumber}`,
        departureTime: reservation.departureTime.slice(0, 5),
        openDate: reservation.openDate,
        pickupStopName: reservation.pickupStop.stopName,
        activeCode: displayPassengerProfile.activeCode,
        passengerName: displayPassengerProfile.displayName,
        bookedAt: formatDateTime(reservation.bookedAt),
        qrCode: reservation.qrCode,
      });

      setSelectedScheduleId(null);

      await Promise.all([
        loadSchedules(),
        loadUpcomingReservations(authProfile.userId),
      ]);
    } catch (error) {
      console.error("CREATE_RESERVATION_ERROR:", error);

      const message = error instanceof Error ? error.message : "預約建立失敗";

      setReservationError(message);
    } finally {
      setReservingScheduleId(null);
    }
  };

  const handleBookingSelectionChange = (
    nextSelection: BookingSelection,
    source: BookingSelectionChangeSource,
  ) => {
    const hasScheduleQueryChanged =
      nextSelection.openDate !== selection.openDate ||
      nextSelection.pickupStopId !== selection.pickupStopId;

    setSelectedScheduleId(null);
    if (hasScheduleQueryChanged) {
      setSchedules([]);
      setSchedulesLoading(true);
    }
    setPendingScrollTarget(
      source === "date" ? "time" : source === "time" ? "schedules" : null,
    );
    setSelection(nextSelection);
  };

  const isReserveButtonDisabled =
    Boolean(activeUpcomingReservation) ||
    !selectedSchedule ||
    !canReserve ||
    reservingScheduleId !== null;

  const reserveButtonText = activeUpcomingReservation
    ? "已預約"
    : reservingScheduleId
      ? "處理中"
      : "預約";

  const scrollToPickup = () => {
    document
      .getElementById("booking-pickup")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
          <p className="text-lg font-black text-coral">
            無法載入，請透過 LINE 重新開啟此頁面。
          </p>
          <p className="mt-2 text-sm font-bold text-ink-500">
            若問題持續發生，請聯繫客服。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d7f3ff_0,#f7fbff_35%,#fff8e6_100%)] px-3 py-3 text-ink-900 md:px-4 md:py-5">
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
                  <HeroMetric label="路線" value={displayRoute.routeNumber} />
                  <HeroMetric
                    label="站點"
                    value={`${displayRoute.stops.length}`}
                  />
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

          <div className="mt-4 grid gap-3 pb-32 md:gap-4">
            <MemberCard
              passenger={displayPassengerProfile}
              route={displayRoute}
              onEditProfile={() =>
                navigate("/register", {
                  state: { returnTo: "/" },
                })
              }
            />
            <UpcomingReservationCard
              reservation={activeUpcomingReservation}
              userId={authProfile?.userId ?? null}
              identityCode={displayPassengerProfile.activeCode}
              passengerName={displayPassengerProfile.displayName}
              onCancelled={async () => {
                if (authProfile?.userId) {
                  await loadUpcomingReservations(authProfile.userId);
                }
              }}
            />

            {authProfileError && (
              <div className="rounded-panel bg-white p-3 text-sm font-bold text-coral shadow-card ring-1 ring-coral/20 md:p-4">
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
                    {displayRoute.routeName}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-ink-500">
                    {displayRoute.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {displayRoute.stops.map((stop) => (
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
              stops={pickupStops}
              dates={availableDates}
              selection={selection}
              onChange={handleBookingSelectionChange}
              isStopsLoading={pickupStopsLoading}
              stopsError={pickupStopsError}
              onRetryStops={() =>
                setPickupStopsRetryKey((current) => current + 1)
              }
            />

            <ScheduleList
              schedules={filteredSchedules}
              isLoading={schedulesLoading}
              errorMessage={schedulesError}
              reservationErrorMessage={reservationError}
              canReserve={canReserve}
              unavailableReason={
                activeUpcomingReservation ? "ACTIVE_RESERVATION" : "UNOPENED"
              }
              reservingScheduleId={reservingScheduleId}
              selectedScheduleId={selectedScheduleId}
              onRetry={loadSchedules}
              onSelect={(schedule) =>
                setSelectedScheduleId(schedule.dailyOpenScheduleId)
              }
            />
          </div>
        </div>

        <button
          type="button"
          aria-label="回到選擇上車地點"
          onClick={scrollToPickup}
          className={`fixed bottom-24 right-4 z-40 grid h-12 w-12 place-items-center rounded-full border border-bus-100 bg-white text-2xl font-black leading-none text-bus-700 shadow-lift transition hover:bg-bus-50 ${
            isScheduleControlsVisible
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-4 opacity-0"
          }`}
        >
          ↑
        </button>

        <div
          className={`fixed inset-x-0 bottom-0 z-40 border-t border-bus-100 bg-white/95 px-4 py-3 shadow-[0_-12px_30px_rgba(7,43,80,0.12)] backdrop-blur transition ${
            isScheduleControlsVisible
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-full opacity-0"
          }`}
        >
          {activeUpcomingReservation ? (
            <button
              type="button"
              disabled
              className="mx-auto block h-12 w-full max-w-[820px] cursor-not-allowed rounded-2xl bg-ink-100 px-4 text-lg font-black text-ink-400"
            >
              已預約
            </button>
          ) : (
            <div className="mx-auto grid w-full max-w-[820px] grid-cols-[1fr_132px] items-center gap-3">
              <div className="min-w-0">
                <p className="text-xs font-black text-ink-500">已選班次</p>
                <p className="truncate text-lg font-black text-ink-900">
                  {selectedSchedule
                    ? `${selectedSchedule.openDate} ${selectedSchedule.departureTime}`
                    : "請選擇搭乘時間"}
                </p>
              </div>
              <button
                type="button"
                disabled={isReserveButtonDisabled}
                onClick={() => {
                  if (selectedSchedule) {
                    void handleReserve(selectedSchedule);
                  }
                }}
                className={`h-12 rounded-2xl px-4 text-lg font-black outline-none transition focus-visible:ring-4 focus-visible:ring-bus-100 ${
                  isReserveButtonDisabled
                    ? "cursor-not-allowed bg-ink-100 text-ink-400"
                    : "bg-bus-900 text-white shadow-card hover:bg-bus-700 active:scale-[0.98]"
                }`}
              >
                {reserveButtonText}
              </button>
            </div>
          )}
        </div>

        <SuccessModal
          result={reservationResult}
          onClose={() => {
            setReservationResult(null);
            window.setTimeout(() => {
              document
                .getElementById("upcoming-reservation")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 0);
          }}
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
