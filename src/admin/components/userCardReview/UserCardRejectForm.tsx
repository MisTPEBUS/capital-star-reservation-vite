import { cn } from "@/lib/utils";
import type { ReviewUserCard } from "../../hooks/useReviewUserCard";
import { useRejectUserCardForm } from "../../hooks/useUserCardReviewForms";
import { REJECT_REASON_MAX_LENGTH } from "../../../schemas/userCardReview";
import { ReviewFormField, ReviewNotice } from "./ReviewFormParts";
import { fieldInputClass } from "./styles";

interface UserCardRejectFormProps {
  formId: string;
  review: ReviewUserCard;
  hidden: boolean;
}

/** 設為審核失敗：原因只記錄在後台 */
export function UserCardRejectForm({ formId, review, hidden }: UserCardRejectFormProps) {
  const { register, errors, reasonLength, submit } = useRejectUserCardForm(review);
  const serverMessage = errors.root?.server?.message;

  return (
    <form
      id={formId}
      noValidate
      hidden={hidden}
      aria-label="設為審核失敗"
      className="space-y-4"
      onSubmit={(event) => void submit(event)}
    >
      {serverMessage && <ReviewNotice tone="error">{serverMessage}</ReviewNotice>}

      <ReviewNotice tone="warning">
        <strong>設為審核失敗後無法復原。</strong>
        此卡號將不能再申請，需由會員先刪除這張卡片才能重新送出。
      </ReviewNotice>

      <ReviewFormField
        id="card-review-reason"
        label="失敗原因"
        required
        error={errors.reason?.message}
        hint="只記錄在後台；會員端只會看到「審核失敗」。"
      >
        {(control) => (
          <textarea
            {...control}
            {...register("reason")}
            rows={5}
            maxLength={REJECT_REASON_MAX_LENGTH}
            placeholder="例：會員提供的卡號與卡面資料不符"
            className={cn(fieldInputClass, "h-auto resize-y py-3 leading-relaxed")}
          />
        )}
      </ReviewFormField>
      <p className="text-right font-mono text-sm tabular-nums text-admin-muted">
        {reasonLength} / {REJECT_REASON_MAX_LENGTH}
      </p>
    </form>
  );
}
