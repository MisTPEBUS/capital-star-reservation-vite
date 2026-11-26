import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  approveUserCardSchema,
  rejectUserCardSchema,
  type ApproveUserCardFormInput,
  type ApproveUserCardFormOutput,
  type RejectUserCardFormInput,
  type RejectUserCardFormOutput,
} from "../../schemas/userCardReview";
import type { AdminUserCard } from "../../types/adminUserCard";
import {
  createApproveDefaults,
  createApproveRequest,
} from "../utils/userCardReview";
import type { ReviewUserCard } from "./useReviewUserCard";

/** 補資料並通過的表單；後端回傳的欄位錯誤會標回對應欄位 */
export function useApproveUserCardForm(
  card: AdminUserCard,
  review: ReviewUserCard,
) {
  const { register, handleSubmit, setError, formState } = useForm<
    ApproveUserCardFormInput,
    unknown,
    ApproveUserCardFormOutput
  >({
    resolver: zodResolver(approveUserCardSchema),
    defaultValues: createApproveDefaults(card),
  });

  const submit = handleSubmit((values) => {
    review({ type: "approve", body: createApproveRequest(card, values.internalCardNo) }, (error) => {
      const hiddenFieldError =
        error.fieldErrors.expiryDate ?? error.fieldErrors.cardCategoryCode;
      setError("root.server", {
        message: hiddenFieldError
          ? `${error.message}：${hiddenFieldError}`
          : error.message,
      });
      if (error.fieldErrors.internalCardNo) {
        setError("internalCardNo", {
          type: "server",
          message: error.fieldErrors.internalCardNo,
        });
      }
    });
  });

  return {
    register,
    errors: formState.errors,
    submit,
  };
}

/** 設為審核失敗的表單 */
export function useRejectUserCardForm(review: ReviewUserCard) {
  const { register, handleSubmit, setError, watch, formState } = useForm<
    RejectUserCardFormInput,
    unknown,
    RejectUserCardFormOutput
  >({
    resolver: zodResolver(rejectUserCardSchema),
    defaultValues: { reason: "" },
  });

  const submit = handleSubmit((values) => {
    review({ type: "reject", body: values }, (error) => {
      setError("root.server", { message: error.message });
      const message = error.fieldErrors.reason;
      if (message) setError("reason", { type: "server", message });
    });
  });

  return {
    register,
    errors: formState.errors,
    reasonLength: watch("reason").length,
    submit,
  };
}
