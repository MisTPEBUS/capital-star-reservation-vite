import type { FormEvent } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserCardReviewStatus } from "../../../types/userCard";
import { REVIEW_STATUS_OPTIONS } from "../../utils/userCardReview";
import { fieldInputClass, focusRingClass, outlineButtonClass } from "./styles";

interface UserCardReviewFiltersProps {
  status: UserCardReviewStatus;
  keywordInput: string;
  onStatusChange: (status: UserCardReviewStatus) => void;
  onKeywordInputChange: (value: string) => void;
  onSearch: () => void;
}

export function UserCardReviewFilters({
  status,
  keywordInput,
  onStatusChange,
  onKeywordInputChange,
  onSearch,
}: UserCardReviewFiltersProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch();
  };

  return (
    <section aria-label="篩選條件" className="admin-panel-body space-y-4 p-4 sm:p-5">
      <nav aria-label="目前位置">
        <ol className="flex gap-1.5 text-sm text-admin-muted">
          <li>審核管理</li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-semibold text-admin-text">
            乘車卡
          </li>
        </ol>
      </nav>

      <div className="flex flex-wrap items-end gap-4 border-t border-admin-border pt-4">
        <div className="flex flex-col gap-1.5">
          <p
            id="card-review-status-label"
            className="text-sm font-semibold text-admin-muted"
          >
            審核狀態
          </p>
          <div
            role="group"
            aria-labelledby="card-review-status-label"
            className="flex gap-1 rounded-adminControl border border-admin-borderStrong bg-admin-bg p-1"
          >
            {REVIEW_STATUS_OPTIONS.map((option) => {
              const isSelected = option.value === status;

              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isSelected}
                  className={cn(
                    "h-11 rounded-lg px-5 text-base font-bold transition",
                    isSelected
                      ? "bg-admin-text text-admin-bg"
                      : "text-admin-softText hover:bg-white/10",
                    focusRingClass,
                  )}
                  onClick={() => onStatusChange(option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <form
          role="search"
          className="flex min-w-0 flex-1 basis-80 flex-wrap items-end gap-2"
          onSubmit={handleSubmit}
        >
          <div className="flex min-w-0 flex-1 basis-64 flex-col gap-1.5">
            <label
              htmlFor="card-review-keyword"
              className="text-sm font-semibold text-admin-muted"
            >
              關鍵字
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted"
              />
              <input
                id="card-review-keyword"
                type="search"
                autoComplete="off"
                value={keywordInput}
                placeholder="外碼、內碼、識別碼、姓名或電話"
                className={cn(fieldInputClass, "h-11 pl-10")}
                onChange={(event) => onKeywordInputChange(event.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            className={cn(outlineButtonClass, "h-11 bg-admin-elevated")}
          >
            查詢
          </button>
        </form>
      </div>
    </section>
  );
}
