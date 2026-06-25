import { FormEvent, useEffect, useState } from "react";
import {
  type AdminStop,
  createStop,
  deleteStop,
  getStops,
  type StopPayload,
  type StopStatus,
  type StopType,
  updateStop,
} from "../../api/admin/stops";

const emptyPayload: StopPayload = {
  stopName: "",
  stopType: "ROADSIDE",
  address: null,
  latitude: null,
  longitude: null,
  status: "ACTIVE",
};

type Notice = { type: "success" | "error"; message: string } | null;

function toNullableNumber(value: string) {
  if (!value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function StopManagementPage() {
  const [stops, setStops] = useState<AdminStop[]>([]);
  const [form, setForm] = useState<StopPayload>(emptyPayload);
  const [editingStop, setEditingStop] = useState<AdminStop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const loadStops = async () => {
    try {
      setIsLoading(true);
      setStops(await getStops());
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "讀取站位清單失敗。",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStops();
  }, []);

  const openCreateForm = () => {
    setEditingStop(null);
    setForm(emptyPayload);
    setNotice(null);
  };

  const openEditForm = (stop: AdminStop) => {
    setEditingStop(stop);
    setForm({
      stopName: stop.stopName,
      stopType: stop.stopType,
      address: stop.address,
      latitude: stop.latitude,
      longitude: stop.longitude,
      status: stop.status,
    });
    setNotice(null);
  };

  const saveStop = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.stopName.trim()) {
      setNotice({ type: "error", message: "請填寫站位名稱。" });
      return;
    }

    const payload = { ...form, stopName: form.stopName.trim() };
    try {
      setIsSaving(true);
      if (editingStop) {
        const updated = await updateStop(editingStop.stopId, payload);
        setStops((current) =>
          current.map((stop) => (stop.stopId === editingStop.stopId ? updated : stop)),
        );
        setNotice({ type: "success", message: "站位已更新。" });
      } else {
        const created = await createStop(payload);
        setStops((current) => [...current, created]);
        setNotice({ type: "success", message: "站位已新增。" });
      }
      setEditingStop(null);
      setForm(emptyPayload);
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "儲存站位失敗。",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const removeStop = async (stop: AdminStop) => {
    if (!window.confirm(`確定要刪除站位「${stop.stopName}」嗎？`)) return;

    try {
      setIsDeletingId(stop.stopId);
      await deleteStop(stop.stopId);
      setStops((current) => current.filter((item) => item.stopId !== stop.stopId));
      setNotice({ type: "success", message: "站位已刪除。" });
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "刪除站位失敗。",
      });
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="admin-page-kicker">DISPATCH MANAGEMENT</p>
          <h1 className="admin-page-title">站位設定</h1>
          <p className="admin-page-description">管理路線可使用的轉運站與路邊站位。</p>
        </div>
        <button className="h-11 rounded-adminControl bg-adminStatus-enabled px-5 text-sm font-bold text-admin-bg transition hover:bg-emerald-300" type="button" onClick={openCreateForm}>
          新增站位
        </button>
      </section>

      {notice && (
        <p
          className={`rounded-adminControl border px-4 py-3 text-sm ${notice.type === "success" ? "border-adminStatus-enabled/30 bg-adminStatus-enabled/10 text-adminStatus-enabledText" : "border-red-400/30 bg-red-400/10 text-red-200"}`}
          role="status"
        >
          {notice.message}
        </p>
      )}

      <section className="admin-panel-body">
        <h2 className="admin-section-title">{editingStop ? "修改站位" : "新增站位"}</h2>
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={saveStop}>
          <label className="text-sm font-medium text-admin-softText">
            站位名稱
            <input className="mt-2 h-11 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-admin-text outline-none focus:border-adminStatus-enabled" value={form.stopName} onChange={(event) => setForm((current) => ({ ...current, stopName: event.target.value }))} />
          </label>
          <label className="text-sm font-medium text-admin-softText">
            站位類型
            <select className="mt-2 h-11 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-admin-text outline-none focus:border-adminStatus-enabled" value={form.stopType} onChange={(event) => setForm((current) => ({ ...current, stopType: event.target.value as StopType }))}>
              <option value="ROADSIDE">路邊站</option>
              <option value="STATION">轉運站</option>
            </select>
          </label>
          <label className="text-sm font-medium text-admin-softText md:col-span-2">
            地址
            <input className="mt-2 h-11 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-admin-text outline-none focus:border-adminStatus-enabled" value={form.address ?? ""} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value || null }))} />
          </label>
          <label className="text-sm font-medium text-admin-softText">
            緯度
            <input className="mt-2 h-11 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-admin-text outline-none focus:border-adminStatus-enabled" inputMode="decimal" value={form.latitude ?? ""} onChange={(event) => setForm((current) => ({ ...current, latitude: toNullableNumber(event.target.value) }))} />
          </label>
          <label className="text-sm font-medium text-admin-softText">
            經度
            <input className="mt-2 h-11 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-admin-text outline-none focus:border-adminStatus-enabled" inputMode="decimal" value={form.longitude ?? ""} onChange={(event) => setForm((current) => ({ ...current, longitude: toNullableNumber(event.target.value) }))} />
          </label>
          <label className="text-sm font-medium text-admin-softText">
            狀態
            <select className="mt-2 h-11 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-admin-text outline-none focus:border-adminStatus-enabled" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as StopStatus }))}>
              <option value="ACTIVE">啟用</option>
              <option value="INACTIVE">停用</option>
            </select>
          </label>
          <div className="flex items-end gap-3">
            <button className="h-11 rounded-adminControl bg-adminStatus-enabled px-5 text-sm font-bold text-admin-bg disabled:opacity-60" disabled={isSaving} type="submit">
              {isSaving ? "儲存中…" : editingStop ? "儲存修改" : "新增站位"}
            </button>
            {editingStop && <button className="h-11 rounded-adminControl border border-admin-borderStrong px-5 text-sm font-semibold text-admin-softText" type="button" onClick={openCreateForm}>取消修改</button>}
          </div>
        </form>
      </section>

      <section className="admin-panel-body overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-admin-border px-5 py-4">
          <h2 className="admin-section-title">站位清單</h2>
          <button className="text-sm font-semibold text-adminStatus-enabled" type="button" onClick={loadStops}>重新整理</button>
        </div>
        {isLoading ? (
          <p className="px-5 py-8 text-center text-admin-muted">讀取站位中…</p>
        ) : stops.length === 0 ? (
          <p className="px-5 py-8 text-center text-admin-muted">目前沒有站位資料。</p>
        ) : (
          <div className="divide-y divide-admin-border">
            {stops.map((stop) => (
              <article className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center" key={stop.stopId}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-admin-text">{stop.stopName}</h3>
                    <span className="rounded-full bg-admin-elevated px-2 py-0.5 text-xs font-bold text-admin-softText">{stop.stopType === "STATION" ? "轉運站" : "路邊站"}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${stop.status === "ACTIVE" ? "bg-adminStatus-enabled/10 text-adminStatus-enabled" : "bg-admin-elevated text-admin-muted"}`}>{stop.status === "ACTIVE" ? "啟用" : "停用"}</span>
                  </div>
                  <p className="mt-2 text-sm text-admin-muted">{stop.address || "未提供地址"}</p>
                  {(stop.latitude !== null || stop.longitude !== null) && <p className="mt-1 text-xs text-admin-muted">座標：{stop.latitude ?? "-"}, {stop.longitude ?? "-"}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="rounded-adminControl border border-admin-borderStrong px-3 py-2 text-sm font-semibold text-admin-softText" type="button" onClick={() => openEditForm(stop)}>修改</button>
                  <button className="rounded-adminControl border border-red-400/40 px-3 py-2 text-sm font-semibold text-red-300 disabled:opacity-60" disabled={isDeletingId === stop.stopId} type="button" onClick={() => removeStop(stop)}>{isDeletingId === stop.stopId ? "刪除中…" : "刪除"}</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
