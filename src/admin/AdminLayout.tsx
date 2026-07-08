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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem("admin-sidebar-collapsed") === "true";
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

  useEffect(() => {
    localStorage.setItem(
      "admin-sidebar-collapsed",
      String(isSidebarCollapsed),
    );
  }, [isSidebarCollapsed]);

  if (!hasValidAdminSession()) {
    return <Navigate replace to="/admin/login" />;
  }

  return (
    <div
      className={`admin-shell min-h-screen lg:grid lg:items-start ${
        isSidebarCollapsed
          ? "lg:grid-cols-[76px_minmax(0,1fr)]"
          : "lg:grid-cols-[280px_minmax(0,1fr)]"
      }`}
      data-font-size={fontSize}
      data-theme={theme}
    >
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onCollapsedChange={setIsSidebarCollapsed}
      />
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
