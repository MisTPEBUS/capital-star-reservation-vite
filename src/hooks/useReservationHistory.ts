import { useCallback, useEffect, useRef, useState } from "react";
import {
  getRecentReservations,
  getUpcomingReservations,
  type RecentReservation,
  type UpcomingReservation,
} from "../api/reservations";

type HistoryStatus = "idle" | "loading" | "success" | "error";

interface HistoryState<T> {
  userId: string | null;
  status: HistoryStatus;
  items: T[];
  error: string;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "預約紀錄讀取失敗";
}

export function useReservationHistory(userId: string | null) {
  const [upcoming, setUpcoming] = useState<HistoryState<UpcomingReservation>>({
    userId: null,
    status: "idle",
    items: [],
    error: "",
  });
  const [recent, setRecent] = useState<HistoryState<RecentReservation>>({
    userId: null,
    status: "idle",
    items: [],
    error: "",
  });
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const currentRequest = ++requestId.current;
    if (!userId) {
      setUpcoming({ userId: null, status: "idle", items: [], error: "" });
      setRecent({ userId: null, status: "idle", items: [], error: "" });
      return;
    }

    setUpcoming((current) => ({
      userId,
      status: "loading",
      items: current.userId === userId ? current.items : [],
      error: "",
    }));
    setRecent((current) => ({
      userId,
      status: "loading",
      items: current.userId === userId ? current.items : [],
      error: "",
    }));

    const upcomingRequest = getUpcomingReservations(userId)
      .then((items) => {
        if (currentRequest !== requestId.current) return;
        setUpcoming({ userId, status: "success", items, error: "" });
      })
      .catch((error: unknown) => {
        if (currentRequest !== requestId.current) return;
        console.error("UPCOMING_RESERVATIONS_ERROR:", error);
        setUpcoming({
          userId,
          status: "error",
          items: [],
          error: getErrorMessage(error),
        });
      });
    const recentRequest = getRecentReservations(userId)
      .then((items) => {
        if (currentRequest !== requestId.current) return;
        setRecent({ userId, status: "success", items, error: "" });
      })
      .catch((error: unknown) => {
        if (currentRequest !== requestId.current) return;
        console.error("RECENT_RESERVATIONS_ERROR:", error);
        setRecent({
          userId,
          status: "error",
          items: [],
          error: getErrorMessage(error),
        });
      });

    await Promise.all([upcomingRequest, recentRequest]);
  }, [userId]);

  useEffect(() => {
    void reload();
    return () => {
      requestId.current += 1;
    };
  }, [reload]);

  const currentUpcoming = upcoming.userId === userId ? upcoming : null;
  const currentRecent = recent.userId === userId ? recent : null;

  return {
    upcoming: currentUpcoming?.items ?? [],
    upcomingStatus: currentUpcoming?.status ?? (userId ? "loading" : "idle"),
    upcomingError: currentUpcoming?.error ?? "",
    recent: currentRecent?.items ?? [],
    recentStatus: currentRecent?.status ?? (userId ? "loading" : "idle"),
    recentError: currentRecent?.error ?? "",
    reload,
  };
}
