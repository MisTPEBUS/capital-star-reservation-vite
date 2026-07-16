import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

type SidebarIconName =
  | "dashboard"
  | "users"
  | "dispatch"
  | "schedule"
  | "stop"
  | "route";

interface SidebarProps {
  isCollapsed: boolean;
  onCollapsedChange: (isCollapsed: boolean) => void;
}

const navigation = [
  { to: "/admin/dashboard", label: "首頁總覽", icon: "dashboard" as const },
  { to: "/admin/employees", label: "使用者權限", icon: "users" as const },
  /*  { to: "/admin/settings", label: "系統設定" }, */
];

const dispatchNavigation = [
  {
    to: "/admin/dispatch/schedules",
    label: "班次設定",
    icon: "schedule" as const,
  },
  /* { to: "/admin/dispatch/reservations", label: "營運預約班次" }, */
  { to: "/admin/dispatch/stops", label: "站位設定", icon: "stop" as const },
  { to: "/admin/dispatch/routes", label: "路線設定", icon: "route" as const },
];

function SidebarIcon({ name }: { name: SidebarIconName }) {
  const commonProps = {
    className: "h-[20px] w-[20px] shrink-0",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
  };

  if (name === "dashboard") {
    return (
      <svg {...commonProps} aria-hidden="true">
        <rect height="8" rx="2" width="8" x="3" y="3" />
        <rect height="8" rx="2" width="8" x="13" y="3" />
        <rect height="8" rx="2" width="8" x="3" y="13" />
        <rect height="8" rx="2" width="8" x="13" y="13" />
      </svg>
    );
  }

  if (name === "users") {
    return (
      <svg {...commonProps} aria-hidden="true">
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  if (name === "dispatch") {
    return (
      <svg {...commonProps} aria-hidden="true">
        <path d="M5 17a2 2 0 1 0 4 0" />
        <path d="M15 17a2 2 0 1 0 4 0" />
        <path d="M5 17H3V7a2 2 0 0 1 2-2h10a4 4 0 0 1 4 4v8h-2" />
        <path d="M9 17h6" />
        <path d="M15 5v6h4" />
      </svg>
    );
  }

  if (name === "schedule") {
    return (
      <svg {...commonProps} aria-hidden="true">
        <rect height="18" rx="2" width="18" x="3" y="4" />
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <path d="M3 10h18" />
        <path d="M8 14h4" />
        <path d="M8 18h8" />
      </svg>
    );
  }

  if (name === "stop") {
    return (
      <svg {...commonProps} aria-hidden="true">
        <path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }

  return (
    <svg {...commonProps} aria-hidden="true">
      <path d="M4 18V6a2 2 0 0 1 2-2h11a3 3 0 0 1 0 6H8" />
      <path d="M8 10h9a3 3 0 0 1 0 6H6a2 2 0 0 0-2 2" />
      <path d="M8 4v12" />
    </svg>
  );
}

export function Sidebar({ isCollapsed, onCollapsedChange }: SidebarProps) {
  const location = useLocation();
  const isDispatchActive = location.pathname.startsWith("/admin/dispatch/");
  const [isDispatchOpen, setIsDispatchOpen] = useState(isDispatchActive);
  const showDispatchChildren =
    !isCollapsed && (isDispatchOpen || isDispatchActive);

  return (
    <aside
      className={`border-b border-admin-border bg-admin-surface transition-[width] duration-200 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r ${
        isCollapsed ? "lg:w-[76px]" : "lg:w-[280px]"
      }`}
    >
      <div
        className={`flex min-h-14 items-center gap-3 px-4 lg:h-16 ${
          isCollapsed ? "lg:justify-center lg:px-3" : "lg:justify-between"
        }`}
      >
        <div className={isCollapsed ? "lg:hidden" : ""}>
          <p className="text-xs font-bold tracking-[0.22em] text-adminStatus-enabled">
            CAPITAL STAR
          </p>
          <p className="mt-1 text-base font-bold text-admin-text">
            後台管理系統
          </p>
        </div>
        <button
          aria-label={isCollapsed ? "展開側邊欄" : "收合側邊欄"}
          className="hidden h-9 w-9 shrink-0 place-items-center rounded-adminControl border border-admin-borderStrong text-admin-softText hover:bg-admin-elevated hover:text-admin-text lg:grid"
          type="button"
          onClick={() => onCollapsedChange(!isCollapsed)}
        >
          <span className="text-lg leading-none" aria-hidden="true">
            {isCollapsed ? "›" : "‹"}
          </span>
        </button>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-admin-border px-2 py-2 lg:block lg:space-y-1 lg:border-t-0 lg:px-3 lg:py-3">
        {navigation.slice(0, 1).map((item) => (
          <NavLink
            key={item.to}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-3 rounded-adminControl px-3 py-2.5 text-sm font-semibold transition lg:flex ${
                isCollapsed ? "lg:justify-center" : ""
              } ${
                isActive
                  ? "bg-admin-elevated text-adminStatus-enabled"
                  : "text-admin-softText hover:bg-admin-elevated hover:text-admin-text"
              }`
            }
            to={item.to}
            title={isCollapsed ? item.label : undefined}
          >
            <SidebarIcon name={item.icon} />
            <span className={isCollapsed ? "lg:hidden" : ""}>{item.label}</span>
          </NavLink>
        ))}

        <div className="shrink-0 lg:py-1">
          <button
            aria-controls="dispatch-management-menu"
            aria-expanded={showDispatchChildren}
            className={`w-full items-center rounded-adminControl px-3 py-2.5 text-left text-sm font-semibold transition ${
              isCollapsed
                ? "flex gap-3 lg:justify-center"
                : "grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3"
            } ${
              isDispatchActive
                ? "bg-admin-elevated text-adminStatus-enabled"
                : "text-admin-softText hover:bg-admin-elevated hover:text-admin-text"
            }`}
            title={isCollapsed ? "派班管理" : undefined}
            type="button"
            onClick={() => {
              if (isCollapsed) {
                onCollapsedChange(false);
                setIsDispatchOpen(true);
                return;
              }

              setIsDispatchOpen((open) => !open);
            }}
          >
            <SidebarIcon name="dispatch" />
            <span
              className={`min-w-0 truncate ${isCollapsed ? "lg:hidden" : ""}`}
            >
              派班管理
            </span>
            <span
              aria-hidden="true"
              className={`shrink-0 text-xs leading-none ${isCollapsed ? "lg:hidden" : ""}`}
            >
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
                    `flex shrink-0 items-center gap-3 rounded-adminControl px-3 py-2 text-sm transition ${
                      isActive
                        ? "bg-adminStatus-enabled/10 font-bold text-adminStatus-enabled"
                        : "text-admin-muted hover:bg-admin-elevated hover:text-admin-text"
                    }`
                  }
                  to={item.to}
                >
                  <SidebarIcon name={item.icon} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {navigation.slice(1).map((item) => (
          <NavLink
            key={item.to}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-3 rounded-adminControl px-3 py-2.5 text-sm font-semibold transition lg:flex ${
                isCollapsed ? "lg:justify-center" : ""
              } ${
                isActive
                  ? "bg-admin-elevated text-adminStatus-enabled"
                  : "text-admin-softText hover:bg-admin-elevated hover:text-admin-text"
              }`
            }
            to={item.to}
            title={isCollapsed ? item.label : undefined}
          >
            <SidebarIcon name={item.icon} />
            <span className={isCollapsed ? "lg:hidden" : ""}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
