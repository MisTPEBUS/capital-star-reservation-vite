import { z } from "zod";

export const INTERNAL_CARD_NO_MAX_LENGTH = 20;
export const REJECT_REASON_MAX_LENGTH = 1000;
export const DEFAULT_CARD_CATEGORY_CODE = "00";

/** 人工通過時只需輸入內碼；其餘 API 欄位由卡片資料與預設值補齊 */
export const approveUserCardSchema = z.object({
  internalCardNo: z
    .string()
    .trim()
    .min(1, "請輸入晶片卡號（內碼）")
    .max(
      INTERNAL_CARD_NO_MAX_LENGTH,
      `內碼最多 ${INTERNAL_CARD_NO_MAX_LENGTH} 字元`,
    ),
});

/** 設為審核失敗：原因必填、不可只有空白、最多 1000 字 */
export const rejectUserCardSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "請輸入失敗原因")
    .max(
      REJECT_REASON_MAX_LENGTH,
      `失敗原因最多 ${REJECT_REASON_MAX_LENGTH} 字`,
    ),
});

export type ApproveUserCardFormInput = z.input<typeof approveUserCardSchema>;
export type ApproveUserCardFormOutput = z.output<typeof approveUserCardSchema>;
export type RejectUserCardFormInput = z.input<typeof rejectUserCardSchema>;
export type RejectUserCardFormOutput = z.output<typeof rejectUserCardSchema>;
