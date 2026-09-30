import { useEffect, useState } from "react";
import {
  checkInReservation,
  type CheckInDevice,
  type CheckInReservationResult,
  type RecentReservation,
} from "../api/reservations";
import type { GeolocationSuccess } from "./useGeolocation";
import { isWithinReservationCheckInWindow } from "../utils/reservationTicketMessage";

const CHECK_IN_INTERVAL_MS = 60_000;

export type ReservationCheckInState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "success"; checkedInAt: string }
  | { status: "error"; message: string };

interface UseReservationCheckInOptions {
  reservation: RecentReservation | null;
  isLoading: boolean;
  requestPosition: () => Promise<GeolocationSuccess>;
  onCheckedIn: (result: CheckInReservationResult) => void;
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
  reservation,
  isLoading,
  requestPosition,
  onCheckedIn,
}: UseReservationCheckInOptions) {
  const [state, setState] = useState<ReservationCheckInState>({
    status: "idle",
  });
  useEffect(() => {
    if (isLoading) return;

    if (
      !reservation ||
      reservation.checkIn_at.trim() !== "" ||
      reservation.status !== "RESERVED"
    ) {
      if (reservation?.checkIn_at.trim()) {
        setState({
          status: "success",
          checkedInAt: reservation.checkIn_at,
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

      if (!isWithinReservationCheckInWindow(reservation, new Date())) {
        if (isActive) setState({ status: "idle" });
        return;
      }

      isRequesting = true;

      if (isActive) setState({ status: "checking" });

      try {
        const position = await requestPosition();
        if (!isActive) return;

        const result = await checkInReservation({
          reservationId: reservation.reservationId,
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
  }, [isLoading, reservation, onCheckedIn, requestPosition]);

  return state;
}
