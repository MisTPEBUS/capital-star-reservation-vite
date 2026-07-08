import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { hasValidAdminSession } from "../api/admin/session";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { useAdminFontSize } from "./hooks/useAdminFontSize";

export function AdminLayout() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return localStorage.getItem("admin-theme") === "light" ? "light" : "dark";
  });
  const {
    fontSize,
    canDecreaseFontSize,
    canIncreaseFontSize,
    decreaseFontSize,
    increaseFontSize,
  } = useAdminFontSize();

  useEffect(() => {
    localStorage.setItem("admin-theme", theme);
  }, [theme]);

  if (!hasValidAdminSession()) {
    return <Navigate replace to="/admin/login" />;
  }

  return (
    <div
      className="admin-shell min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)] lg:items-start"
      data-font-size={fontSize}
      data-theme={theme}
    >
      <Sidebar />
      <div className="min-w-0">
        <Header
          theme={theme}
          onThemeToggle={() =>
            setTheme((currentTheme) =>
              currentTheme === "dark" ? "light" : "dark",
            )
          }
          fontSize={fontSize}
          canDecreaseFontSize={canDecreaseFontSize}
          canIncreaseFontSize={canIncreaseFontSize}
          onDecreaseFontSize={decreaseFontSize}
          onIncreaseFontSize={increaseFontSize}
        />
        <main className="admin-page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
