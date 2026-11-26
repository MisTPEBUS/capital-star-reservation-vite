import type { AdminUserCard } from "../../../types/adminUserCard";
import type { ReviewListRow } from "../../utils/userCardReview";
import { ReviewActionButton, ReviewResultChip } from "./UserCardReviewRowParts";

interface UserCardReviewCardsProps {
  rows: ReviewListRow[];
  onOpenCard: (card: AdminUserCard) => void;
}

/** 手機版列表（md 以下），每張卡片一個區塊 */
export function UserCardReviewCards({ rows, onOpenCard }: UserCardReviewCardsProps) {
  return (
    <ul className="space-y-3 p-3 md:hidden">
      {rows.map(({ card, view }) => {
        const headingId = `card-review-mobile-${card.cardId}`;

        return (
          <li key={card.cardId}>
            <article
              aria-labelledby={headingId}
              className="overflow-hidden rounded-adminCard border border-admin-borderStrong bg-admin-surface"
            >
              <div className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <h3 id={headingId} className="text-lg font-bold text-admin-text">
                    {view.applicantName}
                  </h3>
                  <p className="mt-1 font-mono text-sm tabular-nums text-admin-muted">
                    {view.contact}
                  </p>
                </div>
                <ReviewResultChip label={view.resultLabel} />
              </div>

              <dl className="grid gap-3 border-t border-admin-border px-4 py-3">
                <div>
                  <dt className="text-sm text-admin-muted">
                    {view.isPending ? "申請時間" : "審核時間"}
                  </dt>
                  <dd className="mt-0.5 font-mono text-base tabular-nums text-admin-text">
                    {view.time}
                  </dd>
                </div>
                {view.resultDetail && (
                  <div>
                    <dt className="text-sm text-admin-muted">備註</dt>
                    <dd className="mt-0.5 text-base text-admin-text">
                      {view.resultDetail}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="px-4 pb-4">
                <ReviewActionButton
                  view={view}
                  className="h-12 w-full"
                  onClick={() => onOpenCard(card)}
                />
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
