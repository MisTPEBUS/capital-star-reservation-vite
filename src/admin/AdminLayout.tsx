import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { hasValidAdminSession } from "../api/admin/session";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";

export function AdminLayout() {
  if (!hasValidAdminSession()) {
    return <Navigate replace to="/admin/login" />;
  }

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return localStorage.getItem("admin-theme") === "light" ? "light" : "dark";
  });

  useEffect(() => {
    localStorage.setItem("admin-theme", theme);
  }, [theme]);

  return (
    <div
      className="admin-shell min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]"
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
        />
        <main className="admin-page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
