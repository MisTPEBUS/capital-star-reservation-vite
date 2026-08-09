import { LocateFixed, MapPin } from "lucide-react";
import type { GeolocationState } from "../hooks/useGeolocation";

interface GpsCoordinatesCardProps {
  state: GeolocationState;
  requestPosition: () => Promise<unknown>;
}

const formatCoordinate = (coordinate: number) => coordinate.toFixed(6);

export function GpsCoordinatesCard({
  state,
  requestPosition,
}: GpsCoordinatesCardProps) {
  return (
    <section
      aria-live="polite"
      className="rounded-panel border border-bus-100 bg-white p-4 shadow-card"
    >
      <div className="flex items-center gap-2">
        <MapPin aria-hidden="true" className="h-5 w-5 text-bus-600" />
        <h2 className="text-base font-black text-ink-900">
          使用者 GPS 座標__2
        </h2>
      </div>

      {state.status === "loading" && (
        <p className="mt-2 text-sm font-bold text-ink-500">正在取得目前位置…</p>
      )}

      {state.status === "success" && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-bus-50 px-3 py-2">
            <p className="text-xs font-bold text-ink-500">緯度</p>
            <p className="mt-1 font-mono text-sm font-black text-ink-900">
              {formatCoordinate(state.latitude)}
            </p>
          </div>
          <div className="rounded-xl bg-bus-50 px-3 py-2">
            <p className="text-xs font-bold text-ink-500">經度</p>
            <p className="mt-1 font-mono text-sm font-black text-ink-900">
              {formatCoordinate(state.longitude)}
            </p>
          </div>
          <p className="col-span-2 text-xs font-bold text-ink-500">
            定位精度約 ±{Math.round(state.accuracy)} 公尺
          </p>
        </div>
      )}

      {state.status === "unsupported" && (
        <p className="mt-2 text-sm font-bold text-coral">
          此瀏覽器不支援 GPS 定位。
        </p>
      )}

      {state.status === "error" && (
        <div className="mt-2 flex items-start justify-between gap-3">
          <p className="text-sm font-bold leading-6 text-coral">
            {state.message}
          </p>
          <button
            type="button"
            onClick={() => void requestPosition().catch(() => undefined)}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-bus-50 px-3 py-2 text-sm font-black text-bus-700 ring-1 ring-bus-100 transition hover:bg-bus-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bus-500"
          >
            <LocateFixed aria-hidden="true" className="h-4 w-4" />
            重試
          </button>
        </div>
      )}
    </section>
  );
}
