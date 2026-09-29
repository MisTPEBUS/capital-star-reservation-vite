import type { GeolocationState } from "../hooks/useGeolocation";

interface GpsCoordinatesCardProps {
  state: GeolocationState;
}

export function GpsCoordinatesCard({ state }: GpsCoordinatesCardProps) {
  const message =
    state.status === "unsupported"
      ? "此瀏覽器不支援 GPS 定位。"
      : state.status === "error"
        ? state.message
        : null;

  if (!message) return null;

  return (
    <section
      aria-live="polite"
      className="rounded-panel border border-coral/20 bg-coral/10 p-4 shadow-card"
    >
      <p className="text-sm font-bold leading-6 text-coral">{message}</p>
    </section>
  );
}
