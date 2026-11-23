import { CircleAlert, Trash2 } from "lucide-react";
import type { UserCard } from "../../../types/userCard";
import {
  USER_CARD_STATUS_LABEL,
  formatCardCreatedAt,
  formatCardNumber,
} from "../../../utils/userCards";
import { UserCardFaceArt } from "./UserCardFaceArt";
import { UserCardStatusBadge } from "./UserCardStatusBadge";

interface UserCardItemProps {
  card: UserCard;
  isRecentlyAdded?: boolean;
  onDeleteClick: (card: UserCard) => void;
}

export function UserCardItem({
  card,
  isRecentlyAdded = false,
  onDeleteClick,
}: UserCardItemProps) {
  const isRejected = card.reviewStatus === "REJECTED";
  const displayNumber = formatCardNumber(card.externalCardNo);

  return (
    <article
      aria-label={`悠遊卡 ${displayNumber}，${USER_CARD_STATUS_LABEL[card.reviewStatus]}`}
      className="flex flex-col gap-2.5 rounded-[22px] border border-ink-100 bg-white p-2.5 shadow-sm"
    >
      <div className="relative flex aspect-[1.586/1] flex-col justify-between overflow-hidden rounded-2xl border border-ink-100 bg-white px-4 py-4 shadow-md">
        <UserCardFaceArt muted={isRejected} />

        <div className="relative flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span className="text-base font-black tracking-wide text-green-700">
              悠遊卡
            </span>
            {isRecentlyAdded ? (
              <span className="rounded-full border border-green-300 bg-white px-2 py-0.5 text-xs font-black text-green-700">
                剛剛新增
              </span>
            ) : null}
          </span>
          <UserCardStatusBadge status={card.reviewStatus} />
        </div>

        <div className="relative">
          <p className="text-xs font-bold tracking-[0.16em] text-ink-500">卡號</p>
          <p className="mt-1 text-xl font-black tabular-nums tracking-wider text-ink-900 sm:text-2xl">
            {displayNumber}
          </p>
        </div>
      </div>

      {isRejected ? (
        <p className="mx-0.5 flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5 text-sm font-semibold leading-6 text-orange-800">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          此卡片無法使用。如確認卡號正確，請刪除後重新申請或洽客服。
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-2.5 pl-1.5 pr-1">
        <p className="text-sm font-semibold text-ink-500">
          申請時間 {formatCardCreatedAt(card.createdAt)}
        </p>
        <button
          type="button"
          onClick={() => onDeleteClick(card)}
          aria-label={`刪除卡片 ${displayNumber}`}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-ink-100 bg-white px-3.5 text-sm font-extrabold text-ink-700 hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bus-500"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          刪除
        </button>
      </div>
    </article>
  );
}
