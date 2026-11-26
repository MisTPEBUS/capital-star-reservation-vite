import type { AdminUserCard } from "../../../types/adminUserCard";
import {
  getApplicantItems,
  getCardDataItems,
  getReviewRecordItems,
} from "../../utils/userCardReview";
import { ReviewSheetActions, ReviewSheetBody } from "./ReviewSheetLayout";
import { outlineButtonClass } from "./styles";
import { UserCardDetailSection } from "./UserCardDetailSection";

interface UserCardReviewedDetailsProps {
  card: AdminUserCard;
  onClose: () => void;
}

/** 已通過或審核失敗的卡片：唯讀檢視 */
export function UserCardReviewedDetails({ card, onClose }: UserCardReviewedDetailsProps) {
  return (
    <>
      <ReviewSheetBody>
        <UserCardDetailSection title="申請資料" items={getApplicantItems(card)} />
        <UserCardDetailSection title="卡片資料" items={getCardDataItems(card)} />
        <UserCardDetailSection
          title="審核紀錄"
          items={getReviewRecordItems(card)}
          layout="rows"
        />
      </ReviewSheetBody>
      <ReviewSheetActions>
        <button type="button" className={outlineButtonClass} onClick={onClose}>
          關閉
        </button>
      </ReviewSheetActions>
    </>
  );
}
