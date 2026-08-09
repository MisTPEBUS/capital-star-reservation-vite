import type { ReservationCheckInState } from "../hooks/useReservationCheckIn";

interface ReservationCheckInStatusProps {
  state: ReservationCheckInState;
}

export function ReservationCheckInStatus({
  state,
}: ReservationCheckInStatusProps) {
  if (state.status === "idle") return null;

  const isSuccess = state.status === "success";

  return (
    <section
      aria-live="polite"
      className={`mt-3 rounded-xl border px-4 py-3 text-sm font-bold ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : state.status === "error"
            ? "border-coral/20 bg-coral/5 text-coral"
            : "border-bus-100 bg-bus-50 text-bus-700"
      }`}
    >
      {state.status === "checking" && "正在確認目前位置並進行核銷…"}
      {state.status === "error" && `${state.message} 系統將於一分鐘後重試。`}
      {state.status === "success" && `核銷成功：${state.checkedInAt}`}
    </section>
  );
}
