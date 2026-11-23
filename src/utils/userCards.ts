import { UserCardApiError } from "../api/userCards";
import type {
  UserCard,
  UserCardFeedback,
  UserCardReviewStatus,
} from "../types/userCard";

export const MAX_USER_CARDS = 5;
export const CARD_NUMBER_MAX_LENGTH = 20;

const CARD_NUMBER_PATTERN = /^\d{1,20}$/;
const LIMIT_REACHED_MESSAGE = "已達卡片數量上限";
const ALREADY_APPLIED_MESSAGE = "此卡號已申請";
const REJECTED_CARD_MESSAGE = "此卡號審核未通過，無法再次申請";
const CONTACT_SERVICE_HINT = "若不是您本人申請，請洽各轉運站服務專線。";

export const USER_CARD_STATUS_LABEL: Record<UserCardReviewStatus, string> = {
  PENDING: "審核中",
  APPROVED: "使用中",
  REJECTED: "審核失敗",
};

/** 移除所有空白：乘客可能依卡面分組輸入或貼上帶空格的卡號 */
export function normalizeCardNumber(value: string): string {
  return value.replace(/\s+/g, "");
}

export function isValidCardNumber(cardNumber: string): boolean {
  return CARD_NUMBER_PATTERN.test(cardNumber);
}

/** 每 4 碼分組顯示：4293430073 → 4293 4300 73 */
export function formatCardNumber(cardNumber: string): string {
  return cardNumber.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** yyyy-MM-dd HH:mm:ss → yyyy-MM-dd HH:mm */
export function formatCardCreatedAt(createdAt: string): string {
  return createdAt.slice(0, 16);
}

/**
 * 送出前的前端檢查，通過時回傳 null。
 * 卡號已在自己的列表時直接提示，不呼叫 API。
 */
export function validateNewCardNumber(
  cardNumber: string,
  existingCards: UserCard[],
): UserCardFeedback | null {
  if (!isValidCardNumber(cardNumber)) {
    return { title: "卡號格式錯誤，請輸入 1–20 位數字" };
  }

  const existingCard = existingCards.find(
    (card) => card.externalCardNo === cardNumber,
  );

  if (existingCard?.reviewStatus === "REJECTED") {
    return {
      title: "這張卡審核未通過",
      description: "請先刪除列表中審核失敗的卡片，再重新申請。",
    };
  }

  if (existingCard) {
    return { title: "這張卡已在您的卡片列表中" };
  }

  if (existingCards.length >= MAX_USER_CARDS) {
    return { title: "已達 5 張上限，請先刪除不需要的卡片" };
  }

  return null;
}

export function isCardLimitError(error: unknown): boolean {
  return (
    error instanceof UserCardApiError &&
    error.status === 409 &&
    error.message === LIMIT_REACHED_MESSAGE
  );
}

export function isCardNotFoundError(error: unknown): boolean {
  return error instanceof UserCardApiError && error.status === 404;
}

/** 將 API 錯誤轉成乘客看得懂的文案（對應設計稿「API 錯誤對應」） */
export function getUserCardErrorFeedback(
  error: unknown,
  fallbackTitle: string,
): UserCardFeedback {
  if (!(error instanceof UserCardApiError)) {
    return { title: fallbackTitle };
  }

  switch (error.status) {
    case null:
      return { title: "網路連線不穩定，請稍後再試" };
    case 400:
      return { title: "卡號格式錯誤，請輸入 1–20 位數字" };
    case 401:
      return { title: "登入已失效，請從 LINE 重新開啟此頁面" };
    case 404:
      return { title: "這張卡片已不存在，已為您更新列表" };
    case 409:
      if (error.message === LIMIT_REACHED_MESSAGE) {
        return { title: "已達 5 張上限，請先刪除不需要的卡片" };
      }
      if (error.message === ALREADY_APPLIED_MESSAGE) {
        return {
          title: ALREADY_APPLIED_MESSAGE,
          description: `這張卡已被其他帳號綁定或正在審核中。${CONTACT_SERVICE_HINT}`,
        };
      }
      if (error.message === REJECTED_CARD_MESSAGE) {
        return { title: REJECTED_CARD_MESSAGE, description: CONTACT_SERVICE_HINT };
      }
      return { title: error.message || fallbackTitle };
    case 503:
      return { title: "服務暫時無法使用，請稍後再試" };
    default:
      return { title: fallbackTitle };
  }
}
