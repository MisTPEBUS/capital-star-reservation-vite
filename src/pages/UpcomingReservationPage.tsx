import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAuthProfile,
  getPreferredProfileName,
  isProfileRegistrationRequired,
} from "../api/auth";
import {
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
  const [userId, setUserId] = useState<string | null>(null);
  const [identityCode, setIdentityCode] = useState<string | null>(null);
  const [passengerName, setPassengerName] = useState<string | null>(null);
  const [reservation, setReservation] = useState<UpcomingReservation | null>(
    null,
  );

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

    const reservations = await getUpcomingReservations(profile.userId);
    const nextReservation = reservations
      .filter(
        (item) =>
          item.status === "RESERVED" &&
          getDepartureTimestamp(item) > Date.now(),
      )
      .sort((left, right) => getDepartureTimestamp(left) - getDepartureTimestamp(right))[0];

    setUserId(profile.userId);
    setIdentityCode(profile.activeCode);
    setPassengerName(getPreferredProfileName(profile, liffProfile.displayName));
    setReservation(nextReservation ?? null);
  }, [navigate]);

  useEffect(() => {
    let isCurrent = true;

    loadReservation().catch((error) => {
      if (isCurrent) {
        console.error("UPCOMING_RESERVATION_PAGE_ERROR:", error);
      }
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
        />
      </div>
    </main>
  );
}
