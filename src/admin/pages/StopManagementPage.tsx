import { FormEvent, useEffect, useRef, useState } from "react";
import * as QRCode from "qrcode";
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
const liffStopUrl = "https://liff.line.me/2010413282-LAFo4nYU";
const qrSizeOptions = [180, 240, 320, 480];
const defaultQrSize = 180;

function toNullableNumber(value: string) {
  if (!value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function getStopQrUrl(stopId: string) {
  const url = new URL(liffStopUrl);
  url.searchParams.set("stopId", stopId);
  return url.toString();
}

function getSafeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "_").trim() || "stop";
}

function getTextLines(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const lines: string[] = [];
  let currentLine = "";

  for (const char of text) {
    const nextLine = currentLine + char;
    if (context.measureText(nextLine).width <= maxWidth || !currentLine) {
      currentLine = nextLine;
      continue;
    }

    lines.push(currentLine);
    currentLine = char;
  }

  if (currentLine) lines.push(currentLine);
  return lines.slice(0, 2);
}

function fillRoundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height,
  );
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.fill();
}

function drawCenteredStopName(
  canvas: HTMLCanvasElement,
  stopName: string,
  size: number,
) {
  const context = canvas.getContext("2d");
  if (!context) return;

  const fontSize = Math.max(16, Math.round(size * 0.075));
  const lineHeight = Math.round(fontSize * 1.25);
  const maxTextWidth = size * 0.48;
  context.font = `700 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";

  const lines = getTextLines(context, stopName, maxTextWidth);
  const textWidth = Math.max(
    ...lines.map((line) => context.measureText(line).width),
    0,
  );
  const labelWidth = Math.min(
    size * 0.58,
    Math.max(textWidth + size * 0.1, size * 0.28),
  );
  const labelHeight = lines.length * lineHeight + size * 0.08;
  const labelX = (size - labelWidth) / 2;
  const labelY = (size - labelHeight) / 2;

  context.fillStyle = "#ffffff";
  fillRoundRect(
    context,
    labelX,
    labelY,
    labelWidth,
    labelHeight,
    Math.max(8, size * 0.035),
  );
  context.strokeStyle = "#111827";
  context.lineWidth = Math.max(2, size * 0.008);
  context.stroke();

  context.fillStyle = "#111827";
  lines.forEach((line, index) => {
    const offset = (index - (lines.length - 1) / 2) * lineHeight;
    context.fillText(line, size / 2, size / 2 + offset);
  });
}

function StopQrCode({
  label,
  onCopyUrl,
  size,
  stop,
}: {
  label: string;
  onCopyUrl: (url: string) => void;
  size: number;
  stop: AdminStop;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const qrUrl = getStopQrUrl(stop.stopId);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    QRCode.toCanvas(canvas, qrUrl, {
      color: {
        dark: "#111827",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
      margin: 2,
      width: size,
    }).then(() => {
      drawCenteredStopName(canvas, label || stop.stopName, size);
    });
  }, [label, qrUrl, size, stop.stopName]);

  const downloadQrCode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${getSafeFileName(stop.stopName)}-${size}px-qrcode.png`;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="rounded-adminControl border border-admin-border bg-admin-bg p-3">
      <canvas
        aria-label={`${stop.stopName} QR Code`}
        className="mx-auto h-auto max-w-full rounded-adminControl bg-white"
        height={size}
        ref={canvasRef}
        width={size}
      />
      <p className="mt-2 text-xs leading-5 text-admin-muted">
        連結已包含站位 ID。
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          className="h-10 rounded-adminControl border border-admin-borderStrong px-4 text-sm font-semibold text-admin-softText"
          type="button"
          onClick={() => onCopyUrl(qrUrl)}
        >
          複製連結
        </button>
        <button
          className="h-10 rounded-adminControl bg-adminStatus-enabled px-4 text-sm font-bold text-admin-bg"
          type="button"
          onClick={downloadQrCode}
        >
          下載 PNG
        </button>
      </div>
    </div>
  );
}

