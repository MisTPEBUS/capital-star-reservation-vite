import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookingForm } from "./components/BookingForm";
import { ReservationDialog } from "./components/ReservationDialog";
import { ReservationRestrictionDialog } from "./components/ReservationRestrictionDialog";
import { MemberCard } from "./components/MemberCard";
import { ScheduleList } from "./components/ScheduleList";
import { SuccessModal } from "./components/SuccessModal";
import { AvailableTicketsMenu } from "./components/AvailableTicketsMenu";
import { ReservationActionBar } from "./components/features/reservation/ReservationActionBar";
import { MemberSessionStatus } from "./components/features/reservation/MemberSessionStatus";
import { UserCardEntry } from "./components/features/userCards/UserCardEntry";
import { UserCardGuideDialog } from "./components/features/userCards/UserCardGuideDialog";
import { useMemberSession } from "./hooks/useMemberSession";
import { usePickupStops } from "./hooks/usePickupStops";
import { useBookingSelection } from "./hooks/useBookingSelection";
import { useBookingSchedules } from "./hooks/useBookingSchedules";
import { useReservationHistory } from "./hooks/useReservationHistory";
import { useCreateReservation } from "./hooks/useCreateReservation";
import { useUserCards } from "./hooks/useUserCards";
import { useUserCardGuide } from "./hooks/useUserCardGuide";
import { openTicketInExternalBrowser } from "./liff/liffClient";
import {
  getDisplayPassengerProfile,
  getReservationPassengerName,
} from "./utils/memberProfile";
import type {
  BookingSelection,
  BookingSelectionChangeSource,
  RouteInfo,
} from "./types/reservation";

const route: RouteInfo = {
  routeId: "route_yilan_wujie",
  routeNumber: "1571",
  routeName: "宜蘭 — 五結旅遊線",
  description: "Capital Star 藍色旅遊車款，適合活動接駁與景點預約。",
  stops: [],
};

