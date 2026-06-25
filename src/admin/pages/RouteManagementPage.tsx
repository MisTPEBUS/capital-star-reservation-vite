import { FormEvent, useEffect, useState } from "react";
import {
  type AdminRoute,
  createRoute,
  deleteRoute,
  getRoutes,
  type RoutePayload,
  type RouteStatus,
  type RouteStop,
  updateRoute,
} from "../../api/admin/routes";
import { type AdminStop, getStops } from "../../api/admin/stops";

const emptyPayload: RoutePayload = {
  routeNumber: "",
  routeName: "",
  description: "",
  status: "ACTIVE",
};

type Notice = { type: "success" | "error"; message: string } | null;

export function RouteManagementPage() {
  const [routes, setRoutes] = useState<AdminRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [editingRoute, setEditingRoute] = useState<AdminRoute | null>(null);
  const [form, setForm] = useState<RoutePayload>(emptyPayload);
  const [stationRoute, setStationRoute] = useState<AdminRoute | null>(null);
  const [availableStops, setAvailableStops] = useState<AdminStop[]>([]);
  const [selectedStopIds, setSelectedStopIds] = useState<string[]>([]);
  const [isStopsLoading, setIsStopsLoading] = useState(false);

  const loadRoutes = async () => {
    try {
      setIsLoading(true);
      setRoutes(await getRoutes());
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "讀取路線清單失敗。",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const openCreateForm = () => {
    setEditingRoute(null);
    setForm(emptyPayload);
    setNotice(null);
  };

  const openEditForm = (route: AdminRoute) => {
    setEditingRoute(route);
    setForm({
      routeNumber: route.routeNumber,
      routeName: route.routeName,
      description: route.description ?? "",
      status: route.status,
    });
    setNotice(null);
  };

  const saveRoute = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.routeNumber.trim() || !form.routeName.trim()) {
      setNotice({ type: "error", message: "請填寫路線編號與路線名稱。" });
      return;
    }

    const payload = {
      ...form,
      routeNumber: form.routeNumber.trim(),
      routeName: form.routeName.trim(),
      description: form.description?.trim() || null,
    };

    try {
      setIsSaving(true);
      if (editingRoute) {
        const updated = await updateRoute(editingRoute.routeId, payload);
        setRoutes((current) =>
          current.map((route) =>
            route.routeId === editingRoute.routeId
              ? { ...route, ...updated, stops: updated.stops ?? route.stops }
              : route,
          ),
        );
        setNotice({ type: "success", message: "路線已更新。" });
      } else {
        const created = await createRoute(payload);
        setRoutes((current) => [...current, { ...created, stops: created.stops ?? [] }]);
        setNotice({ type: "success", message: "路線已新增。" });
      }
      setEditingRoute(null);
      setForm(emptyPayload);
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "儲存路線失敗。",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const removeRoute = async (route: AdminRoute) => {
    if (!window.confirm(`確定要刪除「${route.routeNumber} ${route.routeName}」嗎？`)) {
      return;
    }

    try {
      setIsDeletingId(route.routeId);
      await deleteRoute(route.routeId);
      setRoutes((current) => current.filter((item) => item.routeId !== route.routeId));
      setNotice({ type: "success", message: "路線已刪除。" });
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "刪除路線失敗。",
      });
    } finally {
      setIsDeletingId(null);
    }
  };

  const openStationSettings = async (route: AdminRoute) => {
    setStationRoute(route);
    setSelectedStopIds(route.stops.map((stop) => stop.stopId));
    setNotice(null);

    try {
      setIsStopsLoading(true);
      setAvailableStops(await getStops());
    } catch (error) {
      setStationRoute(null);
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "讀取站位清單失敗。",
      });
    } finally {
      setIsStopsLoading(false);
    }
  };

  const saveStationSettings = () => {
    if (!stationRoute) return;

    const stops = availableStops
      .filter((stop) => selectedStopIds.includes(stop.stopId))
      .map(
        (stop, index): RouteStop => ({
          stopId: stop.stopId,
          stopName: stop.stopName,
          stopType: stop.stopType,
          address: stop.address,
          latitude: stop.latitude,
          longitude: stop.longitude,
          sequence: index + 1,
        }),
      );

    setRoutes((current) =>
      current.map((route) =>
        route.routeId === stationRoute.routeId ? { ...route, stops } : route,
      ),
    );
    setStationRoute(null);
    setNotice({
      type: "success",
      message: "站位設定已更新（目前為前端暫存，待 route-stop API 提供後即可寫入後端）。",
    });
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="admin-page-kicker">DISPATCH MANAGEMENT</p>
          <h1 className="admin-page-title">路線設定</h1>
          <p className="admin-page-description">管理營運路線與各路線使用的站位。</p>
        </div>
        <button
          className="h-11 rounded-adminControl bg-adminStatus-enabled px-5 text-sm font-bold text-admin-bg transition hover:bg-emerald-300"
          type="button"
          onClick={openCreateForm}
        >
          新增路線
        </button>
      </section>

      {notice && (
        <p
          className={`rounded-adminControl border px-4 py-3 text-sm ${
            notice.type === "success"
              ? "border-adminStatus-enabled/30 bg-adminStatus-enabled/10 text-adminStatus-enabledText"
              : "border-red-400/30 bg-red-400/10 text-red-200"
          }`}
          role="status"
        >
          {notice.message}
        </p>
      )}

      <section className="admin-panel-body">
        <h2 className="admin-section-title">{editingRoute ? "修改路線" : "新增路線"}</h2>
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={saveRoute}>
          <label className="text-sm font-medium text-admin-softText">
            路線編號
            <input
              className="mt-2 h-11 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-admin-text outline-none focus:border-adminStatus-enabled"
              value={form.routeNumber}
              onChange={(event) => setForm((current) => ({ ...current, routeNumber: event.target.value }))}
            />
          </label>
          <label className="text-sm font-medium text-admin-softText">
            路線名稱
            <input
              className="mt-2 h-11 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-admin-text outline-none focus:border-adminStatus-enabled"
              value={form.routeName}
              onChange={(event) => setForm((current) => ({ ...current, routeName: event.target.value }))}
            />
          </label>
          <label className="text-sm font-medium text-admin-softText md:col-span-2">
            路線說明
            <textarea
              className="mt-2 min-h-24 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 py-2 text-admin-text outline-none focus:border-adminStatus-enabled"
              value={form.description ?? ""}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
          </label>
          <label className="text-sm font-medium text-admin-softText">
            狀態
            <select
              className="mt-2 h-11 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-admin-text outline-none focus:border-adminStatus-enabled"
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as RouteStatus }))}
            >
              <option value="ACTIVE">啟用</option>
              <option value="INACTIVE">停用</option>
            </select>
          </label>
          <div className="flex items-end gap-3">
            <button
              className="h-11 rounded-adminControl bg-adminStatus-enabled px-5 text-sm font-bold text-admin-bg disabled:opacity-60"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? "儲存中…" : editingRoute ? "儲存修改" : "新增路線"}
            </button>
            {editingRoute && (
              <button
                className="h-11 rounded-adminControl border border-admin-borderStrong px-5 text-sm font-semibold text-admin-softText"
                type="button"
                onClick={openCreateForm}
              >
                取消修改
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="admin-panel-body overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-admin-border px-5 py-4">
          <h2 className="admin-section-title">路線清單</h2>
          <button className="text-sm font-semibold text-adminStatus-enabled" type="button" onClick={loadRoutes}>
            重新整理
          </button>
        </div>
        {isLoading ? (
          <p className="px-5 py-8 text-center text-admin-muted">讀取路線中…</p>
        ) : routes.length === 0 ? (
          <p className="px-5 py-8 text-center text-admin-muted">目前沒有路線資料。</p>
        ) : (
          <div className="divide-y divide-admin-border">
            {routes.map((route) => (
              <article className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center" key={route.routeId}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-admin-text">{route.routeNumber}｜{route.routeName}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${route.status === "ACTIVE" ? "bg-adminStatus-enabled/10 text-adminStatus-enabled" : "bg-admin-elevated text-admin-muted"}`}>
                      {route.status === "ACTIVE" ? "啟用" : "停用"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-admin-muted">{route.description || "未提供路線說明"}</p>
                  <p className="mt-3 text-sm text-admin-softText">
                    已設定站位：{route.stops.length ? route.stops.map((stop) => stop.stopName).join("、") : "尚未設定"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="rounded-adminControl border border-admin-borderStrong px-3 py-2 text-sm font-semibold text-admin-softText" type="button" onClick={() => openStationSettings(route)}>設定站位</button>
                  <button className="rounded-adminControl border border-admin-borderStrong px-3 py-2 text-sm font-semibold text-admin-softText" type="button" onClick={() => openEditForm(route)}>修改</button>
                  <button className="rounded-adminControl border border-red-400/40 px-3 py-2 text-sm font-semibold text-red-300 disabled:opacity-60" disabled={isDeletingId === route.routeId} type="button" onClick={() => removeRoute(route)}>{isDeletingId === route.routeId ? "刪除中…" : "刪除"}</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {stationRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5" role="dialog" aria-modal="true" aria-labelledby="route-stop-title">
          <div className="w-full max-w-lg rounded-adminPanel border border-admin-borderStrong bg-admin-surface p-6 shadow-adminPanel">
            <h2 className="text-xl font-bold text-admin-text" id="route-stop-title">設定站位：{stationRoute.routeNumber} {stationRoute.routeName}</h2>
            <p className="mt-2 text-sm leading-6 text-admin-muted">勾選此路線可使用的站位。清單讀取自站位設定 API；route-stop API 尚未提供，送出後仍只會暫存於本頁。</p>
            <div className="mt-5 max-h-72 space-y-2 overflow-y-auto">
              {isStopsLoading ? (
                <p className="py-8 text-center text-sm text-admin-muted">讀取站位清單中…</p>
              ) : availableStops.length === 0 ? (
                <p className="py-8 text-center text-sm text-admin-muted">目前沒有可設定的站位。</p>
              ) : availableStops.map((stop) => {
                const checked = selectedStopIds.includes(stop.stopId);
                return (
                  <button
                    aria-pressed={checked}
                    className={`flex w-full items-center justify-between gap-3 rounded-adminControl border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-adminStatus-enabled ${
                      checked
                        ? "border-adminStatus-enabled bg-adminStatus-enabled/10 text-admin-text ring-1 ring-adminStatus-enabled/30"
                        : "border-admin-border text-admin-softText hover:border-admin-borderStrong hover:bg-admin-elevated"
                    }`}
                    key={stop.stopId}
                    type="button"
                    onClick={() =>
                      setSelectedStopIds((current) =>
                        checked
                          ? current.filter((id) => id !== stop.stopId)
                          : [...current, stop.stopId],
                      )
                    }
                  >
                    <span>
                      <span className="block font-medium">{stop.stopName}</span>
                      <span className="mt-1 block text-xs text-admin-muted">
                        {stop.stopType === "STATION" ? "轉運站" : "路邊站"}
                      </span>
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        checked ? "text-adminStatus-enabled" : "text-admin-muted"
                      }`}
                    >
                      {checked ? "已選取" : "點選設定"}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="h-11 rounded-adminControl border border-admin-borderStrong px-5 text-sm font-semibold text-admin-softText" type="button" onClick={() => setStationRoute(null)}>取消</button>
              <button className="h-11 rounded-adminControl bg-adminStatus-enabled px-5 text-sm font-bold text-admin-bg" type="button" onClick={saveStationSettings}>儲存站位設定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
