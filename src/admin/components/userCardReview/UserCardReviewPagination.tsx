import { ChevronLeft, ChevronRight } from "lucide-react";
import { ADMIN_CARD_PAGE_SIZE } from "../../utils/userCardReview";
import { iconButtonClass } from "./styles";

interface UserCardReviewPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function UserCardReviewPagination({
  page,
  totalPages,
  onPageChange,
}: UserCardReviewPaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-admin-border px-4 py-3.5 sm:px-5">
      <p className="text-sm text-admin-muted">
        第 {page} 頁，共 {totalPages} 頁 · 每頁 {ADMIN_CARD_PAGE_SIZE} 筆
      </p>
      <nav aria-label="分頁" className="flex gap-2">
        <button
          type="button"
          aria-label="上一頁"
          className={iconButtonClass}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft aria-hidden="true" className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="下一頁"
          className={iconButtonClass}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight aria-hidden="true" className="h-5 w-5" />
        </button>
      </nav>
    </div>
  );
}
