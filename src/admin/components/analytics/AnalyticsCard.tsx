import type { ReactNode } from "react";

interface AnalyticsCardProps {
  hypothesis: string;
  title: string;
  description: string;
  insight: string;
  badge?: string;
  children: ReactNode;
}

export function AnalyticsCard({
  hypothesis,
  title,
  description,
  insight,
  badge,
  children,
}: AnalyticsCardProps) {
  return (
    <article className="overflow-hidden rounded-adminPanel border border-admin-border bg-admin-surface shadow-adminPanel">
      <header className="flex flex-col gap-3 border-b border-admin-border bg-admin-elevated/35 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-adminStatus-enabled/15 px-2 py-1 text-xs font-black text-adminStatus-enabled">
              {hypothesis}
            </span>
            {badge && (
              <span className="rounded-md border border-admin-borderStrong px-2 py-1 text-xs font-bold text-admin-muted">
                {badge}
              </span>
            )}
          </div>
          <h2 className="mt-3 text-xl font-black text-admin-text">{title}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-admin-muted">
            {description}
          </p>
        </div>
      </header>
      <div className="p-4">{children}</div>
      <footer className="border-t border-admin-border bg-admin-bg/25 px-4 py-3 text-sm leading-6 text-admin-softText">
        <span className="font-black text-adminStatus-enabled">判讀：</span>
        {insight}
      </footer>
    </article>
  );
}

export function EmptyChartGrid({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-adminControl border border-admin-border bg-admin-bg/35 p-3 sm:p-4">
      {children}
    </div>
  );
}
