import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSchedules } from "../api/schedules";
import type { OpenSchedule, TimePeriod } from "../types/reservation";

type ScheduleStatus = "idle" | "loading" | "success" | "error";

interface ScheduleState {
  key: string;
  status: ScheduleStatus;
  schedules: OpenSchedule[];
  canReserve: boolean;
  error: string;
}

interface UseBookingSchedulesParams {
  lineUserId: string | null;
  openDate: string;
  pickupStopId: string;
  timePeriod: TimePeriod;
}

const EMPTY_SCHEDULES: OpenSchedule[] = [];

function getPeriod(time: string): Exclude<TimePeriod, "ALL"> {
  const hour = Number(time.split(":")[0]);
  if (hour < 12) return "MORNING";
  if (hour < 18) return "AFTERNOON";
  return "EVENING";
}

export function useBookingSchedules({
  lineUserId,
  openDate,
  pickupStopId,
  timePeriod,
}: UseBookingSchedulesParams) {
  const key = lineUserId && pickupStopId
    ? JSON.stringify([lineUserId, openDate, pickupStopId])
    : "";
  const [state, setState] = useState<ScheduleState>({
    key: "",
    status: "idle",
    schedules: [],
    canReserve: false,
    error: "",
  });
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null,
  );
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const currentRequest = ++requestId.current;
    if (!key || !lineUserId) {
      setState({
        key: "",
        status: "idle",
        schedules: [],
        canReserve: false,
        error: "",
      });
      return;
    }

    setState((current) => ({
      key,
      status: "loading",
      schedules: current.key === key ? current.schedules : [],
      canReserve: current.key === key ? current.canReserve : false,
      error: "",
    }));

    try {
      const result = await getSchedules({ date: openDate, pickupStopId, lineUserId });
      if (currentRequest !== requestId.current) return;
      setState({
        key,
        status: "success",
        schedules: result.schedules,
        canReserve: result.canReserve,
        error: "",
      });
    } catch (error) {
      if (currentRequest !== requestId.current) return;
      console.error("SCHEDULES_ERROR:", error);
      setState({
        key,
        status: "error",
        schedules: [],
        canReserve: false,
        error: error instanceof Error ? error.message : "班次資料讀取失敗",
      });
    }
  }, [key, lineUserId, openDate, pickupStopId]);

  useEffect(() => {
    void reload();
    return () => {
      requestId.current += 1;
    };
  }, [reload]);

  const currentState = state.key === key ? state : null;
  const schedules = currentState?.schedules ?? EMPTY_SCHEDULES;
  const status: ScheduleStatus = !key
    ? "idle"
    : (currentState?.status ?? "loading");
  const filteredSchedules = useMemo(
    () =>
      schedules
        .filter(
          (schedule) =>
            timePeriod === "ALL" ||
            getPeriod(schedule.departureTime) === timePeriod,
        )
        .sort((a, b) => a.departureTime.localeCompare(b.departureTime)),
    [schedules, timePeriod],
  );
  const selectedSchedule =
    filteredSchedules.find(
      (schedule) => schedule.dailyOpenScheduleId === selectedScheduleId,
    ) ?? null;

  useEffect(() => {
    if (selectedScheduleId && !selectedSchedule) {
      setSelectedScheduleId(null);
    }
  }, [selectedSchedule, selectedScheduleId]);

  const selectSchedule = useCallback(
    (schedule: OpenSchedule) => setSelectedScheduleId(schedule.dailyOpenScheduleId),
    [],
  );
  const clearSelected = useCallback(() => setSelectedScheduleId(null), []);

  return {
    schedules,
    filteredSchedules,
    status,
    error: currentState?.error ?? "",
    canReserve: currentState?.canReserve ?? false,
    selectedSchedule,
    selectedScheduleId,
    selectSchedule,
    clearSelected,
    reload,
  };
}
