import { AdminUserCardApiError } from "../../api/admin/userCards";
import { getSexTitle } from "../../api/auth";
import {
  DEFAULT_CARD_CATEGORY_CODE,
  type ApproveUserCardFormInput,
} from "../../schemas/userCardReview";
import type {
  AdminUserCard,
  ApproveUserCardRequest,
  UserCardReviewReason,
} from "../../types/adminUserCard";
import type { UserCardReviewStatus, UserCardType } from "../../types/userCard";

export const ADMIN_CARD_PAGE_SIZE = 20;

export const REVIEW_STATUS_LABEL: Record<UserCardReviewStatus, string> = {
  PENDING: "審核中",
  APPROVED: "已通過",
  REJECTED: "審核失敗",
};

export const REVIEW_STATUS_OPTIONS: ReadonlyArray<{
  value: UserCardReviewStatus;
  label: string;
}> = [
  { value: "PENDING", label: REVIEW_STATUS_LABEL.PENDING },
  { value: "APPROVED", label: REVIEW_STATUS_LABEL.APPROVED },
  { value: "REJECTED", label: REVIEW_STATUS_LABEL.REJECTED },
];

const REVIEW_REASON_LABEL: Record<UserCardReviewReason, string> = {
  NOT_FOUND: "查無卡號",
  API_ERROR: "查詢服務異常",
  CARD_ABNORMAL: "卡片狀態異常",
  CARD_EXPIRED: "卡片已過期",
  MANUAL_REJECTED: "人工設為失敗",
};

const CARD_TYPE_LABEL: Record<UserCardType, string> = {
  EASY_CARD: "悠遊卡",
};

export function getReviewReasonLabel(reason: UserCardReviewReason | null) {
  return reason ? REVIEW_REASON_LABEL[reason] : "—";
}

/** 0912345678 → 0912-345-678；其他格式原樣顯示 */
export function formatPhone(phone: string) {
  return /^\d{10}$/.test(phone)
    ? `${phone.slice(0, 4)}-${phone.slice(4, 7)}-${phone.slice(7)}`
    : phone;
}

/** 姓氏＋稱謂（王先生）；沒有姓氏時退回 LINE 顯示名稱 */
export function getApplicantName(
  card: Pick<AdminUserCard, "firstName" | "sex" | "displayName">,
) {
  const firstName = card.firstName?.trim();
  if (firstName) return `${firstName}${getSexTitle(card.sex)}`;
  return card.displayName?.trim() || "未提供姓名";
}

/** 識別碼優先；沒有識別碼才顯示電話 */
export function getApplicantContact(
  card: Pick<AdminUserCard, "activeCode" | "phone">,
): { label: "識別碼" | "電話"; value: string } {
  if (card.activeCode) return { label: "識別碼", value: card.activeCode };
  if (card.phone) return { label: "電話", value: formatPhone(card.phone) };
  return { label: "識別碼", value: "—" };
}

/** yyyy-MM-dd HH:mm:ss → yyyy-MM-dd HH:mm */
export function formatMinute(value: string | null) {
  return value ? value.slice(0, 16) : "—";
}

/** 列表與手機卡片共用的顯示資料 */
export interface ReviewRowView {
  applicantName: string;
  contact: string;
  resultLabel: string;
  resultDetail: string | null;
  time: string;
  timeDetail: string | null;
  isPending: boolean;
  actionLabel: "審核" | "檢視";
  accessibleActionLabel: string;
}

export interface ReviewListRow {
  card: AdminUserCard;
  view: ReviewRowView;
}

function getReviewResult(card: AdminUserCard) {
  if (card.reviewStatus === "APPROVED") {
    return {
      resultLabel: card.reviewedBy ? "人工審核通過" : "系統自動通過",
      resultDetail: card.expiryDate ? `有效至 ${card.expiryDate}` : null,
    };
  }

  return {
    resultLabel: getReviewReasonLabel(card.reviewReason),
    resultDetail: card.reviewStatus === "REJECTED" ? card.reviewNote : null,
  };
}

export function toReviewRowView(card: AdminUserCard): ReviewRowView {
  const isPending = card.reviewStatus === "PENDING";
  const actionLabel = isPending ? "審核" : "檢視";
  const applicantName = getApplicantName(card);

  return {
    applicantName,
    contact: getApplicantContact(card).value,
    ...getReviewResult(card),
    time: formatMinute(isPending ? card.createdAt : card.reviewedAt),
    timeDetail: isPending ? null : `申請 ${formatMinute(card.createdAt)}`,
    isPending,
    actionLabel,
    accessibleActionLabel: `${actionLabel} ${applicantName} 的卡片`,
  };
}

export interface DetailItem {
  label: string;
  value: string;
  mono?: boolean;
}

