import { cn } from "@/lib/utils";
import type { ReviewRowView } from "../../utils/userCardReview";
import { outlineButtonClass, primaryButtonClass } from "./styles";

interface ReviewResultChipProps {
  label: string;
}

/** 系統判定或審核結果的標籤 */
export function ReviewResultChip({ label }: ReviewResultChipProps) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-admin-borderStrong bg-admin-bg px-3 py-1 text-sm font-bold text-admin-softText">
      {label}
    </span>
  );
}

interface ReviewActionButtonProps {
  view: ReviewRowView;
  className?: string;
  onClick: () => void;
}

/** 審核中顯示主要按鈕「審核」，已完成顯示次要按鈕「檢視」 */
export function ReviewActionButton({
  view,
  className,
  onClick,
}: ReviewActionButtonProps) {
  return (
    <button
      type="button"
      aria-label={view.accessibleActionLabel}
      className={cn(
        view.isPending ? primaryButtonClass : outlineButtonClass,
        "h-11",
        className,
      )}
      onClick={onClick}
    >
      {view.actionLabel}
    </button>
  );
}
