import { Link } from "react-router-dom";

interface HeaderProps {
  theme: "dark" | "light";
  onThemeToggle: () => void;
}

export function Header({ theme, onThemeToggle }: HeaderProps) {
  const today = new Intl.DateTimeFormat("zh-TW", {
    dateStyle: "full",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-admin-border bg-admin-bg px-4 md:px-6">
      <p className="text-sm text-admin-muted">{today}</p>
      <div className="flex items-center gap-3">
        <button
          aria-pressed={theme === "light"}
          className="rounded-adminControl border border-admin-borderStrong px-3 py-2 text-sm font-semibold text-admin-softText transition hover:bg-admin-elevated hover:text-admin-text"
          title={theme === "dark" ? "切換為淺色模式" : "切換為深色模式"}
          type="button"
          onClick={onThemeToggle}
        >
          {theme === "dark" ? "淺色模式" : "深色模式"}
        </button>
        <span className="hidden text-sm text-admin-softText sm:inline">
          Lobinda
        </span>
        <Link
          className="rounded-adminControl border border-admin-borderStrong px-3 py-2 text-sm font-semibold text-admin-softText transition hover:bg-admin-elevated hover:text-admin-text"
          to="/admin/login"
        >
          登出
        </Link>
      </div>
    </header>
  );
}
