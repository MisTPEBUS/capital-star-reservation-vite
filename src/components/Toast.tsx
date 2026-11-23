import { useEffect } from "react";
import { cn } from "@/lib/utils";

export interface ToastMessage {
  type: "success" | "error" | "info";
  message: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
  duration?: number;
  /** 調整位置，例如頁面有固定底部操作列時改為 bottom-24 */
  className?: string;
}

const toastStyles: Record<ToastMessage["type"], string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-coral/30 bg-coral/10 text-coral",
  info: "border-bus-100 bg-bus-50 text-bus-800",
};

export function Toast({
  toast,
  onClose,
  duration = 3000,
  className,
}: ToastProps) {
  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [duration, onClose, toast]);

  if (!toast) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-[60] w-[calc(100%-2rem)] max-w-sm",
        className,
      )}
    >
      <div
        className={`flex items-start justify-between gap-3 rounded-2xl border p-3 shadow-soft ${toastStyles[toast.type]}`}
        role="status"
      >
        <p className="text-base font-black leading-6">{toast.message}</p>
        <button
          type="button"
          onClick={onClose}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/80 text-lg font-black text-ink-700 transition hover:bg-white"
          aria-label="關閉通知"
        >
          ×
        </button>
      </div>
    </div>
  );
}
