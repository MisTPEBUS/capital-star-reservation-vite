import { CircleCheck, CircleX, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { focusRingClass } from "./styles";

export type ReviewDecision = "approve" | "reject";

const DECISION_OPTIONS: ReadonlyArray<{
  value: ReviewDecision;
  label: string;
  Icon: LucideIcon;
}> = [
  { value: "approve", label: "補資料並通過", Icon: CircleCheck },
  { value: "reject", label: "設為審核失敗", Icon: CircleX },
];

interface ReviewDecisionToggleProps {
  value: ReviewDecision;
  disabled: boolean;
  onChange: (value: ReviewDecision) => void;
}

export function ReviewDecisionToggle({
  value,
  disabled,
  onChange,
}: ReviewDecisionToggleProps) {
  return (
    <div className="space-y-2.5">
      <p id="card-review-decision-label" className="text-base font-bold text-admin-muted">
        審核結果
      </p>
      <div
        role="group"
        aria-labelledby="card-review-decision-label"
        className="grid grid-cols-2 gap-1 rounded-adminControl border border-admin-borderStrong bg-admin-bg p-1"
      >
        {DECISION_OPTIONS.map(({ value: optionValue, label, Icon }) => {
          const isSelected = optionValue === value;

          return (
            <button
              key={optionValue}
              type="button"
              aria-pressed={isSelected}
              disabled={disabled}
              className={cn(
                "flex h-12 items-center justify-center gap-2 rounded-lg px-2 text-base font-bold transition disabled:cursor-not-allowed",
                isSelected
                  ? "bg-admin-text text-admin-bg"
                  : "text-admin-softText hover:bg-white/10",
                focusRingClass,
              )}
              onClick={() => onChange(optionValue)}
            >
              <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
