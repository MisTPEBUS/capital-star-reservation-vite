import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Toast, type ToastMessage } from "../components/Toast";
import { AddUserCardSheet } from "../components/features/userCards/AddUserCardSheet";
import { DeleteUserCardSheet } from "../components/features/userCards/DeleteUserCardSheet";
import { UserCardEmptyState } from "../components/features/userCards/UserCardEmptyState";
import { UserCardItem } from "../components/features/userCards/UserCardItem";
import { UserCardQuota } from "../components/features/userCards/UserCardQuota";
import {
  UserCardsLoadError,
  UserCardsSkeleton,
} from "../components/features/userCards/UserCardsStatusViews";
import { useUserCards } from "../hooks/useUserCards";
import type { UserCard, UserCardReviewStatus } from "../types/userCard";
import {
  MAX_USER_CARDS,
  getUserCardErrorFeedback,
  isCardNotFoundError,
} from "../utils/userCards";

const LIMIT_HINT_ID = "user-card-limit-hint";

/** 新增成功（201）後依回傳的審核狀態顯示提示 */
const CREATED_CARD_TOASTS: Record<UserCardReviewStatus, ToastMessage> = {
  APPROVED: { type: "success", message: "卡片綁定成功，可以開始使用" },
  PENDING: { type: "success", message: "卡片申請已送出，目前為審核中" },
  REJECTED: { type: "error", message: "卡片審核未通過，請確認卡號是否正確" },
};

export function UserCardsPage() {
  const navigate = useNavigate();
  const { cards, status, error, reload, addCard, removeCard } = useUserCards();
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<UserCard | null>(null);
  const [recentlyAddedCardId, setRecentlyAddedCardId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  // Toast 以 onClose 作為計時 effect 的依賴，需維持穩定參照
  const closeToast = useCallback(() => setToast(null), []);

  const isFull = cards.length >= MAX_USER_CARDS;

  const handleCardAdded = (card: UserCard) => {
    setIsAddSheetOpen(false);
    setRecentlyAddedCardId(card.cardId);
    setToast(CREATED_CARD_TOASTS[card.reviewStatus]);
  };

  const handleDeleteConfirm = async (card: UserCard) => {
    try {
      await removeCard(card.cardId);
      setCardToDelete(null);
      setToast({ type: "success", message: "卡片已刪除" });
    } catch (deleteError) {
      if (!isCardNotFoundError(deleteError)) throw deleteError;

      // 卡片已不存在：關閉面板並以後端資料更新列表
      setCardToDelete(null);
      setToast({ type: "info", message: "這張卡片已不存在，已為您更新列表" });
      void reload();
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d7f3ff_0,#f7fbff_35%,#fff8e6_100%)] text-ink-900">
      <header className="sticky top-0 z-30 border-b border-bus-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[820px] items-center gap-1 pl-1.5 pr-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            aria-label="返回首頁"
            className="grid size-11 place-items-center rounded-[14px] text-bus-700 hover:bg-bus-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bus-500"
          >
            <ChevronLeft className="size-7" aria-hidden="true" />
          </button>
          <h1 className="text-xl font-black">我的乘車卡</h1>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[820px] flex-col gap-3 px-3 pb-28 pt-3">
        {status === "idle" || status === "loading" ? <UserCardsSkeleton /> : null}

        {status === "error" ? (
          <UserCardsLoadError
            feedback={getUserCardErrorFeedback(error, "請檢查網路連線後再試一次。")}
            onRetry={reload}
          />
        ) : null}

        {status === "success" ? (
          <>
            <UserCardQuota
              count={cards.length}
              max={MAX_USER_CARDS}
              limitHintId={LIMIT_HINT_ID}
            />
            {cards.length === 0 ? (
              <UserCardEmptyState />
            ) : (
              <ul className="grid gap-3 md:grid-cols-2">
                {cards.map((card) => (
                  <li key={card.cardId}>
                    <UserCardItem
                      card={card}
                      isRecentlyAdded={card.cardId === recentlyAddedCardId}
                      onDeleteClick={setCardToDelete}
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : null}
      </div>

      {status === "success" ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-bus-100 bg-white/95 px-4 pb-4 pt-3 shadow-[0_-12px_30px_rgba(7,43,80,0.12)] backdrop-blur">
          <div className="mx-auto w-full max-w-[820px]">
            <button
              type="button"
              onClick={() => setIsAddSheetOpen(true)}
              disabled={isFull}
              aria-describedby={isFull ? LIMIT_HINT_ID : undefined}
              className={cn(
                "flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-lg font-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bus-100",
                isFull
                  ? "cursor-not-allowed bg-ink-100 text-ink-500"
                  : "bg-bus-900 text-white shadow-card hover:bg-bus-700",
              )}
            >
              <Plus className="size-5" strokeWidth={2.8} aria-hidden="true" />
              新增卡片
            </button>
          </div>
        </div>
      ) : null}

      <AddUserCardSheet
        open={isAddSheetOpen}
        onOpenChange={setIsAddSheetOpen}
        existingCards={cards}
        addCard={addCard}
        onAdded={handleCardAdded}
        onLimitReached={() => void reload()}
      />
      <DeleteUserCardSheet
        key={cardToDelete?.cardId ?? "none"}
        card={cardToDelete}
        onClose={() => setCardToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
      <Toast toast={toast} onClose={closeToast} className="bottom-24" />
    </main>
  );
}
