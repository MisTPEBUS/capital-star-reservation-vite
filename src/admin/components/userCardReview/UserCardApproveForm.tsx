import { cn } from "@/lib/utils";
import type { ReviewUserCard } from "../../hooks/useReviewUserCard";
import { useApproveUserCardForm } from "../../hooks/useUserCardReviewForms";
import { INTERNAL_CARD_NO_MAX_LENGTH } from "../../../schemas/userCardReview";
import type { AdminUserCard } from "../../../types/adminUserCard";
import { ReviewFormField, ReviewNotice } from "./ReviewFormParts";
import { fieldInputClass } from "./styles";

interface UserCardApproveFormProps {
  formId: string;
  card: AdminUserCard;
  review: ReviewUserCard;
  hidden: boolean;
}

/** 只輸入內碼；其他 API 欄位使用卡片原值或預設值 */
export function UserCardApproveForm({
  formId,
  card,
  review,
  hidden,
}: UserCardApproveFormProps) {
  const { register, errors, submit } = useApproveUserCardForm(card, review);
  const serverMessage = errors.root?.server?.message;

  return (
    <form
      id={formId}
      noValidate
      hidden={hidden}
      aria-labelledby={`${formId}-heading`}
      className="space-y-4"
      onSubmit={(event) => void submit(event)}
    >
      {serverMessage ? (
        <ReviewNotice tone="error">{serverMessage}</ReviewNotice>
      ) : (
        errors.internalCardNo && (
          <ReviewNotice tone="error">
            請修正內碼後再送出。
          </ReviewNotice>
        )
      )}

      <div className="flex items-baseline justify-between gap-3">
        <h3 id={`${formId}-heading`} className="text-base font-bold text-admin-muted">
          補齊卡片資料
        </h3>
        <p className="text-sm text-admin-muted">
          <span aria-hidden="true" className="text-amber-200">*</span> 為必填
        </p>
      </div>

      {card.internalCardNo && (
        <ReviewNotice tone="info">已帶入查詢取得的內碼，請核對後再送出。</ReviewNotice>
      )}

      <ReviewFormField
        id="card-review-internal"
        label="晶片卡號（內碼）"
        required
        error={errors.internalCardNo?.message}
        hint={`最多 ${INTERNAL_CARD_NO_MAX_LENGTH} 字元；已通過的卡片不可重複使用同一內碼。`}
      >
        {(control) => (
          <input
            {...control}
            {...register("internalCardNo")}
            type="text"
            autoComplete="off"
            maxLength={INTERNAL_CARD_NO_MAX_LENGTH}
            placeholder="例：188059485"
            className={cn(fieldInputClass, "font-mono tabular-nums")}
          />
        )}
      </ReviewFormField>
    </form>
  );
}
