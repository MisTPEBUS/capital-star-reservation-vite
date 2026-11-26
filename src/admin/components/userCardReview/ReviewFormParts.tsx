import type { ReactNode } from "react";
import {
  CircleAlert,
  Info,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** 傳給輸入元件的無障礙屬性，讓 label、錯誤與說明正確關聯 */
export interface FieldControlProps {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby"?: string;
  "aria-required"?: true;
}

interface ReviewFormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: (control: FieldControlProps) => ReactNode;
}

export function ReviewFormField({
  id,
  label,
  required = false,
  error,
  hint,
  children,
}: ReviewFormFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-base font-bold text-admin-text">
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="text-amber-200">
              {" "}
              *
            </span>
            <span className="sr-only">（必填）</span>
          </>
        )}
      </label>
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": describedBy,
        "aria-required": required ? true : undefined,
      })}
      {error && (
        <p id={errorId} className="text-sm font-semibold text-red-100">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="text-sm text-admin-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

type NoticeTone = "info" | "warning" | "error";

const NOTICE_STYLES: Record<NoticeTone, { className: string; Icon: LucideIcon }> =
  {
    info: {
      className: "border-admin-borderStrong bg-admin-bg/50 text-admin-softText",
      Icon: Info,
    },
    warning: {
      className: "border-amber-200/50 bg-amber-200/10 text-amber-100",
      Icon: TriangleAlert,
    },
    error: {
      className: "border-red-400/60 bg-red-400/15 text-red-100",
      Icon: CircleAlert,
    },
  };

interface ReviewNoticeProps {
  tone: NoticeTone;
  children: ReactNode;
}

/** 表單內的提示框；error 會以 role="alert" 通知輔助技術 */
export function ReviewNotice({ tone, children }: ReviewNoticeProps) {
  const { className, Icon } = NOTICE_STYLES[tone];

  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={cn(
        "flex items-start gap-2.5 rounded-adminControl border px-3.5 py-3 text-base leading-relaxed",
        className,
      )}
    >
      <Icon aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
