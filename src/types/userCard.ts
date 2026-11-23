export type UserCardType = "EASY_CARD";

export type UserCardReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

/** GET / POST /api/v1/cards 回傳的會員卡片（不含內碼與審核原因） */
export interface UserCard {
  cardId: string;
  cardType: UserCardType;
  /** 外碼（卡面卡號），純數字 */
  externalCardNo: string;
  reviewStatus: UserCardReviewStatus;
  /** 台北時間，格式 yyyy-MM-dd HH:mm:ss */
  createdAt: string;
}

/** POST /api/v1/cards 的 request body */
export interface CreateUserCardRequest {
  cardNumber: string;
}

export type UserCardsLoadStatus = "idle" | "loading" | "success" | "error";

/** 顯示給乘客的錯誤或提示文案 */
export interface UserCardFeedback {
  title: string;
  description?: string;
}
