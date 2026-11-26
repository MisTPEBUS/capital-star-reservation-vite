import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  approveAdminUserCard,
  rejectAdminUserCard,
} from "../../api/admin/userCards";
import type {
  ApproveUserCardRequest,
  RejectUserCardRequest,
} from "../../types/adminUserCard";
import {
  resolveReviewError,
  type ReviewErrorResult,
} from "../utils/userCardReview";
import { adminUserCardKeys } from "./adminUserCardKeys";

export type ReviewAction =
  | { type: "approve"; body: ApproveUserCardRequest }
  | { type: "reject"; body: RejectUserCardRequest };

export type ReviewFormError = Extract<ReviewErrorResult, { kind: "form" }>;

/** 送出審核；表單層級錯誤（400、內碼重複）交由呼叫端顯示在表單上 */
export type ReviewUserCard = (
  action: ReviewAction,
  onFormError: (error: ReviewFormError) => void,
) => void;

interface UseReviewUserCardOptions {
  /** 審核成功，參數為後端回傳的成功訊息 */
  onReviewed: (message: string) => void;
  /** 卡片已不存在或已被其他人處理 */
  onStale: (message: string) => void;
}

const SUCCESS_FALLBACK: Record<ReviewAction["type"], string> = {
  approve: "卡片已審核通過",
  reject: "卡片已設為審核失敗",
};

export function useReviewUserCard(
  cardId: string,
  { onReviewed, onStale }: UseReviewUserCardOptions,
) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationKey: adminUserCardKeys.review,
    mutationFn: (action: ReviewAction) =>
      action.type === "approve"
        ? approveAdminUserCard(cardId, action.body)
        : rejectAdminUserCard(cardId, action.body),
  });

  const refreshList = () =>
    void queryClient.invalidateQueries({ queryKey: adminUserCardKeys.all });

  const review: ReviewUserCard = (action, onFormError) => {
    mutation.mutate(action, {
      onSuccess: (message) => {
        refreshList();
        onReviewed(message || SUCCESS_FALLBACK[action.type]);
      },
      onError: (error) => {
        const result = resolveReviewError(error);
        if (result.kind === "stale") {
          refreshList();
          onStale(result.message);
          return;
        }
        onFormError(result);
      },
    });
  };

  return { review, isSubmitting: mutation.isPending };
}
