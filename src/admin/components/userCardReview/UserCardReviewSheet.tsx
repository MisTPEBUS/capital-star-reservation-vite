import { useIsMutating } from "@tanstack/react-query";
import { X } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../../../components/ui/sheet";
import { adminUserCardKeys } from "../../hooks/adminUserCardKeys";
import type { AdminUserCard } from "../../../types/adminUserCard";
import { getApplicantName } from "../../utils/userCardReview";
import { iconButtonClass } from "./styles";
import { UserCardReviewedDetails } from "./UserCardReviewedDetails";
import { UserCardReviewPanel } from "./UserCardReviewPanel";
import { UserCardReviewStatusBadge } from "./UserCardReviewStatusBadge";

interface UserCardReviewSheetProps {
  card: AdminUserCard | null;
  onClose: () => void;
  onReviewed: (message: string) => void;
  onStale: (message: string) => void;
}

/** 右側審核面板；送出期間禁止以 Esc、點背景或關閉鈕離開 */
export function UserCardReviewSheet({
  card,
  onClose,
  onReviewed,
  onStale,
}: UserCardReviewSheetProps) {
  const isSubmitting =
    useIsMutating({ mutationKey: adminUserCardKeys.review }) > 0;
  const preventCloseWhileSubmitting = (event: Event) => {
    if (isSubmitting) event.preventDefault();
  };

  return (
    <Sheet
      open={card !== null}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
    >
      {card && (
        <SheetContent
          side="right"
          showCloseButton={false}
          className="!w-full !max-w-xl !gap-0 !border-admin-borderStrong !bg-admin-surface !p-0 !text-admin-text"
          onEscapeKeyDown={preventCloseWhileSubmitting}
          onInteractOutside={preventCloseWhileSubmitting}
        >
          <SheetHeader className="flex-row items-start justify-between gap-3 border-b border-admin-border px-5 py-5 text-left sm:px-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <UserCardReviewStatusBadge status={card.reviewStatus} />
              </div>
              <SheetTitle className="mt-1.5 !text-xl !font-bold !text-admin-text">
                {card.reviewStatus === "PENDING"
                  ? "請核對申請資料並選擇審核結果"
                  : `乘車卡資料`}
              </SheetTitle>
            </div>
            <SheetClose asChild>
              <button
                type="button"
                aria-label="關閉審核面板"
                className={iconButtonClass}
                disabled={isSubmitting}
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </SheetClose>
          </SheetHeader>

          {card.reviewStatus === "PENDING" ? (
            <UserCardReviewPanel
              key={card.cardId}
              card={card}
              onCancel={onClose}
              onReviewed={onReviewed}
              onStale={onStale}
            />
          ) : (
            <UserCardReviewedDetails card={card} onClose={onClose} />
          )}
        </SheetContent>
      )}
    </Sheet>
  );
}
