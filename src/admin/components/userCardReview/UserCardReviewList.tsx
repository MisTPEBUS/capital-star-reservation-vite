import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminUserCard } from "../../../types/adminUserCard";
import type { UserCardReviewStatus } from "../../../types/userCard";
import type { UserCardReviewListResult } from "../../hooks/useUserCardReviewList";
import { toReviewRowView } from "../../utils/userCardReview";
import { ReviewNotice } from "./ReviewFormParts";
import { focusRingClass } from "./styles";
import { UserCardReviewCards } from "./UserCardReviewCards";
import {
  UserCardReviewEmpty,
  UserCardReviewError,
  UserCardReviewLoading,
} from "./UserCardReviewListStates";
import { UserCardReviewPagination } from "./UserCardReviewPagination";
import { UserCardReviewTable } from "./UserCardReviewTable";

const HEADING_ID = "card-review-list-heading";

const LIST_TITLE: Record<UserCardReviewStatus, string> = {
  PENDING: "審核中的卡片",
  APPROVED: "已通過的卡片",
  REJECTED: "審核失敗的卡片",
};

interface UserCardReviewListProps {
  status: UserCardReviewStatus;
  keyword: string;
  page: number;
  result: UserCardReviewListResult;
  onPageChange: (page: number) => void;
  onClearKeyword: () => void;
  onShowApproved: () => void;
  onOpenCard: (card: AdminUserCard) => void;
}

export function UserCardReviewList({
  status,
  keyword,
  page,
  result,
  onPageChange,
  onClearKeyword,
  onShowApproved,
  onOpenCard,
}: UserCardReviewListProps) {
  const { cards, totalCount, totalPages, isLoading, isRefreshing, errorMessage, retry } =
    result;
  const rows = cards.map((card) => ({ card, view: toReviewRowView(card) }));
  const hasRows = rows.length > 0;

  const countText = isLoading
    ? "讀取中…"
    : isRefreshing
      ? "更新中…"
      : `共 ${totalCount} 張`;

  const renderBody = () => {
    if (isLoading) return <UserCardReviewLoading />;
    if (errorMessage && !hasRows) {
      return <UserCardReviewError message={errorMessage} onRetry={retry} />;
    }
    if (!hasRows) {
      return (
        <UserCardReviewEmpty
          status={status}
          keyword={keyword}
          onShowApproved={onShowApproved}
        />
      );
    }

    return (
      <>
        <UserCardReviewTable
          status={status}
          rows={rows}
          labelledBy={HEADING_ID}
          onOpenCard={onOpenCard}
        />
        <UserCardReviewCards rows={rows} onOpenCard={onOpenCard} />
        <UserCardReviewPagination
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </>
    );
  };

  return (
    <section
      aria-labelledby={HEADING_ID}
      aria-busy={isLoading || isRefreshing}
      className="admin-panel-body overflow-hidden p-0"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-admin-border px-4 py-3.5 sm:px-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 id={HEADING_ID} className="text-lg font-bold text-admin-text">
            {LIST_TITLE[status]}
          </h2>
          {keyword && (
            <span className="inline-flex items-center gap-1 rounded-full border border-admin-borderStrong py-0.5 pl-3 pr-1 text-sm text-admin-softText">
              搜尋：{keyword}
              <button
                type="button"
                aria-label="清除搜尋條件"
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-full transition hover:bg-white/10",
                  focusRingClass,
                )}
                onClick={onClearKeyword}
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
        </div>
        <p aria-live="polite" className="text-base text-admin-muted">
          {countText}
        </p>
      </header>

      {errorMessage && hasRows && (
        <div className="border-b border-admin-border px-4 py-3 sm:px-5">
          <ReviewNotice tone="error">{errorMessage}</ReviewNotice>
        </div>
      )}

      {renderBody()}
    </section>
  );
}
