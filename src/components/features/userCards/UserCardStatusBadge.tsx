import { CircleCheck, CircleX, Clock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserCardReviewStatus } from "../../../types/userCard";
import { USER_CARD_STATUS_LABEL } from "../../../utils/userCards";

const STATUS_STYLES: Record<
  UserCardReviewStatus,
  { className: string; Icon: LucideIcon }
> = {
  APPROVED: { className: "bg-emerald-50 text-emerald-700", Icon: CircleCheck },
  PENDING: { className: "bg-star-100 text-amber-800", Icon: Clock },
  REJECTED: { className: "bg-orange-100 text-orange-800", Icon: CircleX },
};

interface UserCardStatusBadgeProps {
  status: UserCardReviewStatus;
}

export function UserCardStatusBadge({ status }: UserCardStatusBadgeProps) {
  const { className, Icon } = STATUS_STYLES[status];

  return (
    <span
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full pl-2.5 pr-3 text-sm font-black",
        className,
      )}
    >
      <Icon className="size-4" strokeWidth={2.6} aria-hidden="true" />
      {USER_CARD_STATUS_LABEL[status]}
    </span>
  );
}
