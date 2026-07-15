import { Link } from "react-router-dom";
import { clearAdminSession, getAdminSession } from "../../api/admin/session";

interface HeaderProps {
  fontSize: number;
  canDecreaseFontSize: boolean;
  canIncreaseFontSize: boolean;
  onDecreaseFontSize: () => void;
  onIncreaseFontSize: () => void;
}

export function Header({
  fontSize,
  canDecreaseFontSize,
  canIncreaseFontSize,
  onDecreaseFontSize,
  onIncreaseFontSize,
}: HeaderProps) {
  const session = getAdminSession();
  const displayName = session?.displayName || session?.userId || "管理者";
  const today = new Intl.DateTimeFormat("zh-TW", {
    dateStyle: "full",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between border-b border-admin-border bg-admin-bg px-3 md:px-5">
      <p className="text-sm text-admin-muted">{today}</p>
      <div className="flex items-center gap-2 md:gap-3">
        <div
          aria-label="文字大小"
          className="flex overflow-hidden rounded-adminControl border border-admin-borderStrong"
          role="group"
        >
          <button
            className="px-3 py-2 text-sm font-bold text-admin-softText transition hover:bg-admin-elevated hover:text-admin-text disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canDecreaseFontSize}
            title="縮小文字"
            type="button"
            onClick={onDecreaseFontSize}
          >
            A-
          </button>
          <span className="border-l border-admin-borderStrong px-2 py-2 text-xs font-bold text-admin-muted">
            {fontSize}px
          </span>
          <button
            className="border-l border-admin-borderStrong px-3 py-2 text-sm font-bold text-admin-softText transition hover:bg-admin-elevated hover:text-admin-text disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canIncreaseFontSize}
            title="放大文字"
            type="button"
            onClick={onIncreaseFontSize}
          >
            A+
          </button>
        </div>
        <span className="hidden text-sm text-admin-softText sm:inline">
          {displayName}
        </span>
        <Link
          className="rounded-adminControl border border-admin-borderStrong px-3 py-2 text-sm font-semibold text-admin-softText transition hover:bg-admin-elevated hover:text-admin-text"
          to="/admin/login"
          onClick={clearAdminSession}
        >
          登出
        </Link>
      </div>
    </header>
  );
}
