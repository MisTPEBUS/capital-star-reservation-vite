import type { ReactNode } from "react";
import { CircleCheck, RefreshCw, Search, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserCardReviewStatus } from "../../../types/userCard";
import { outlineButtonClass } from "./styles";

const SKELETON_ROWS = 3;

/** 第一次載入時的骨架列 */
export function UserCardReviewLoading() {
  return (
    <div aria-hidden="true" className="divide-y divide-admin-border/70">
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <div key={index} className="flex items-center gap-4 px-5 py-5">
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-2/5 animate-pulse rounded bg-white/20" />
            <div className="h-3 w-3/5 animate-pulse rounded bg-white/10" />
          </div>
          <div className="h-10 w-20 animate-pulse rounded-adminControl bg-white/10" />
        </div>
      ))}
    </div>
  );
}

interface StateMessageProps {
  icon: ReactNode;
  iconClassName: string;
  title: string;
  description: string;
  isAlert?: boolean;
  children?: ReactNode;
}

function StateMessage({
  icon,
  iconClassName,
  title,
  description,
  isAlert = false,
  children,
}: StateMessageProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-5 py-14 text-center">
      <span
        className={cn(
          "grid h-14 w-14 place-items-center rounded-full",
          iconClassName,
        )}
      >
        {icon}
      </span>
      <p
        role={isAlert ? "alert" : undefined}
        className="mt-2.5 text-lg font-bold text-admin-text"
      >
        {title}
      </p>
      <p className="text-base text-admin-muted">{description}</p>
      {children && <div className="mt-3.5">{children}</div>}
    </div>
  );
}

const EMPTY_COPY: Record<UserCardReviewStatus, { title: string; description: string }> = {
  PENDING: {
    title: "目前沒有待審核的卡片",
    description: "所有申請都已處理完成。",
  },
  APPROVED: {
    title: "尚無已通過的卡片",
    description: "審核通過的卡片會顯示在這裡。",
  },
  REJECTED: {
    title: "尚無審核失敗的卡片",
    description: "設為失敗或系統判定失敗的卡片會顯示在這裡。",
  },
};

interface UserCardReviewEmptyProps {
  status: UserCardReviewStatus;
  keyword: string;
  onShowApproved: () => void;
}

export function UserCardReviewEmpty({
  status,
  keyword,
  onShowApproved,
}: UserCardReviewEmptyProps) {
  if (keyword) {
    return (
      <StateMessage
        icon={<Search aria-hidden="true" className="h-7 w-7" />}
        iconClassName="bg-admin-bg text-admin-muted"
        title={`找不到符合「${keyword}」的卡片`}
        description="請換個關鍵字，或切換審核狀態。"
      />
    );
  }

  const copy = EMPTY_COPY[status];

  return (
    <StateMessage
      icon={<CircleCheck aria-hidden="true" className="h-7 w-7" />}
      iconClassName="bg-admin-bg text-emerald-200"
      title={copy.title}
      description={copy.description}
    >
      {status === "PENDING" && (
        <button
          type="button"
          className={cn(outlineButtonClass, "h-11")}
          onClick={onShowApproved}
        >
          查看已通過的卡片
        </button>
      )}
    </StateMessage>
  );
}

interface UserCardReviewErrorProps {
  message: string;
  onRetry: () => void;
}

export function UserCardReviewError({ message, onRetry }: UserCardReviewErrorProps) {
  return (
    <StateMessage
      icon={<TriangleAlert aria-hidden="true" className="h-7 w-7" />}
      iconClassName="bg-red-400/15 text-red-300"
      title="卡片列表讀取失敗"
      description={message}
      isAlert
    >
      <button
        type="button"
        className={cn(outlineButtonClass, "h-11 bg-admin-elevated")}
        onClick={onRetry}
      >
        <RefreshCw aria-hidden="true" className="h-4 w-4" />
        重新整理
      </button>
    </StateMessage>
  );
}
