import { useEffect, useState } from "react";
import type { OpenSchedule } from "../types/reservation";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface ReservationDialogProps {
  open: boolean;
  schedule: OpenSchedule | null;
  pickupStopName: string;
  passengerName: string;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string, passengerCount: number) => void;
}

export function ReservationDialog({
  open,
  schedule,
  pickupStopName,
  passengerName,
  isSubmitting = false,
  onOpenChange,
  onConfirm,
}: ReservationDialogProps) {
  const [name, setName] = useState("");
  const [passengerCount, setPassengerCount] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(passengerName);
      setPassengerCount(1);
      setError("");
    }
  }, [open, schedule?.dailyOpenScheduleId]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      setError("請填寫稱呼。");
      return;
    }

    if (!Number.isInteger(passengerCount) || passengerCount < 1) {
      setError("乘車人數至少為 1 人。");
      return;
    }

    setError("");
    onConfirm(name.trim(), passengerCount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-3xl">確認預約</DialogTitle>
          <DialogDescription className="text-base">
            請確認本次預約資訊後送出。
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="rounded-xl bg-bus-50 p-4 ring-1 ring-bus-100">
            <p className="text-base font-bold text-ink-500">班次資訊</p>
            <p className="mt-1 text-2xl font-black text-ink-900">
              {schedule
                ? `${schedule.openDate} ${schedule.departureTime}`
                : "-"}
            </p>
            <p className="mt-2 text-base font-bold text-bus-700">
              上車站位: {pickupStopName || "-"}
            </p>
          </div>

          <label className="grid gap-2 text-base font-black text-ink-800">
            稱呼
            <input
              value={name}
              readOnly
              required
              aria-readonly="true"
              className="h-12 cursor-not-allowed rounded-xl border border-ink-200 bg-ink-50 px-3 text-lg font-bold text-ink-700 outline-none"
            />
          </label>

          <fieldset className="grid gap-2">
            <legend className="text-base font-black text-ink-800">
              乘車人數
            </legend>
            <div
              className="grid grid-cols-4 gap-2"
              role="group"
              aria-label="選擇乘車人數"
            >
              {[1, 2, 3].map((count) => {
                const isSelected = passengerCount === count;

                return (
                  <button
                    key={count}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setPassengerCount(count)}
                    className={`h-12 rounded-xl border text-lg font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bus-100 ${
                      isSelected
                        ? "border-bus-900 bg-bus-900 text-white"
                        : "border-ink-200 bg-white text-ink-700 hover:border-bus-400 hover:bg-bus-50"
                    }`}
                  >
                    {count} 人
                  </button>
                );
              })}
            </div>
          </fieldset>

          {error && <p className="text-base font-bold text-coral">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-12 px-5 text-lg"
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !schedule}
              className="h-12 bg-bus-900 px-5 text-lg text-white hover:bg-bus-700"
            >
              {isSubmitting ? "送出中…" : "送出預約"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
