import { useCallback, useEffect, useState } from "react";
import { getStops, type AdminStop } from "../api/admin/stops";
import type { PickupStop } from "../types/reservation";

export type PickupStopsStatus = "loading" | "success" | "error";

function toPickupStop(stop: AdminStop): PickupStop {
  return {
    stopId: stop.stopId,
    stopName: stop.stopName,
    stopType: stop.stopType === "STATION" ? "MAIN_STATION" : "ROADSIDE",
    address: stop.address ?? "",
    shortLabel: stop.stopName,
  };
}

export function usePickupStops() {
  const [stops, setStops] = useState<PickupStop[]>([]);
  const [status, setStatus] = useState<PickupStopsStatus>("loading");
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const retry = useCallback(() => setRetryKey((current) => current + 1), []);

  useEffect(() => {
    let isCurrent = true;

    async function loadStops() {
      setStatus("loading");
      setError("");

      try {
        const result = await getStops();
        if (!isCurrent) return;
        setStops(
          result.filter((stop) => stop.status === "ACTIVE").map(toPickupStop),
        );
        setStatus("success");
      } catch (loadError) {
        if (!isCurrent) return;
        console.error("PICKUP_STOPS_ERROR:", loadError);
        setStops([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "上車站資料讀取失敗",
        );
        setStatus("error");
      }
    }

    void loadStops();
    return () => {
      isCurrent = false;
    };
  }, [retryKey]);

  return { stops, status, error, retry };
}
