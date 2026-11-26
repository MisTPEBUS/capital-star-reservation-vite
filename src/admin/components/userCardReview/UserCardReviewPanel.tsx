import { useState } from "react";
import { Check } from "lucide-react";
import { useReviewUserCard } from "../../hooks/useReviewUserCard";
import type { AdminUserCard } from "../../../types/adminUserCard";
import { getApplicantItems } from "../../utils/userCardReview";
import { ReviewDecisionToggle, type ReviewDecision } from "./ReviewDecisionToggle";
import { ReviewSheetActions, ReviewSheetBody } from "./ReviewSheetLayout";
import {
  dangerButtonClass,
  outlineButtonClass,
  primaryButtonClass,
} from "./styles";
import { UserCardApproveForm } from "./UserCardApproveForm";
import { UserCardDetailSection } from "./UserCardDetailSection";
import { UserCardRejectForm } from "./UserCardRejectForm";

const APPROVE_FORM_ID = "card-review-approve-form";
const REJECT_FORM_ID = "card-review-reject-form";

interface UserCardReviewPanelProps {
  card: AdminUserCard;
  onCancel: () => void;
  onReviewed: (message: string) => void;
  onStale: (message: string) => void;
}

/**
 * 審核中卡片的處理面板。
 * 兩個表單同時掛載、只顯示目前選擇的一個，切換時不會遺失已輸入的內容。
 */
export function UserCardReviewPanel({
  card,
  onCancel,
  onReviewed,
  onStale,
}: UserCardReviewPanelProps) {
  const [decision, setDecision] = useState<ReviewDecision>("approve");
  const { review, isSubmitting } = useReviewUserCard(card.cardId, {
    onReviewed,
    onStale,
  });
  const isApprove = decision === "approve";

  return (
    <>
      <ReviewSheetBody>
        <UserCardDetailSection title="申請資料" items={getApplicantItems(card)} />
        <ReviewDecisionToggle
          value={decision}
          disabled={isSubmitting}
          onChange={setDecision}
        />
        <UserCardApproveForm
          formId={APPROVE_FORM_ID}
          card={card}
          review={review}
          hidden={!isApprove}
        />
        <UserCardRejectForm
          formId={REJECT_FORM_ID}
          review={review}
          hidden={isApprove}
        />
      </ReviewSheetBody>

      <ReviewSheetActions>
        <button
          type="button"
          className={outlineButtonClass}
          disabled={isSubmitting}
          onClick={onCancel}
        >
          取消
        </button>
        <button
          type="submit"
          form={isApprove ? APPROVE_FORM_ID : REJECT_FORM_ID}
          className={isApprove ? primaryButtonClass : dangerButtonClass}
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isApprove && <Check aria-hidden="true" className="h-5 w-5" />}
          {isSubmitting ? "送出中…" : isApprove ? "確認通過" : "確認設為失敗"}
        </button>
      </ReviewSheetActions>
    </>
  );
}
