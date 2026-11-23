import { CreditCard, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserCardQuotaProps {
  count: number;
  max: number;
  /** 已滿時的說明文字 id，供停用的新增按鈕以 aria-describedby 參照 */
  limitHintId: string;
}

export function UserCardQuota({ count, max, limitHintId }: UserCardQuotaProps) {
  const isFull = count >= max;

  return (
    <section
      aria-label="卡片名額"
      className="rounded-[20px] border border-ink-100 bg-white px-4 py-3.5"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-bus-50 text-bus-600"
        >
          <CreditCard className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-ink-500">已綁定卡片</p>
          <p className="mt-0.5 text-2xl font-black leading-tight tabular-nums text-bus-900">
            {count}
            <span className="text-base font-extrabold text-ink-500"> / {max} 張</span>
          </p>
        </div>
        {isFull ? (
          <span className="shrink-0 rounded-full bg-star-100 px-2.5 py-1 text-xs font-black text-amber-800">
            已滿
          </span>
        ) : null}
      </div>

      <div
        role="img"
        aria-label={`已使用 ${count} 個名額，共 ${max} 個`}
        className="mt-3 grid grid-cols-5 gap-1.5"
      >
        {Array.from({ length: max }, (_, index) => (
          <span
            key={index}
            className={cn(
              "h-2 rounded-full",
              index < count ? "bg-bus-500" : "bg-ink-100",
            )}
          />
        ))}
      </div>

      {isFull ? (
        <p
          id={limitHintId}
          className="mt-3 flex items-start gap-2 rounded-xl border border-star-300 bg-cream px-3 py-2.5 text-sm font-bold leading-6 text-orange-900"
        >
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          已達 {max} 張上限。刪除不再使用或審核失敗的卡片，即可釋出名額。
        </p>
      ) : null}
    </section>
  );
}
