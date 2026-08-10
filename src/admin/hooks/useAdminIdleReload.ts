import { useEffect, useRef, useState } from "react";

interface UseAdminIdleReloadOptions {
  timeoutMs?: number;
  enabled?: boolean;
}

const DEFAULT_IDLE_TIMEOUT_MS = 600_000;

export function useAdminIdleReload({
  timeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
  enabled = true,
}: UseAdminIdleReloadOptions = {}) {
  const lastActivityAtRef = useRef(Date.now());
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsIdle(false);
      return;
    }

    lastActivityAtRef.current = Date.now();
    setIsIdle(false);
    let idleTimerId: number | undefined;

    const reloadPage = () => {
      setIsIdle(true);
      window.location.reload();
    };

    const scheduleIdleReload = () => {
      if (idleTimerId !== undefined) {
        window.clearTimeout(idleTimerId);
      }

      const elapsed = Date.now() - lastActivityAtRef.current;
      const remaining = Math.max(timeoutMs - elapsed, 0);
      idleTimerId = window.setTimeout(reloadPage, remaining);
    };

    const recordActivity = () => {
      lastActivityAtRef.current = Date.now();
      setIsIdle(false);
      scheduleIdleReload();
    };

    scheduleIdleReload();

    const activityEvents: Array<keyof DocumentEventMap> = [
      "pointerdown",
      "pointermove",
      "keydown",
      "click",
      "scroll",
      "wheel",
      "touchstart",
    ];

    activityEvents.forEach((eventName) => {
      document.addEventListener(eventName, recordActivity, {
        capture: true,
        passive: true,
      });
    });

    return () => {
      if (idleTimerId !== undefined) {
        window.clearTimeout(idleTimerId);
      }
      activityEvents.forEach((eventName) => {
        document.removeEventListener(eventName, recordActivity, true);
      });
    };
  }, [enabled, timeoutMs]);

  return isIdle;
}