export function getApplicantItems(card: AdminUserCard): DetailItem[] {
  const contact = getApplicantContact(card);

  return [
    { label: "申請會員", value: getApplicantName(card) },
    { label: contact.label, value: contact.value, mono: true },
    { label: "卡別", value: CARD_TYPE_LABEL[card.cardType] },
    { label: "外碼（卡面卡號）", value: card.externalCardNo, mono: true },
    { label: "系統判定", value: getReviewReasonLabel(card.reviewReason) },
    { label: "申請時間", value: formatMinute(card.createdAt), mono: true },
  ];
}

export function getCardDataItems(card: AdminUserCard): DetailItem[] {
  const orMissing = (value: string | null) => value || "未提供";

  return [
    { label: "晶片卡號（內碼）", value: orMissing(card.internalCardNo), mono: true },
    { label: "有效日期", value: orMissing(card.expiryDate), mono: true },
    { label: "卡種身分", value: orMissing(card.cardCategoryCode), mono: true },
    { label: "卡片狀態", value: orMissing(card.cardStatusCode), mono: true },
    { label: "記名狀態", value: orMissing(card.registeredStatus), mono: true },
    { label: "身份別", value: orMissing(card.identityCode), mono: true },
    { label: "地區", value: orMissing(card.areaCode), mono: true },
  ];
}

export function getReviewRecordItems(card: AdminUserCard): DetailItem[] {
  const items: DetailItem[] = [
    { label: "審核結果", value: REVIEW_STATUS_LABEL[card.reviewStatus] },
    { label: "審核方式", value: card.reviewedBy ? "人工審核" : "系統自動判定" },
    { label: "審核時間", value: formatMinute(card.reviewedAt), mono: true },
  ];

  if (card.reviewNote) items.push({ label: "失敗原因", value: card.reviewNote });
  return items;
}

/** 通過表單只帶入可編輯的內碼 */
export function createApproveDefaults(
  card: AdminUserCard,
): ApproveUserCardFormInput {
  return {
    internalCardNo: card.internalCardNo ?? "",
  };
}

/** 隱藏欄位沿用卡片原值；沒有卡種身分時送預設 00 */
export function createApproveRequest(
  card: AdminUserCard,
  internalCardNo: string,
): ApproveUserCardRequest {
  return {
    internalCardNo,
    expiryDate: card.expiryDate ?? null,
    cardCategoryCode: card.cardCategoryCode?.trim() || DEFAULT_CARD_CATEGORY_CODE,
  };
}

export type ReviewFieldName =
  | "internalCardNo"
  | "expiryDate"
  | "cardCategoryCode"
  | "reason";

export type ReviewFieldErrors = Partial<Record<ReviewFieldName, string>>;

/**
 * stale：卡片已不存在或已被處理，應關閉面板並重新整理列表。
 * form：留在面板，顯示表單錯誤與欄位錯誤。
 */
export type ReviewErrorResult =
  | { kind: "stale"; message: string }
  | { kind: "form"; message: string; fieldErrors: ReviewFieldErrors };

const ALREADY_REVIEWED_MESSAGE = "此卡片已完成審核";
const DUPLICATE_INTERNAL_NO_MESSAGE = "此內碼已被其他卡片使用";

const SERVER_FIELD_MAP: Record<string, ReviewFieldName> = {
  internalcardno: "internalCardNo",
  expirydate: "expiryDate",
  cardcategorycode: "cardCategoryCode",
  reason: "reason",
};

/** 後端欄位鍵依 ASP.NET Core ModelState 而定（例如 ExpiryDate），比對時忽略大小寫 */
function mapServerFieldErrors(
  errors: Record<string, string[]> | null,
): ReviewFieldErrors {
  const result: ReviewFieldErrors = {};
  if (!errors) return result;

  for (const [key, messages] of Object.entries(errors)) {
    const field = SERVER_FIELD_MAP[key.toLowerCase()];
    if (field && messages[0]) result[field] = messages[0];
  }

  return result;
}

export function resolveReviewError(error: unknown): ReviewErrorResult {
  if (!(error instanceof AdminUserCardApiError)) {
    return { kind: "form", message: "送出失敗，請稍後再試。", fieldErrors: {} };
  }

  if (error.status === 404) {
    return { kind: "stale", message: "找不到這張卡片，可能已被會員刪除。" };
  }

  if (error.status === 409 && error.message === ALREADY_REVIEWED_MESSAGE) {
    return { kind: "stale", message: "這張卡片已完成審核，列表已重新整理。" };
  }

  if (error.status === 409 && error.message === DUPLICATE_INTERNAL_NO_MESSAGE) {
    return {
      kind: "form",
      message: "審核未送出：此內碼已被其他卡片使用，請再次核對晶片卡號。",
      fieldErrors: { internalCardNo: "此內碼已被其他已通過的卡片使用" },
    };
  }

  return {
    kind: "form",
    message: error.message,
    fieldErrors: mapServerFieldErrors(error.fieldErrors),
  };
}
