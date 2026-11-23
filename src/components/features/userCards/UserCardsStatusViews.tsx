import { CircleAlert, RotateCw } from "lucide-react";
import type { UserCardFeedback } from "../../../types/userCard";

/** 卡片列表載入中 */
export function UserCardsSkeleton() {
  return (
    <div aria-busy="true" aria-label="正在載入卡片資料" className="flex flex-col gap-3">
      <div className="rounded-[20px] border border-ink-100 bg-white px-4 py-3.5">
        <div className="flex items-center gap-3">
          <span className="size-11 rounded-[14px] bg-ink-100" />
          <div className="flex flex-col gap-2">
            <span className="h-3 w-16 rounded-full bg-ink-100" />
            <span className="h-6 w-24 rounded-lg bg-ink-100" />
          </div>
        </div>
        <span className="mt-3 block h-2 rounded-full bg-ink-100" />
      </div>
      {[0, 1].map((placeholder) => (
        <div
          key={placeholder}
          className="rounded-[22px] border border-ink-100 bg-white p-2.5"
        >
          <div className="aspect-[1.586/1] rounded-2xl bg-ink-50" />
        </div>
      ))}
    </div>
  );
}

interface UserCardsLoadErrorProps {
  feedback: UserCardFeedback;
  onRetry: () => void;
}

/** 卡片列表載入失敗 */
export function UserCardsLoadError({ feedback, onRetry }: UserCardsLoadErrorProps) {
  return (
    <section
      role="alert"
      className="flex flex-col items-center gap-2 rounded-card border border-orange-200 bg-white px-4 py-8 text-center"
    >
      <span
        aria-hidden="true"
        className="grid size-[52px] place-items-center rounded-full bg-orange-100 text-orange-700"
      >
        <CircleAlert className="size-7" />
      </span>
      <h2 className="mt-1 text-lg font-black text-ink-900">無法取得卡片資料</h2>
      <p className="text-base leading-6 text-ink-500">{feedback.title}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 inline-flex h-12 items-center gap-2 rounded-xl border border-bus-100 bg-white px-5 text-base font-black text-bus-700 hover:bg-bus-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bus-500"
      >
        <RotateCw className="size-4" aria-hidden="true" />
        重新載入
      </button>
    </section>
  );
}
