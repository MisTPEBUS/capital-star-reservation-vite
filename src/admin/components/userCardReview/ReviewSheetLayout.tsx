import type { ReactNode } from "react";

interface ReviewSheetLayoutProps {
  children: ReactNode;
}

/** 審核面板可捲動的內容區 */
export function ReviewSheetBody({ children }: ReviewSheetLayoutProps) {
  return (
    <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
      {children}
    </div>
  );
}

/** 審核面板底部固定的操作列 */
export function ReviewSheetActions({ children }: ReviewSheetLayoutProps) {
  return (
    <div className="flex flex-wrap justify-end gap-2.5 border-t border-admin-border bg-admin-bg/50 px-5 py-4 sm:px-6">
      {children}
    </div>
  );
}