function App() {
  const navigate = useNavigate();
  const member = useMemberSession();
  const pickupStops = usePickupStops();
  const booking = useBookingSelection(
    route.routeId,
    pickupStops.stops,
    pickupStops.status,
    member.liffStatus === "success",
  );
  const schedules = useBookingSchedules({
    lineUserId: member.liffProfile?.lineUserId ?? null,
    openDate: booking.selection.openDate,
    pickupStopId: booking.selection.pickupStopId,
    timePeriod: booking.selection.timePeriod,
  });
  const history = useReservationHistory(member.authProfile?.userId ?? null);
  const reservation = useCreateReservation({
    lineUserId: member.liffProfile?.lineUserId ?? null,
    userId: member.authProfile?.userId ?? null,
    pickupStopId: booking.selection.pickupStopId,
    activeCode: member.authProfile?.activeCode ?? "",
  });
  const userCards = useUserCards({
    enabled: Boolean(member.authProfile?.userId),
  });
  const userCardGuide = useUserCardGuide(
    userCards.status === "success" && userCards.cards.length === 0,
  );

  useEffect(() => {
    document.title = "預約首頁 — Capital Star";
  }, []);

  useEffect(() => {
    const target = booking.pendingScrollTarget;
    if (!target || schedules.status === "loading") return;

    const hasSchedules =
      target === "schedules"
        ? schedules.filteredSchedules.length > 0
        : schedules.schedules.length > 0;
    const targetId =
      target === "date"
        ? "booking-date"
        : target === "time"
          ? "booking-time"
          : "schedule-list";
    const timer =
      schedules.status === "success" && hasSchedules
        ? window.setTimeout(() => {
            document
              .getElementById(targetId)
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 0)
        : null;

    booking.clearPendingScrollTarget();
    return () => {
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [
    booking.pendingScrollTarget,
    booking.clearPendingScrollTarget,
    schedules.status,
    schedules.schedules.length,
    schedules.filteredSchedules.length,
  ]);

  const displayRoute: RouteInfo = { ...route, stops: pickupStops.stops };
  const displayPassengerProfile = getDisplayPassengerProfile(
    member.authProfile,
    member.liffProfile,
  );
  const reservationPassengerName = getReservationPassengerName(
    member.authProfile,
  );
  const hasReservationOnSelectedDate = history.upcoming.some(
    (item) =>
      item.status === "RESERVED" &&
      item.openDate.slice(0, 10) === booking.selection.openDate,
  );

  function handleBookingSelectionChange(
    nextSelection: BookingSelection,
    source: BookingSelectionChangeSource,
  ) {
    schedules.clearSelected();
    booking.onChange(nextSelection, source);
  }

  async function handleConfirm(name: string, passengerCount: number) {
    if (!schedules.selectedSchedule) return;
    const outcome = await reservation.submit(
      schedules.selectedSchedule,
      name,
      passengerCount,
    );
    if (outcome === "success") {
      schedules.clearSelected();
      await Promise.all([schedules.reload(), history.reload()]);
    } else if (outcome === "error" || outcome === "restricted") {
      await schedules.reload();
    }
  }

  if (member.liffStatus !== "success") {
    return <MemberSessionStatus status={member.liffStatus} />;
  }

  return (
    <div>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 99999,
          background: "#000",
          color: "#fff",
          padding: "3px 6px",
          fontSize: "10px",
        }}
      >
        {import.meta.env.VITE_APP_VERSION}
      </div>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d7f3ff_0,#f7fbff_35%,#fff8e6_100%)] px-3 py-3 text-ink-900 md:px-4 md:py-5">
        <div className="mx-auto w-full max-w-[820px]">
          <div className="mt-4 grid gap-3 pb-32 md:gap-4">
            <section className="rounded-panel border-2 border-star-300 bg-[#FFF8D6] p-4 shadow-card md:p-5">
              <h1 className="text-xl font-black text-[#9A3412] md:text-lg">預約須知</h1>
              <p className="mt-2 text-base font-bold leading-6 text-ink-800 md:text-base">
                每日13:00 後開放預約隔日班次(不開放當日預約)，每人每日限一筆；累計未搭乘達 3 次停權 14 天。
              </p>
            </section>
            <MemberCard
              passenger={displayPassengerProfile}
              route={displayRoute}
              onEditProfile={() => navigate("/register", { state: { returnTo: "/" } })}
              footer={
                member.authProfile ? (
                  <UserCardEntry
                    status={userCards.status}
                    cardCount={userCards.cards.length}
                    onRetry={() => void userCards.reload()}
                  />
                ) : null
              }
            />
            <div id="available-tickets">
              <AvailableTicketsMenu
                reservations={history.recent}
                isLoading={history.recentStatus === "loading"}
                errorMessage={history.recentError}
                onRetry={() => void history.reload()}
                onSelect={(item) => {
                  if (openTicketInExternalBrowser(item.reservationId)) return;
                  navigate(`/ticket?reservationId=${encodeURIComponent(item.reservationId)}`);
                }}
              />
            </div>
            {member.authError && (
              <div role="alert" className="rounded-panel bg-white p-3 text-sm font-bold text-coral shadow-card ring-1 ring-coral/20 md:p-4">
                {member.authError}
              </div>
            )}
            {history.upcomingError && (
              <div role="alert" className="rounded-panel bg-white p-3 text-sm font-bold text-coral shadow-card ring-1 ring-coral/20 md:p-4">
                <p>{history.upcomingError}</p>
                <button
                  type="button"
                  onClick={() => void history.reload()}
                  className="mt-2 rounded-xl border border-coral px-3 py-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-coral/30"
                >
                  重新載入預約資料
                </button>
              </div>
            )}
            <BookingForm
              stops={pickupStops.stops}
              dates={booking.availableDates}
              selection={booking.selection}
              onChange={handleBookingSelectionChange}
              isStopsLoading={pickupStops.status === "loading"}
              stopsError={pickupStops.error}
              onRetryStops={pickupStops.retry}
            />
            <ScheduleList
              schedules={schedules.filteredSchedules}
              isLoading={schedules.status === "loading"}
              errorMessage={schedules.error}
              reservationErrorMessage={reservation.error}
              canReserve={schedules.canReserve && !hasReservationOnSelectedDate}
              unavailableReason={
                hasReservationOnSelectedDate ? "ACTIVE_RESERVATION" : "UNOPENED"
              }
              reservingScheduleId={reservation.reservingScheduleId}
              selectedScheduleId={schedules.selectedScheduleId}
              onRetry={() => void schedules.reload()}
              onSelect={schedules.selectSchedule}
            />
          </div>
        </div>

        <ReservationActionBar
          selectedSchedule={schedules.selectedSchedule}
          hasReservationOnSelectedDate={hasReservationOnSelectedDate}
          canReserve={schedules.canReserve}
          reservingScheduleId={reservation.reservingScheduleId}
          onReserveClick={reservation.openDialog}
        />
        <SuccessModal
          result={reservation.result}
          onClose={() => {
            reservation.closeResult();
            window.setTimeout(() => {
              document
                .getElementById("available-tickets")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 0);
          }}
        />
        <ReservationDialog
          open={reservation.isDialogOpen}
          schedule={schedules.selectedSchedule}
          pickupStopName={
            pickupStops.stops.find(
              (stop) => stop.stopId === booking.selection.pickupStopId,
            )?.stopName ?? ""
          }
          passengerName={reservationPassengerName}
          isSubmitting={reservation.reservingScheduleId !== null}
          onOpenChange={reservation.setIsDialogOpen}
          onConfirm={(name, passengerCount) => {
            void handleConfirm(name, passengerCount);
          }}
        />
        <ReservationRestrictionDialog
          open={reservation.isRestrictionOpen}
          onOpenChange={reservation.setIsRestrictionOpen}
        />
        <UserCardGuideDialog
          open={userCardGuide.isOpen}
          onDismiss={userCardGuide.dismiss}
          onGoToCards={() => {
            userCardGuide.dismiss();
            navigate("/cards");
          }}
        />
      </main>
    </div>
  );
}

export default App;
