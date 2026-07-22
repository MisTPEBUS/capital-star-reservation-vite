import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getAuthProfile,
  getPreferredProfileName,
  isProfileRegistrationRequired,
} from "../api/auth";
import {
  getRecentReservations,
  getUpcomingReservations,
  type UpcomingReservation,
} from "../api/reservations";
import { UpcomingReservationCard } from "../components/UpcomingReservationCard";
import { initLiff } from "../liff/liffClient";

function getDepartureTimestamp(reservation: UpcomingReservation) {
  const dateMatch = reservation.openDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const timeMatch = reservation.departureTime.match(/^(\d{1,2}):(\d{2})/);

  if (!dateMatch || !timeMatch) return Number.NaN;

  return new Date(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]),
    Number(timeMatch[1]),
    Number(timeMatch[2]),
  ).getTime();
}

export function UpcomingReservationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [identityCode, setIdentityCode] = useState<string | null>(null);
  const [passengerName, setPassengerName] = useState<string | null>(null);
  const [reservation, setReservation] = useState<UpcomingReservation | null>(
    null,
  );
  const [recentReservations, setRecentReservations] = useState<
    UpcomingReservation[]
  >([]);
  const [upcomingReservations, setUpcomingReservations] = useState<
    UpcomingReservation[]
  >([]);
  const [isRecentReservationsLoading, setIsRecentReservationsLoading] =
    useState(true);

  useEffect(() => {
    const previousFontSize = document.documentElement.style.fontSize;
    document.title = "乘車憑證 — Capital Star";
    document.documentElement.style.fontSize = "112.5%";

    return () => {
      document.documentElement.style.fontSize = previousFontSize;
    };
  }, []);

  const loadReservation = useCallback(async () => {
    const liffProfile = await initLiff();
    if (!liffProfile) return;

    const profile = await getAuthProfile(liffProfile.lineUserId);

    if (isProfileRegistrationRequired(profile)) {
      navigate("/register", {
        replace: true,
        state: { returnTo: "/ticket" },
      });
      return;
    }

    const [upcomingReservations, reservations] = await Promise.all([
      getUpcomingReservations(profile.userId),
      getRecentReservations(profile.userId),
    ]);
    const requestedReservationId = searchParams.get("reservationId");
    const nextReservation = requestedReservationId
      ? (upcomingReservations.find(
          (item) => item.reservationId === requestedReservationId,
        ) ?? null)
      : (upcomingReservations
          .filter((item) => item.status === "RESERVED")
          .sort(
            (left, right) =>
              getDepartureTimestamp(left) - getDepartureTimestamp(right),
          )[0] ?? null);

    setUserId(profile.userId);
    setIdentityCode(profile.activeCode);
    setPassengerName(getPreferredProfileName(profile, liffProfile.displayName));
    setReservation(nextReservation ?? null);
    setUpcomingReservations(upcomingReservations);
    setRecentReservations(reservations);
  }, [navigate, searchParams]);

  useEffect(() => {
    let isCurrent = true;

    setIsRecentReservationsLoading(true);
    loadReservation()
      .catch((error) => {
        if (isCurrent) {
          console.error("UPCOMING_RESERVATION_PAGE_ERROR:", error);
        }
      })
      .finally(() => {
        if (isCurrent) setIsRecentReservationsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [loadReservation]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d7f3ff_0,#f7fbff_35%,#fff8e6_100%)] px-3 py-3 text-ink-900 md:px-4 md:py-5">
      <div className="mx-auto w-full max-w-[820px]">
        <UpcomingReservationCard
          reservation={reservation}
          userId={userId}
          identityCode={identityCode}
          passengerName={passengerName}
          onCancelled={loadReservation}
          canCancel={upcomingReservations.some(
            (item) => item.reservationId === reservation?.reservationId,
          )}
        />
        <section className="mt-6 rounded-panel bg-white p-4 shadow-card ring-1 ring-bus-100/80 md:p-5">
          <div className="mb-4">
            <h2 className="mt-1 text-2xl font-black text-ink-900">
              歷史預約紀錄
            </h2>
          </div>
          {isRecentReservationsLoading ? (
            <p className="py-8 text-center text-base font-bold text-ink-500">
              正在讀取歷史預約紀錄…
            </p>
          ) : recentReservations.length === 0 ? (
            <p className="rounded-card bg-ink-50 px-4 py-8 text-center text-base font-bold text-ink-500">
              目前沒有預約紀錄。
            </p>
          ) : (
            <div className="grid gap-2.5">
              {recentReservations.map((item) => {
                const isSelected =
                  item.reservationId === reservation?.reservationId;

                return (
                  <button
                    key={item.reservationId}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      setReservation(item);
                      document
                        .getElementById("upcoming-reservation")
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                    }}
                    className={`rounded-card border p-3.5 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bus-100 ${
                      isSelected
                        ? "border-bus-600 bg-bus-50 ring-1 ring-bus-600"
                        : "border-bus-100 bg-white hover:border-bus-300 hover:bg-bus-50/60"
                    }`}
                  >
                    <p className="text-sm font-bold text-ink-500">
                      {item.openDate}　{item.routeNumber} ·{" "}
                      {item.pickupStop.stopName}
                    </p>
                    <p className="mt-1 font-mono text-3xl font-black leading-none tracking-tight text-ink-900">
                      {item.departureTime.slice(0, 5)}
                    </p>
                    <p className="mt-2 text-xs font-bold text-bus-700">
                      {isSelected ? "目前顯示中" : "點選查看乘車憑證"}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-6 h-12 w-full rounded-xl bg-bus-900 px-5 text-base font-black text-white shadow-card transition hover:bg-bus-700"
        >
          返回預約首頁
        </button>
      </div>
    </main>
  );
}
