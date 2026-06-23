import { NavLink } from "react-router-dom";

const navigation = [
  { to: "/admin/dashboard", label: "儀表板" },
  { to: "/admin/employees", label: "權限設定" },
  { to: "/admin/schedules", label: "班次設定" },
  { to: "/admin/settings", label: "參數設定" },
];

export function Sidebar() {
  return (
    <aside className="border-b border-admin-border bg-admin-surface lg:min-h-screen lg:border-b-0 lg:border-r">
      <div className="flex min-h-16 items-center px-5 lg:h-20">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-adminStatus-enabled">
            CAPITAL STAR
          </p>
          <p className="mt-1 text-base font-bold text-admin-text">
            活動管理中心
          </p>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-admin-border px-3 py-3 lg:block lg:space-y-1 lg:border-t-0 lg:px-4 lg:py-4">
        {navigation.map((item) => (
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
