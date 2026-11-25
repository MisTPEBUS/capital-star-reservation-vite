import { useCallback, useRef, useState } from "react";
import {
  createReservation,
  ReservationApiError,
} from "../api/reservations";
import type { OpenSchedule, ReservationResult } from "../types/reservation";

interface UseCreateReservationParams {
  lineUserId: string | null;
  userId: string | null;
  pickupStopId: string;
  activeCode: string;
}

export type ReservationOutcome = "success" | "restricted" | "error" | "invalid";

function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("zh-TW", {
    dateStyle: "short",
    timeStyle: "short",
    hour12: false,
  }).format(new Date(value));
}

export function useCreateReservation({
  lineUserId,
  userId,
  pickupStopId,
  activeCode,
}: UseCreateReservationParams) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRestrictionOpen, setIsRestrictionOpen] = useState(false);
  const [reservingScheduleId, setReservingScheduleId] = useState<string | null>(
    null,
  );
  const [result, setResult] = useState<ReservationResult | null>(null);
  const [error, setError] = useState("");
  const inFlight = useRef(false);

  const openDialog = useCallback(() => {
    setError("");
    setIsDialogOpen(true);
  }, []);
  const closeResult = useCallback(() => setResult(null), []);

  const submit = useCallback(
    async (
      schedule: OpenSchedule,
      name: string,
      passengerCount: number,
    ): Promise<ReservationOutcome> => {
      if (inFlight.current) return "invalid";
      if (!lineUserId) {
        setError("無法取得 LINE 使用者資料，請重新開啟頁面。");
        return "invalid";
      }
      if (!userId) {
        setError("會員資料尚未載入完成，請稍後再試。");
        return "invalid";
      }
      if (!name.trim()) {
        setError("請填寫稱呼後再預約。");
        return "invalid";
      }
      if (!Number.isInteger(passengerCount) || passengerCount < 1) {
        setError("乘車人數至少為 1 人。");
        return "invalid";
      }

      inFlight.current = true;
      setError("");
      setReservingScheduleId(schedule.dailyOpenScheduleId);
      try {
        const reservation = await createReservation({
          userId,
          dailyOpenScheduleId: schedule.dailyOpenScheduleId,
          pickupStopId,
          lineUserId,
        });
        setResult({
          reservationId: reservation.reservationId,
          scheduleCode: reservation.routeNumber,
          departureTime: reservation.departureTime.slice(0, 5),
          openDate: reservation.openDate,
          pickupStopName: reservation.pickupStop.stopName,
          activeCode,
          passengerName: name.trim(),
          passengerCount,
          bookedAt: formatDateTime(reservation.bookedAt),
          qrCode: reservation.qrCode,
        });
        setIsDialogOpen(false);
        return "success";
      } catch (submitError) {
        console.error("CREATE_RESERVATION_ERROR:", submitError);
        if (
          submitError instanceof ReservationApiError &&
          submitError.errorCode === "RESERVATION_RESTRICTED"
        ) {
          setIsDialogOpen(false);
          setIsRestrictionOpen(true);
          return "restricted";
        }
        setError(
          submitError instanceof Error
            ? submitError.message
            : "預約建立失敗",
        );
        return "error";
      } finally {
        inFlight.current = false;
        setReservingScheduleId(null);
      }
    },
    [activeCode, lineUserId, pickupStopId, userId],
  );

  return {
    isDialogOpen,
    setIsDialogOpen,
    isRestrictionOpen,
    setIsRestrictionOpen,
    reservingScheduleId,
    result,
    error,
    openDialog,
    closeResult,
    submit,
  };
}
