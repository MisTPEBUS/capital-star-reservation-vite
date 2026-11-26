import type { AdminUserCard } from "../../../types/adminUserCard";
import type { UserCardReviewStatus } from "../../../types/userCard";
import type { ReviewListRow } from "../../utils/userCardReview";
import { ReviewActionButton, ReviewResultChip } from "./UserCardReviewRowParts";

interface UserCardReviewTableProps {
  status: UserCardReviewStatus;
  rows: ReviewListRow[];
  labelledBy: string;
  onOpenCard: (card: AdminUserCard) => void;
}

/** 桌機版列表（md 以上） */
export function UserCardReviewTable({
  status,
  rows,
  labelledBy,
  onOpenCard,
}: UserCardReviewTableProps) {
  const isPending = status === "PENDING";

  return (
    <div className="hidden overflow-x-auto md:block">
      <table
        aria-labelledby={labelledBy}
        className="w-full min-w-[44rem] border-collapse text-left"
      >
        <thead className="bg-admin-bg text-sm font-bold text-admin-muted">
          <tr>
            <th scope="col" className="px-5 py-3">申請會員</th>
            <th scope="col" className="px-5 py-3">
              {isPending ? "系統判定" : "審核結果"}
            </th>
            <th scope="col" className="px-5 py-3">
              {isPending ? "申請時間" : "審核時間"}
            </th>
            <th scope="col" className="px-5 py-3 text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ card, view }) => (
            <tr
              key={card.cardId}
              className="border-t border-admin-border/70 transition-colors hover:bg-admin-bg/40"
            >
              <td className="px-5 py-4">
                <p className="text-lg font-bold text-admin-text">
                  {view.applicantName}
                </p>
                <p className="mt-1 font-mono text-sm tabular-nums text-admin-muted">
                  {view.contact}
                </p>
              </td>
              <td className="px-5 py-4">
                <ReviewResultChip label={view.resultLabel} />
                {view.resultDetail && (
                  <p className="mt-1.5 text-sm text-admin-muted">
                    {view.resultDetail}
                  </p>
                )}
              </td>
              <td className="px-5 py-4">
                <p className="font-mono text-base tabular-nums text-admin-text">
                  {view.time}
                </p>
                {view.timeDetail && (
                  <p className="mt-1 text-sm text-admin-muted">
                    {view.timeDetail}
                  </p>
                )}
              </td>
              <td className="px-5 py-4 text-right">
                <ReviewActionButton
                  view={view}
                  onClick={() => onOpenCard(card)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
