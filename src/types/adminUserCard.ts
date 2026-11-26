import type { UserCardReviewStatus, UserCardType } from "./userCard";

/** 審核原因：系統自動判定或人工設為失敗；通過時為 null */
export type UserCardReviewReason =
  | "NOT_FOUND"
  | "API_ERROR"
  | "CARD_ABNORMAL"
  | "CARD_EXPIRED"
  | "MANUAL_REJECTED";

/** GET /api/v1/admin/cards 列表中的卡片（含完整審核欄位） */
export interface AdminUserCard {
  cardId: string;
  userId: string;
  /** 會員識別碼；沒有時畫面改顯示電話 */
  activeCode: string | null;
  /** LINE 顯示名稱；姓氏未提供時作為備用 */
  displayName: string | null;
  /** 會員姓氏；未填寫時為 null */
  firstName: string | null;
  /** 會員性別（MALE / FEMALE）；未填寫時為 null */
  sex: string | null;
  phone: string | null;
  cardType: UserCardType;
  /** 外碼（卡面卡號） */
  externalCardNo: string;
  /** 晶片卡號（內碼） */
  internalCardNo: string | null;
  providerResultCode: string | null;
  cardStatusCode: string | null;
  registeredStatus: string | null;
  /** yyyy-MM-dd */
  expiryDate: string | null;
  cardCategoryCode: string | null;
  identityCode: string | null;
  areaCode: string | null;
  reviewStatus: UserCardReviewStatus;
  reviewReason: UserCardReviewReason | null;
  /** 人工設為失敗時填寫的原因 */
  reviewNote: string | null;
  /** 審核人 userId；null 代表系統自動判定 */
  reviewedBy: string | null;
  /** 台北時間 yyyy-MM-dd HH:mm:ss */
  reviewedAt: string | null;
  /** 台北時間 yyyy-MM-dd HH:mm:ss */
  createdAt: string;
}

/** GET /api/v1/admin/cards 查詢參數 */
export interface AdminUserCardQuery {
  status: UserCardReviewStatus;
  /** 搜尋外碼、內碼、識別碼、姓名、電話；空字串代表不篩選 */
  keyword: string;
  page: number;
  pageSize: number;
}

/** GET /api/v1/admin/cards 分頁結果 */
export interface AdminUserCardPage {
  items: AdminUserCard[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * POST /api/v1/admin/cards/{cardId}/approve
 * 畫面只輸入內碼；有效日期與卡種身分由現有資料及預設值補齊。
 */
export interface ApproveUserCardRequest {
  internalCardNo: string;
  /** yyyy-MM-dd；未知時為 null，後端保留原值 */
  expiryDate: string | null;
  cardCategoryCode: string;
}

/** POST /api/v1/admin/cards/{cardId}/reject */
export interface RejectUserCardRequest {
  reason: string;
}
