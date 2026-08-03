import { useCallback, useEffect, useState } from "react";

type GeolocationState =
  | { status: "loading" }
  | { status: "unsupported" }
  | { status: "error"; message: string }
  | {
      status: "success";
      latitude: number;
      longitude: number;
      accuracy: number;
    };

const getGeolocationErrorMessage = (error: GeolocationPositionError) => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "無法取得位置權限，請在瀏覽器設定中允許存取位置。";
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

  const requestPosition = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState({ status: "unsupported" });
      return;
    }

    setState({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setState({
          status: "success",
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        });
      },
      (error) => {
        setState({
          status: "error",
          message: getGeolocationErrorMessage(error),
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 60_000,
      },
    );
  }, []);

  useEffect(() => {
    requestPosition();
  }, [requestPosition]);

  return { state, requestPosition };
}
