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
  updateRouteStops,
} from "../../api/admin/routes";
import { type AdminStop, getStops } from "../../api/admin/stops";

const emptyPayload: RoutePayload = {
  routeNumber: "",
  routeName: "",
  description: "",
  status: "ACTIVE",
};

type Notice = { type: "success" | "error"; message: string } | null;
type SelectedStop = Pick<
  RouteStop,
  "stopId" | "stopName" | "stopType" | "address" | "latitude" | "longitude" | "status"
>;

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
  const [selectedStops, setSelectedStops] = useState<SelectedStop[]>([]);
  const [isStopsLoading, setIsStopsLoading] = useState(false);
  const [isUpdatingRouteStops, setIsUpdatingRouteStops] = useState(false);
  const [stationError, setStationError] = useState<string | null>(null);

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
    setSelectedStops(
      [...route.stops]
        .sort((a, b) => a.sequence - b.sequence)
        .map((stop) => ({
          stopId: stop.stopId,
          stopName: stop.stopName,
          stopType: stop.stopType,
          address: stop.address,
          latitude: stop.latitude,
          longitude: stop.longitude,
          status: stop.status,
        })),
    );
    setStationError(null);
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

  const saveStationSettings = async () => {
    if (!stationRoute) return;

    const stopsPayload = selectedStops.map((stop, index) => ({
      stopId: stop.stopId,
      sequence: index + 1,
    }));

    try {
      setIsUpdatingRouteStops(true);
      setStationError(null);
      const updatedRoute = await updateRouteStops(stationRoute.routeId, stopsPayload);
      setRoutes((current) =>
        current.map((route) =>
          route.routeId === stationRoute.routeId
            ? {
                ...route,
                ...updatedRoute,
                description: updatedRoute.description ?? route.description,
                stops: updatedRoute.stops ?? [],
              }
            : route,
        ),
      );
      setStationRoute(null);
      setNotice({ type: "success", message: "路線站位設定已更新。" });
    } catch (error) {
      setStationError(
        error instanceof Error ? error.message : "更新路線站位設定失敗。",
      );
    } finally {
      setIsUpdatingRouteStops(false);
    }
  };

  const addSelectedStop = (stop: AdminStop) => {
    setSelectedStops((current) => {
      if (current.some((item) => item.stopId === stop.stopId)) {
        return current;
      }

      return [...current, stop];
    });
  };

  const removeSelectedStop = (stopId: string) => {
    setSelectedStops((current) => current.filter((stop) => stop.stopId !== stopId));
  };

  const moveSelectedStop = (stopId: string, direction: "up" | "down") => {
    setSelectedStops((current) => {
      const currentIndex = current.findIndex((stop) => stop.stopId === stopId);
      if (currentIndex === -1) return current;

      const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (nextIndex < 0 || nextIndex >= current.length) return current;

      const nextStops = [...current];
      [nextStops[currentIndex], nextStops[nextIndex]] = [
        nextStops[nextIndex],
        nextStops[currentIndex],
      ];

      return nextStops;
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
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-adminPanel border border-admin-borderStrong bg-admin-surface p-6 shadow-adminPanel">
            <h2 className="text-xl font-bold text-admin-text" id="route-stop-title">設定站位：{stationRoute.routeNumber} {stationRoute.routeName}</h2>
            <p className="mt-2 text-sm leading-6 text-admin-muted">左側加入站位，右側用上移、下移調整順序。送出時會依右側排序寫入路線與站位關聯。</p>
            {stationError && (
              <p className="mt-4 rounded-adminControl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200" role="alert">
                {stationError}
              </p>
            )}
            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
              <section className="rounded-adminPanel border border-admin-border bg-admin-bg p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-admin-text">可加入站位</h3>
                  <span className="text-xs text-admin-muted">{availableStops.length} 筆</span>
                </div>
                <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
                  {isStopsLoading ? (
                    <p className="py-8 text-center text-sm text-admin-muted">讀取站位清單中…</p>
                  ) : availableStops.length === 0 ? (
                    <p className="py-8 text-center text-sm text-admin-muted">目前沒有可設定的站位。</p>
                  ) : availableStops.map((stop) => {
                    const isSelected = selectedStops.some((item) => item.stopId === stop.stopId);
                    return (
                      <button
                        aria-pressed={isSelected}
                        className={`flex w-full items-center justify-between gap-3 rounded-adminControl border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-adminStatus-enabled ${
                          isSelected
                            ? "border-adminStatus-enabled/60 bg-adminStatus-enabled/10 text-admin-text"
                            : "border-admin-border text-admin-softText hover:border-admin-borderStrong hover:bg-admin-elevated"
                        }`}
                        disabled={isSelected}
                        key={stop.stopId}
                        type="button"
                        onClick={() => addSelectedStop(stop)}
                      >
                        <span>
                          <span className="block font-medium">{stop.stopName}</span>
                          <span className="mt-1 block text-xs text-admin-muted">
                            {stop.stopType === "STATION" ? "轉運站" : "路邊站"}
                          </span>
                        </span>
                        <span className={`text-xs font-bold ${isSelected ? "text-adminStatus-enabled" : "text-admin-muted"}`}>
                          {isSelected ? "已加入" : "加入"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-adminPanel border border-admin-border bg-admin-bg p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-admin-text">已選站位順序</h3>
                  <span className="text-xs text-admin-muted">{selectedStops.length} 筆</span>
                </div>
                <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
                  {selectedStops.length === 0 ? (
                    <div className="rounded-adminControl border border-dashed border-admin-borderStrong px-4 py-8 text-center text-sm leading-6 text-admin-muted">
                      尚未選擇站位。若直接送出，將會清空此路線目前的站位設定。
                    </div>
                  ) : selectedStops.map((stop, index) => (
                    <div
                      className="grid gap-3 rounded-adminControl border border-admin-borderStrong bg-admin-surface px-4 py-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center"
                      key={stop.stopId}
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-adminStatus-enabled/15 text-sm font-black text-adminStatus-enabled">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-admin-text">{stop.stopName}</p>
                        <p className="mt-1 text-xs text-admin-muted">
                          {stop.stopType === "STATION" ? "轉運站" : "路邊站"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-adminControl border border-admin-borderStrong px-3 py-2 text-xs font-semibold text-admin-softText disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={index === 0}
                          type="button"
                          onClick={() => moveSelectedStop(stop.stopId, "up")}
                        >
                          上移
                        </button>
                        <button
                          className="rounded-adminControl border border-admin-borderStrong px-3 py-2 text-xs font-semibold text-admin-softText disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={index === selectedStops.length - 1}
                          type="button"
                          onClick={() => moveSelectedStop(stop.stopId, "down")}
                        >
                          下移
                        </button>
                        <button
                          className="rounded-adminControl border border-red-400/40 px-3 py-2 text-xs font-semibold text-red-300"
                          type="button"
                          onClick={() => removeSelectedStop(stop.stopId)}
                        >
                          移除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="h-11 rounded-adminControl border border-admin-borderStrong px-5 text-sm font-semibold text-admin-softText disabled:opacity-60" disabled={isUpdatingRouteStops} type="button" onClick={() => setStationRoute(null)}>取消</button>
              <button className="h-11 rounded-adminControl bg-adminStatus-enabled px-5 text-sm font-bold text-admin-bg disabled:opacity-60" disabled={isUpdatingRouteStops || isStopsLoading} type="button" onClick={saveStationSettings}>{isUpdatingRouteStops ? "儲存中…" : "儲存站位設定"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
