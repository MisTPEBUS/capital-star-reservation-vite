import { useCallback, useEffect, useRef, useState } from "react";
import { getAvailableDates } from "../data/mockData";
import type {
  BookingSelection,
  BookingSelectionChangeSource,
  PickupStop,
} from "../types/reservation";
import type { PickupStopsStatus } from "./usePickupStops";

export type BookingScrollTarget = "date" | "time" | "schedules";

export function useBookingSelection(
  routeId: string,
  stops: PickupStop[],
  stopsStatus: PickupStopsStatus,
  isPageReady: boolean,
) {
  const [availableDates, setAvailableDates] = useState(getAvailableDates);
  const [selection, setSelection] = useState<BookingSelection>(() => ({
    routeId,
    pickupStopId: "",
    openDate: availableDates[0].value,
    timePeriod: "ALL",
  }));
  const [pendingScrollTarget, setPendingScrollTarget] =
    useState<BookingScrollTarget | null>(null);
  const requestedStopId = useRef(
    new URLSearchParams(window.location.search).get("stopId")?.trim() ?? "",
  );
  const hasScrolledToRequestedStop = useRef(false);

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );
    const timer = window.setTimeout(() => {
      const nextDates = getAvailableDates();
      setAvailableDates(nextDates);
      setSelection((current) =>
        nextDates.some((date) => date.value === current.openDate)
          ? current
          : { ...current, openDate: nextDates[0].value, timePeriod: "ALL" },
      );
    }, Math.max(nextMidnight.getTime() - now.getTime() + 50, 1000));

    return () => window.clearTimeout(timer);
  }, [availableDates]);

  useEffect(() => {
    if (stopsStatus === "error") {
      setSelection((current) =>
        current.pickupStopId
          ? { ...current, pickupStopId: "" }
          : current,
      );
      return;
    }
    if (stopsStatus !== "success") return;

    const requestedExists = stops.some(
      (stop) => stop.stopId === requestedStopId.current,
    );
    setSelection((current) => {
      const currentExists = stops.some(
        (stop) => stop.stopId === current.pickupStopId,
      );
      const pickupStopId = currentExists
        ? current.pickupStopId
        : current.pickupStopId === "" && requestedExists
          ? requestedStopId.current
          : (stops[0]?.stopId ?? "");

      return current.pickupStopId === pickupStopId
        ? current
        : { ...current, pickupStopId };
    });

    if (
      !isPageReady ||
      !requestedExists ||
      hasScrolledToRequestedStop.current
    ) return;
    const timer = window.setTimeout(() => {
      hasScrolledToRequestedStop.current = true;
      document
        .getElementById("booking-pickup")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isPageReady, stops, stopsStatus]);

  const onChange = useCallback(
    (nextSelection: BookingSelection, source: BookingSelectionChangeSource) => {
      setSelection(nextSelection);
      setPendingScrollTarget(
        source === "pickup"
          ? "date"
          : source === "date"
            ? "time"
            : "schedules",
      );
    },
    [],
  );

  const clearPendingScrollTarget = useCallback(
    () => setPendingScrollTarget(null),
    [],
  );

  return {
    selection,
    availableDates,
    onChange,
    pendingScrollTarget,
    clearPendingScrollTarget,
  };
}
