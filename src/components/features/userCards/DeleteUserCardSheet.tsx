import { useState } from "react";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { BottomSheet } from "../../common/BottomSheet";
import type { UserCard, UserCardFeedback } from "../../../types/userCard";
import {
  formatCardNumber,
  getUserCardErrorFeedback,
} from "../../../utils/userCards";

interface DeleteUserCardSheetProps {
  /** 要刪除的卡片；null 時關閉面板 */
  card: UserCard | null;
  onClose: () => void;
  /** 成功時由外層關閉面板；失敗時拋出錯誤，顯示於面板內 */
  onConfirm: (card: UserCard) => Promise<void>;
}

export function DeleteUserCardSheet({
  card,
  onClose,
  onConfirm,
}: DeleteUserCardSheetProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<UserCardFeedback | null>(null);

  const handleConfirm = async () => {
    if (!card || isDeleting) return;

    setIsDeleting(true);
    setFeedback(null);

    try {
      await onConfirm(card);
    } catch (error) {
      console.error("USER_CARD_DELETE_ERROR:", error);
      setFeedback(getUserCardErrorFeedback(error, "刪除失敗，請稍後再試"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <BottomSheet
      open={card !== null}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      title="刪除這張卡片？"
      description="刪除後無法復原。若之後要使用，需要重新申請並等待審核。"
      dismissible={!isDeleting}
      role="alertdialog"
    >
      <div className="mt-4 flex flex-col gap-4">
        <p className="rounded-2xl border border-ink-100 bg-ink-50 p-4 text-center text-[28px] font-black tabular-nums tracking-wider text-ink-900">
          {card ? formatCardNumber(card.externalCardNo) : ""}
        </p>

        {feedback ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5 text-sm font-bold leading-6 text-orange-800"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {feedback.title}
          </p>
        ) : null}

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-red-600 text-lg font-black text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200 disabled:cursor-wait disabled:opacity-80"
          >
            {isDeleting ? (
              <>
                <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
                刪除中…
              </>
            ) : (
              "確定刪除"
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="h-14 rounded-2xl border border-ink-100 bg-white text-base font-extrabold text-ink-700 hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bus-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            取消
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
