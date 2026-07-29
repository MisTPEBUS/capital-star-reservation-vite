import { useSearchParams } from "react-router-dom";

export const dashboardRouteFilters = [
  {
    routeNumber: "ALL",
    label: "全部",
    selectedClass: "border-slate-200 bg-slate-600 text-white shadow-sm",
    defaultClass:
      "border-slate-300/40 bg-slate-300/10 text-slate-100 hover:border-slate-200 hover:bg-slate-300/20",
  },
  {
    routeNumber: "1571",
    label: "羅東",
    selectedClass: "border-emerald-300 bg-emerald-600 text-white shadow-sm",
    defaultClass:
      "border-emerald-400/40 bg-emerald-400/10 text-emerald-200 hover:border-emerald-300 hover:bg-emerald-400/20",
  },
  {
    routeNumber: "1570",
    label: "宜蘭",
    selectedClass: "border-blue-300 bg-blue-600 text-white shadow-sm",
    defaultClass:
      "border-blue-400/40 bg-blue-400/10 text-blue-200 hover:border-blue-300 hover:bg-blue-400/20",
  },
  {
    routeNumber: "1572",
    label: "礁溪",
    selectedClass: "border-red-300 bg-red-600 text-white shadow-sm",
    defaultClass:
      "border-red-400/40 bg-red-400/10 text-red-200 hover:border-red-300 hover:bg-red-400/20",
  },
] as const;

export function DashboardRouteNav() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedRouteNumber = searchParams.get("route") ?? "ALL";

  const selectRoute = (routeNumber: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);

      if (routeNumber === "ALL") {
        next.delete("route");
      } else {
        next.set("route", routeNumber);
      }

      return next;
    });
  };

  return (
    <nav
      aria-label="快速路線篩選"
      className="grid h-12 shrink-0 grid-cols-4 gap-2 rounded-adminControl  bg-admin-bg p-1"
    >
      {dashboardRouteFilters.map((route) => {
        const isSelected = selectedRouteNumber === route.routeNumber;

        return (
          <button
            key={route.routeNumber}
            aria-label={`${route.label}路線 ${route.routeNumber}`}
            aria-pressed={isSelected}
            className={`min-w-[80px] rounded-lg border px-3  text-3xl font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
              isSelected ? route.selectedClass : route.defaultClass
            }`}
            type="button"
            onClick={() => selectRoute(route.routeNumber)}
          >
            {route.label}
          </button>
        );
      })}
    </nav>
  );
}
