import { useId } from "react";
import { cn } from "@/lib/utils";
import type { DetailItem } from "../../utils/userCardReview";

interface UserCardDetailSectionProps {
  title: string;
  items: DetailItem[];
  /** grid：兩欄格狀；rows：每列左標籤右數值 */
  layout?: "grid" | "rows";
}

export function UserCardDetailSection({
  title,
  items,
  layout = "grid",
}: UserCardDetailSectionProps) {
  const headingId = useId();
  const isGrid = layout === "grid";
  const hasOddItems = items.length % 2 === 1;

  return (
    <section aria-labelledby={headingId} className="space-y-2.5">
      <h3 id={headingId} className="text-base font-bold text-admin-muted">
        {title}
      </h3>
      <dl
        className={cn(
          "grid gap-px overflow-hidden rounded-adminCard border border-admin-border bg-admin-border",
          isGrid && "grid-cols-2",
        )}
      >
        {items.map((item, index) => (
          <div
            key={item.label}
            className={cn(
              "bg-admin-bg px-3.5 py-3",
              !isGrid && "flex items-baseline justify-between gap-4",
              isGrid && hasOddItems && index === items.length - 1 && "col-span-2",
            )}
          >
            <dt className="shrink-0 text-sm text-admin-muted">{item.label}</dt>
            <dd
              className={cn(
                "break-words text-base font-semibold text-admin-text",
                isGrid ? "mt-1" : "text-right",
                item.mono && "font-mono tabular-nums",
              )}
            >
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
