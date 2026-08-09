import { useEffect, useMemo, useState } from "react";
import {
  checkInReservation,
  type CheckInDevice,
  type CheckInReservationResult,
  type RecentReservation,
} from "../api/reservations";
import type { GeolocationSuccess } from "./useGeolocation";

const CHECK_IN_INTERVAL_MS = 60_000;

export type ReservationCheckInState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "success"; checkedInAt: string }
  | { status: "error"; message: string };

interface UseReservationCheckInOptions {
  reservations: RecentReservation[];
  isLoading: boolean;
  requestPosition: () => Promise<GeolocationSuccess>;
  onCheckedIn: (result: CheckInReservationResult) => void;
}

function getTaiwanDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
}

function getCheckInDevice(): CheckInDevice {
  const isTouchMac =
    /Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1;

  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    isTouchMac
    ? "MOBILE"
    : "PC";
}

export function useReservationCheckIn({
  reservations,
  isLoading,
  requestPosition,
  onCheckedIn,
}: UseReservationCheckInOptions) {
  const [state, setState] = useState<ReservationCheckInState>({
    status: "idle",
  });
  const latestReservation = useMemo(
    () =>
      [...reservations].sort((left, right) =>
        right.bookedAt.localeCompare(left.bookedAt),
      )[0] ?? null,
    [reservations],
  );

  useEffect(() => {
    if (isLoading) return;

    if (
      !latestReservation ||
      latestReservation.checkIn_at.trim() !== "" ||
      latestReservation.status !== "RESERVED"
    ) {
      if (latestReservation?.checkIn_at.trim()) {
        setState({
          status: "success",
          checkedInAt: latestReservation.checkIn_at,
        });
      } else {
        setState({ status: "idle" });
      }
      return;
    }

    let isActive = true;
    let isRequesting = false;

    const attemptCheckIn = async () => {
      if (isRequesting) return;

      if (latestReservation.openDate.slice(0, 10) !== getTaiwanDate()) {
        if (isActive) setState({ status: "idle" });
        return;
      }

      isRequesting = true;

      if (isActive) setState({ status: "checking" });

      try {
        const position = await requestPosition();
        if (!isActive) return;

        const result = await checkInReservation({
          reservationId: latestReservation.reservationId,
          lat: position.latitude,
          lon: position.longitude,
          checkIn_DEVICE: getCheckInDevice(),
        });
        if (!isActive) return;

        setState({ status: "success", checkedInAt: result.checkIn_at });
        onCheckedIn(result);
      } catch (error) {
        if (!isActive) return;

        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "核銷失敗，將於一分鐘後重試。",
        });
      } finally {
        isRequesting = false;
      }
    };

    void attemptCheckIn();
    const intervalId = window.setInterval(
      () => void attemptCheckIn(),
      CHECK_IN_INTERVAL_MS,
    );

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [isLoading, latestReservation, onCheckedIn, requestPosition]);

  return state;
}