export function StopManagementPage() {
  const [stops, setStops] = useState<AdminStop[]>([]);
  const [form, setForm] = useState<StopPayload>(emptyPayload);
  const [editingStop, setEditingStop] = useState<AdminStop | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [qrSizes, setQrSizes] = useState<Record<string, number>>({});
  const [qrLabels, setQrLabels] = useState<Record<string, string>>({});
  const [expandedQrStopIds, setExpandedQrStopIds] = useState<
    Record<string, boolean>
  >({});

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
    setIsFormOpen(true);
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
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (isSaving) return;
    setIsFormOpen(false);
    setEditingStop(null);
    setForm(emptyPayload);
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
          current.map((stop) =>
            stop.stopId === editingStop.stopId ? updated : stop,
          ),
        );
        setNotice({ type: "success", message: "站位已更新。" });
      } else {
        const created = await createStop(payload);
        setStops((current) => [...current, created]);
        setNotice({ type: "success", message: "站位已新增。" });
      }
      setEditingStop(null);
      setForm(emptyPayload);
      setIsFormOpen(false);
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
      setStops((current) =>
        current.filter((item) => item.stopId !== stop.stopId),
      );
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

  const toggleQrPanel = (stopId: string) => {
    setExpandedQrStopIds((current) => ({
      ...current,
      [stopId]: !current[stopId],
    }));
  };

  const copyQrUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setNotice({ type: "success", message: "QR Code 連結已複製。" });
    } catch {
      setNotice({ type: "error", message: "複製連結失敗，請稍後再試。" });
    }
  };

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="admin-page-title">站位設定</h1>
          <p className="admin-page-description">
            管理路線可使用的轉運站與路邊站位。
          </p>
        </div>
        <button
          className="h-11 rounded-adminControl bg-adminStatus-enabled px-5 text-sm font-bold text-admin-bg transition hover:bg-emerald-300"
          type="button"
          onClick={openCreateForm}
        >
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

      <section className="admin-panel-body overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-admin-border px-4 py-3">
          <h2 className="admin-section-title">站位清單</h2>
          <button
            className="text-sm font-semibold text-adminStatus-enabled"
            type="button"
            onClick={loadStops}
          >
            重新整理
          </button>
        </div>
        {isLoading ? (
          <p className="px-4 py-6 text-center text-admin-muted">讀取站位中…</p>
        ) : stops.length === 0 ? (
          <p className="px-4 py-6 text-center text-admin-muted">
            目前沒有站位資料。
          </p>
        ) : (
          <div className="divide-y divide-admin-border">
            {stops.map((stop) => {
              const qrSize = qrSizes[stop.stopId] ?? defaultQrSize;
              const qrLabel = qrLabels[stop.stopId] ?? stop.stopName;
              const isQrExpanded = expandedQrStopIds[stop.stopId] ?? false;

              return (
                <article className="px-4 py-3" key={stop.stopId}>
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-admin-text">
                          {stop.stopName}
                        </h3>
                        <span className="rounded-full bg-admin-elevated px-2 py-0.5 text-xs font-bold text-admin-softText">
                          {stop.stopType === "STATION" ? "轉運站" : "路邊站"}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold ${stop.status === "ACTIVE" ? "bg-adminStatus-enabled/10 text-adminStatus-enabled" : "bg-admin-elevated text-admin-muted"}`}
                        >
                          {stop.status === "ACTIVE" ? "啟用" : "停用"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-admin-muted">
                        {stop.address || "未提供地址"}
                      </p>
                      {(stop.latitude !== null || stop.longitude !== null) && (
                        <p className="mt-1 text-xs text-admin-muted">
                          座標：{stop.latitude ?? "-"}, {stop.longitude ?? "-"}
                        </p>
                      )}
                      <p className="mt-2 break-all text-xs text-admin-muted">
                        站位 ID：{stop.stopId}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <button
                        aria-expanded={isQrExpanded}
                        className="rounded-adminControl border border-admin-borderStrong px-3 py-2 text-sm font-semibold text-admin-softText"
                        type="button"
                        onClick={() => toggleQrPanel(stop.stopId)}
                      >
                        {isQrExpanded ? "收合 QR Code" : "產生 QR Code"}
                      </button>
                      <button
                        className="rounded-adminControl border border-admin-borderStrong px-3 py-2 text-sm font-semibold text-admin-softText"
                        type="button"
                        onClick={() => openEditForm(stop)}
                      >
                        修改
                      </button>
                      <button
                        className="rounded-adminControl border border-red-400/40 px-3 py-2 text-sm font-semibold text-red-300 disabled:opacity-60"
                        disabled={isDeletingId === stop.stopId}
                        type="button"
                        onClick={() => removeStop(stop)}
                      >
                        {isDeletingId === stop.stopId ? "刪除中…" : "刪除"}
                      </button>
                    </div>
                  </div>

                  {isQrExpanded && (
                    <div className="mt-4 grid gap-4 rounded-adminControl border border-admin-border bg-admin-elevated/40 p-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="text-xs font-medium text-admin-softText">
                          QR Code 大小
                          <select
                            className="mt-1 h-10 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-admin-text outline-none focus:border-adminStatus-enabled"
                            value={qrSize}
                            onChange={(event) =>
                              setQrSizes((current) => ({
                                ...current,
                                [stop.stopId]: Number(event.target.value),
                              }))
                            }
                          >
                            {qrSizeOptions.map((size) => (
                              <option key={size} value={size}>
                                {size} x {size} px
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs font-medium text-admin-softText">
                          QR Code 中央文字
                          <input
                            className="mt-1 h-10 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-admin-text outline-none focus:border-adminStatus-enabled"
                            value={qrLabel}
                            onChange={(event) =>
                              setQrLabels((current) => ({
                                ...current,
                                [stop.stopId]: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <p className="sm:col-span-2 text-xs leading-5 text-admin-muted">
                          QR Code 連結會帶入此站位
                          ID，中央文字可依現場張貼需求調整。
                        </p>
                      </div>
                      <StopQrCode
                        label={qrLabel}
                        onCopyUrl={copyQrUrl}
                        size={qrSize}
                        stop={stop}
                      />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="stop-form-title"
        >
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-adminPanel border border-admin-borderStrong bg-admin-surface p-5 shadow-adminPanel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  className="text-xl font-bold text-admin-text"
                  id="stop-form-title"
                >
                  {editingStop ? "修改站位" : "新增站位"}
                </h2>
                <p className="mt-1 text-sm text-admin-muted">
                  設定站位名稱、類型、地址、座標與狀態。
                </p>
              </div>
              <button
                aria-label="關閉"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-admin-borderStrong text-xl font-semibold leading-none text-admin-softText transition hover:border-adminStatus-enabled hover:text-adminStatus-enabled"
                type="button"
                onClick={closeForm}
              >
                ×
              </button>
            </div>
            <form
              className="mt-5 grid gap-4 md:grid-cols-2"
              onSubmit={saveStop}
            >
              <label className="text-sm font-medium text-admin-softText">
                站位名稱
                <input
                  className="mt-2 h-11 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-admin-text outline-none focus:border-adminStatus-enabled"
                  value={form.stopName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      stopName: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="text-sm font-medium text-admin-softText">
                站位類型
                <select
                  className="mt-2 h-11 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-admin-text outline-none focus:border-adminStatus-enabled"
                  value={form.stopType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      stopType: event.target.value as StopType,
                    }))
                  }
                >
                  <option value="ROADSIDE">路邊站</option>
                  <option value="STATION">轉運站</option>
                </select>
              </label>
              <label className="text-sm font-medium text-admin-softText md:col-span-2">
                地址
                <input
                  className="mt-2 h-11 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-admin-text outline-none focus:border-adminStatus-enabled"
                  value={form.address ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      address: event.target.value || null,
                    }))
                  }
                />
              </label>
              <label className="text-sm font-medium text-admin-softText">
                緯度
                <input
                  className="mt-2 h-11 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-admin-text outline-none focus:border-adminStatus-enabled"
                  inputMode="decimal"
                  value={form.latitude ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      latitude: toNullableNumber(event.target.value),
                    }))
                  }
                />
              </label>
              <label className="text-sm font-medium text-admin-softText">
                經度
                <input
                  className="mt-2 h-11 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-admin-text outline-none focus:border-adminStatus-enabled"
                  inputMode="decimal"
                  value={form.longitude ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      longitude: toNullableNumber(event.target.value),
                    }))
                  }
                />
              </label>
              <label className="text-sm font-medium text-admin-softText">
                狀態
                <select
                  className="mt-2 h-11 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-admin-text outline-none focus:border-adminStatus-enabled"
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as StopStatus,
                    }))
                  }
                >
                  <option value="ACTIVE">啟用</option>
                  <option value="INACTIVE">停用</option>
                </select>
              </label>
              <div className="flex items-end justify-end gap-3 md:col-span-2">
                <button
                  className="h-11 rounded-adminControl border border-admin-borderStrong px-5 text-sm font-semibold text-admin-softText disabled:opacity-60"
                  disabled={isSaving}
                  type="button"
                  onClick={closeForm}
                >
                  取消
                </button>
                <button
                  className="h-11 rounded-adminControl bg-adminStatus-enabled px-5 text-sm font-bold text-admin-bg disabled:opacity-60"
                  disabled={isSaving}
                  type="submit"
                >
                  {isSaving ? "儲存中…" : editingStop ? "儲存修改" : "新增站位"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
