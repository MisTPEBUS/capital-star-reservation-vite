import { useCallback, useEffect, useState } from "react";

export type GeolocationSuccess = {
  status: "success";
  latitude: number;
  longitude: number;
  accuracy: number;
};

export type GeolocationState =
  | { status: "loading" }
  | { status: "unsupported" }
  | { status: "error"; message: string }
  | GeolocationSuccess;

const getGeolocationErrorMessage = (error: GeolocationPositionError) => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "目前無法取得 GPS 位置，請確認裝置已開啟定位功能，並且關閉後重新開啟網頁。";
    case error.POSITION_UNAVAILABLE:
      return "目前無法取得 GPS 位置，請確認裝置已開啟定位功能。";
    case error.TIMEOUT:
      return "取得 GPS 位置逾時，請稍後再試。";
    default:
      return "取得 GPS 位置時發生錯誤，請稍後再試。";
  }
};

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    status: "loading",
  });

  const requestPosition = useCallback((): Promise<GeolocationSuccess> => {
    if (!("geolocation" in navigator)) {
      setState({ status: "unsupported" });
      return Promise.reject(new Error("此瀏覽器不支援 GPS 定位。"));
    }

    setState({ status: "loading" });
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const position: GeolocationSuccess = {
          status: "success",
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          };
          setState(position);
          resolve(position);
        },
        (error) => {
          const message = getGeolocationErrorMessage(error);
          setState({ status: "error", message });
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10_000,
          maximumAge: 60_000,
        },
      );
    });
  }, []);

  useEffect(() => {
    void requestPosition().catch(() => undefined);
  }, [requestPosition]);

  return { state, requestPosition };
}
