import { cn } from "@/lib/utils";
import type { UserCardReviewStatus } from "../../../types/userCard";
import { REVIEW_STATUS_LABEL } from "../../utils/userCardReview";

const BADGE_STYLES: Record<UserCardReviewStatus, string> = {
  PENDING: "bg-amber-200 text-amber-900",
  APPROVED: "bg-emerald-200 text-emerald-900",
  REJECTED: "bg-red-200 text-red-900",
};

interface UserCardReviewStatusBadgeProps {
  status: UserCardReviewStatus;
}

export function UserCardReviewStatusBadge({
  status,
}: UserCardReviewStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-sm font-extrabold",
        BADGE_STYLES[status],
      )}
    >
      {REVIEW_STATUS_LABEL[status]}
    </span>
  );
}
