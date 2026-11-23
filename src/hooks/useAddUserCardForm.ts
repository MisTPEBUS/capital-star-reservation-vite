import { useState, type FormEvent } from "react";
import type { UserCard, UserCardFeedback } from "../types/userCard";
import {
  getUserCardErrorFeedback,
  isCardLimitError,
  normalizeCardNumber,
  validateNewCardNumber,
} from "../utils/userCards";

interface UseAddUserCardFormOptions {
  existingCards: UserCard[];
  addCard: (cardNumber: string) => Promise<UserCard>;
  onAdded: (card: UserCard) => void;
  /** 後端回報已達上限時通知外層重新取得列表 */
  onLimitReached: () => void;
}

/** 新增卡片表單：輸入正規化、前端檢查、送出與錯誤文案 */
export function useAddUserCardForm({
  existingCards,
  addCard,
  onAdded,
  onLimitReached,
}: UseAddUserCardFormOptions) {
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<UserCardFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cardNumber = normalizeCardNumber(value);

  const changeValue = (nextValue: string) => {
    setValue(nextValue);
    setFeedback(null);
  };

  const reset = () => {
    setValue("");
    setFeedback(null);
  };

  const submit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (isSubmitting) return;

    const validationFeedback = validateNewCardNumber(cardNumber, existingCards);
    if (validationFeedback) {
      setFeedback(validationFeedback);
      return;
    }

    setIsSubmitting(true);

    try {
      const createdCard = await addCard(cardNumber);
      reset();
      onAdded(createdCard);
    } catch (error) {
      console.error("USER_CARD_CREATE_ERROR:", error);
      setFeedback(getUserCardErrorFeedback(error, "卡片申請失敗，請稍後再試"));

      if (isCardLimitError(error)) {
        onLimitReached();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    value,
    cardNumberLength: cardNumber.length,
    feedback,
    isSubmitting,
    changeValue,
    submit,
    reset,
  };
}
