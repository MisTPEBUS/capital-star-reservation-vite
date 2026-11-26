import { cn } from "@/lib/utils";

/** 審核頁共用樣式：深色後台上的焦點框、按鈕與輸入框 */
export const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-admin-surface";

const buttonBaseClass =
  "inline-flex h-12 items-center justify-center gap-2 rounded-adminControl px-5 text-base font-bold transition disabled:cursor-not-allowed disabled:opacity-50";

export const primaryButtonClass = cn(
  buttonBaseClass,
  "bg-adminStatus-enabled text-emerald-950 hover:bg-emerald-300",
  focusRingClass,
);

export const dangerButtonClass = cn(
  buttonBaseClass,
  "bg-red-300 text-red-950 hover:bg-red-400",
  focusRingClass,
);

export const outlineButtonClass = cn(
  buttonBaseClass,
  "border border-admin-borderStrong bg-transparent text-admin-text hover:bg-white/10",
  focusRingClass,
);

export const iconButtonClass = cn(
  "grid h-11 w-11 shrink-0 place-items-center rounded-adminControl border border-admin-borderStrong text-admin-text transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50",
  focusRingClass,
);

export const fieldInputClass = cn(
  "h-12 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3.5 text-base text-admin-text transition placeholder:text-admin-muted/70",
  "focus-visible:border-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/40",
  "aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-400/30",
);
