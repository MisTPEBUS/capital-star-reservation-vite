import { useEffect, useRef, useState } from "react";

interface UseAdminIdleReloadOptions {
  timeoutMs?: number;
  enabled?: boolean;
}

const DEFAULT_IDLE_TIMEOUT_MS = 60_000;

export function useAdminIdleReload({
  timeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
  enabled = true,
}: UseAdminIdleReloadOptions = {}) {
  const lastActivityAtRef = useRef(Date.now());
  const isIdleRef = useRef(false);
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    if (!enabled) {
      isIdleRef.current = false;
      setIsIdle(false);
      return;
    }

    lastActivityAtRef.current = Date.now();
    isIdleRef.current = false;
    setIsIdle(false);
    let isReloading = false;
    let idleTimerId: number | undefined;

    const markAsIdle = () => {
      if (idleTimerId !== undefined) {
        window.clearTimeout(idleTimerId);
        idleTimerId = undefined;
      }
      isIdleRef.current = true;
      setIsIdle(true);
    };

    const scheduleIdleState = (activityAt: number) => {
      if (idleTimerId !== undefined) {
        window.clearTimeout(idleTimerId);
      }
      lastActivityAtRef.current = activityAt;
      idleTimerId = window.setTimeout(markAsIdle, timeoutMs);
    };

    scheduleIdleState(lastActivityAtRef.current);

    const reloadWhenIdle = (event: Event) => {
      if (isReloading) {
        if (event.cancelable) event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      const now = Date.now();
      if (!isIdleRef.current && now - lastActivityAtRef.current < timeoutMs) {
        scheduleIdleState(now);
        return;
      }

      isReloading = true;
      if (event.cancelable) event.preventDefault();
      event.stopImmediatePropagation();
      window.location.reload();
    };

    const recordActivity = () => {
      if (isReloading || isIdleRef.current) return;

      const now = Date.now();
      if (now - lastActivityAtRef.current < timeoutMs) {
        scheduleIdleState(now);
        return;
      }

      markAsIdle();
    };

    document.addEventListener("pointerdown", reloadWhenIdle, true);
    document.addEventListener("keydown", reloadWhenIdle, true);
    document.addEventListener("click", reloadWhenIdle, true);
    document.addEventListener("pointermove", reloadWhenIdle, true);
    document.addEventListener("scroll", recordActivity, {
      capture: true,
      passive: true,
    });
    document.addEventListener("wheel", recordActivity, {
      capture: true,
      passive: true,
    });

    return () => {
      if (idleTimerId !== undefined) {
        window.clearTimeout(idleTimerId);
      }
      document.removeEventListener("pointerdown", reloadWhenIdle, true);
      document.removeEventListener("keydown", reloadWhenIdle, true);
      document.removeEventListener("click", reloadWhenIdle, true);
      document.removeEventListener("pointermove", reloadWhenIdle, true);
      document.removeEventListener("scroll", recordActivity, true);
      document.removeEventListener("wheel", recordActivity, true);
    };
  }, [enabled, timeoutMs]);

  return isIdle;
}
