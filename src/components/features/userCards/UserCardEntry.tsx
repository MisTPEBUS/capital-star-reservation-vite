import { Link } from "react-router-dom";
import { ChevronRight, CircleAlert, CreditCard, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserCardsLoadStatus } from "../../../types/userCard";

interface UserCardEntryProps {
  status: UserCardsLoadStatus;
  cardCount: number;
  onRetry: () => void;
}

/**
 * 首頁會員卡下方的「我的乘車卡」入口。
 * 依卡片資料互斥顯示「尚未綁定」或「已有綁定」；載入中與失敗時兩者都不顯示。
 */
export function UserCardEntry({ status, cardCount, onRetry }: UserCardEntryProps) {
  if (status === "error") {
    return (
      <div className="mt-3 flex items-center gap-3 rounded-2xl border border-orange-200 bg-white p-3.5">
        <span
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-orange-100 text-orange-700"
        >
          <CircleAlert className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-extrabold text-ink-900">我的乘車卡</p>
          <p role="alert" className="text-sm font-bold text-orange-800">
            暫時無法取得卡片資料
          </p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-bus-100 bg-white px-3.5 text-sm font-black text-bus-700 hover:bg-bus-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bus-500"
        >
          <RotateCw className="size-4" aria-hidden="true" />
          重試
        </button>
      </div>
    );
  }

  if (status !== "success") {
    return (
      <div
        aria-busy="true"
        aria-label="正在載入乘車卡資料"
        className="mt-3 flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-3.5"
      >
        <span className="size-11 shrink-0 rounded-xl bg-ink-100" />
        <span className="flex flex-1 flex-col gap-2">
          <span className="h-3.5 w-24 rounded-full bg-ink-100" />
          <span className="h-3 w-36 rounded-full bg-ink-50" />
        </span>
      </div>
    );
  }

  const hasCards = cardCount > 0;

  return (
    <Link
      to="/cards"
      className="mt-3 flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-3.5 text-ink-900 shadow-sm hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bus-500"
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-xl",
          hasCards ? "bg-bus-50 text-bus-600" : "bg-star-100 text-amber-700",
        )}
      >
        <CreditCard className="size-6" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-lg font-extrabold">我的乘車卡</span>
        <span
          className={cn(
            "text-sm font-semibold",
            hasCards ? "text-ink-500" : "text-amber-700",
          )}
        >
          {hasCards ? "查看與管理已綁定卡片" : "尚未綁定"}
        </span>
      </span>
      <ChevronRight className="size-6 shrink-0 text-ink-500" aria-hidden="true" />
    </Link>
  );
}
