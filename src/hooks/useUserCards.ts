import { useCallback, useEffect, useRef, useState } from "react";
import { createUserCard, deleteUserCard, getUserCards } from "../api/userCards";
import type { UserCard, UserCardsLoadStatus } from "../types/userCard";

interface UseUserCardsOptions {
  /** false 時不自動載入，例如會員資料尚未就緒 */
  enabled?: boolean;
}

/**
 * 會員卡片列表：載入、新增、刪除。
 * 新增、刪除成功後先以 API 回應更新畫面，再於背景重新取得列表，以後端資料為準。
 */
export function useUserCards({ enabled = true }: UseUserCardsOptions = {}) {
  const [cards, setCards] = useState<UserCard[]>([]);
  const [status, setStatus] = useState<UserCardsLoadStatus>("idle");
  const [error, setError] = useState<unknown>(null);
  const latestRequestId = useRef(0);

  const fetchCards = useCallback(async (isBackgroundSync: boolean) => {
    const requestId = ++latestRequestId.current;

    if (!isBackgroundSync) {
      setStatus("loading");
      setError(null);
    }

    try {
      const nextCards = await getUserCards();
      if (requestId !== latestRequestId.current) return;

      setCards(nextCards);
      setError(null);
      setStatus("success");
    } catch (fetchError) {
      if (requestId !== latestRequestId.current) return;

      console.error("USER_CARDS_LOAD_ERROR:", fetchError);
      setError(fetchError);
      // 背景同步失敗時保留目前畫面；若取代了尚未完成的載入，則顯示錯誤
      setStatus((current) => (current === "success" ? current : "error"));
    }
  }, []);

  const reload = useCallback(() => fetchCards(false), [fetchCards]);

  useEffect(() => {
    if (enabled) {
      void fetchCards(false);
    }
  }, [enabled, fetchCards]);

  const addCard = useCallback(
    async (cardNumber: string) => {
      const createdCard = await createUserCard(cardNumber);

      setCards((current) => [
        createdCard,
        ...current.filter((card) => card.cardId !== createdCard.cardId),
      ]);
      void fetchCards(true);

      return createdCard;
    },
    [fetchCards],
  );

  const removeCard = useCallback(
    async (cardId: string) => {
      await deleteUserCard(cardId);

      setCards((current) => current.filter((card) => card.cardId !== cardId));
      void fetchCards(true);
    },
    [fetchCards],
  );

  return { cards, status, error, reload, addCard, removeCard };
}
