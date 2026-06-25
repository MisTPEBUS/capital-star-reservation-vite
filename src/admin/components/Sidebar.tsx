import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

const navigation = [
  { to: "/admin/dashboard", label: "首頁總覽" },
  { to: "/admin/employees", label: "使用者權限" },
  { to: "/admin/settings", label: "系統設定" },
];

const dispatchNavigation = [
  { to: "/admin/dispatch/reservations", label: "營運預約班次" },
  { to: "/admin/dispatch/stops", label: "站位設定" },
  { to: "/admin/dispatch/routes", label: "路線設定" },
  { to: "/admin/dispatch/schedules", label: "班次設定" },
];

export function Sidebar() {
  const location = useLocation();
  const isDispatchActive = location.pathname.startsWith("/admin/dispatch/");
  const [isDispatchOpen, setIsDispatchOpen] = useState(isDispatchActive);
  const showDispatchChildren = isDispatchOpen || isDispatchActive;

  return (
    <aside className="border-b border-admin-border bg-admin-surface lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r">
      <div className="flex min-h-16 items-center px-5 lg:h-20">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-adminStatus-enabled">
            CAPITAL STAR
          </p>
          <p className="mt-1 text-base font-bold text-admin-text">後台管理系統</p>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-admin-border px-3 py-3 lg:block lg:space-y-1 lg:border-t-0 lg:px-4 lg:py-4">
        {navigation.slice(0, 1).map((item) => (
          <NavLink
            key={item.to}
            className={({ isActive }) =>
              `shrink-0 rounded-adminControl px-4 py-3 text-sm font-semibold transition lg:block ${
                isActive
                  ? "bg-admin-elevated text-adminStatus-enabled"
                  : "text-admin-softText hover:bg-admin-elevated hover:text-admin-text"
              }`
            }
            to={item.to}
          >
            {item.label}
          </NavLink>
        ))}

        <div className="shrink-0 lg:py-1">
          <button
            aria-controls="dispatch-management-menu"
            aria-expanded={showDispatchChildren}
            className={`flex w-full items-center justify-between gap-3 rounded-adminControl px-4 py-3 text-left text-sm font-semibold transition ${
              isDispatchActive
                ? "bg-admin-elevated text-adminStatus-enabled"
                : "text-admin-softText hover:bg-admin-elevated hover:text-admin-text"
            }`}
            type="button"
            onClick={() => setIsDispatchOpen((open) => !open)}
          >
            派班管理
            <span aria-hidden="true" className="text-xs">
              {showDispatchChildren ? "⌃" : "⌄"}
            </span>
          </button>

          {showDispatchChildren && (
            <div
              className="mt-1 flex gap-1 pl-2 lg:block lg:space-y-1 lg:border-l lg:border-admin-border lg:py-1"
              id="dispatch-management-menu"
            >
              {dispatchNavigation.map((item) => (
                <NavLink
                  key={item.to}
                  className={({ isActive }) =>
                    `block shrink-0 rounded-adminControl px-3 py-2 text-sm transition ${
                      isActive
                        ? "bg-adminStatus-enabled/10 font-bold text-adminStatus-enabled"
                        : "text-admin-muted hover:bg-admin-elevated hover:text-admin-text"
                    }`
                  }
                  to={item.to}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {navigation.slice(1).map((item) => (
          <NavLink
            key={item.to}
            className={({ isActive }) =>
              `shrink-0 rounded-adminControl px-4 py-3 text-sm font-semibold transition lg:block ${
                isActive
                  ? "bg-admin-elevated text-adminStatus-enabled"
                  : "text-admin-softText hover:bg-admin-elevated hover:text-admin-text"
              }`
            }
            to={item.to}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
