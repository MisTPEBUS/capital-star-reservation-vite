import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";

import AdminApp from "./admin/AdminApp";
import { FaqPage } from "./pages/FaqPage";
import { FrontendUIKitPage } from "./pages/FrontendUIKitPage";
import { SystemGuideDemoPage } from "./pages/SystemGuideDemoPage";

import "./index.css";

const APP_VERSION = import.meta.env.VITE_APP_VERSION;
const APP_VERSION_KEY = "capital_star_app_version";
const App = lazy(() => import("./App"));
const RegisterProfilePage = lazy(() =>
  import("./pages/RegisterProfilePage").then((module) => ({ default: module.RegisterProfilePage })),
);
const UpcomingReservationPage = lazy(() =>
  import("./pages/UpcomingReservationPage").then((module) => ({ default: module.UpcomingReservationPage })),
);

function isAdminRoute() {
  return window.location.hash.startsWith("#/admin");
}

function isDialogDemoRoute() {
  return window.location.hash.split("?")[0] === "#/dialog-demo";
}

function handleAppVersion() {
  const previousVersion = localStorage.getItem(APP_VERSION_KEY);

  console.info("APP_VERSION:", APP_VERSION);
  console.info("PREVIOUS_APP_VERSION:", previousVersion);

  if (previousVersion && previousVersion !== APP_VERSION) {
    console.info(`APP_VERSION_CHANGED: ${previousVersion} -> ${APP_VERSION}`);

    // 只清理本系統自己存的資料
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    // 如果你的專案有其他 cache key，也在這裡清
    sessionStorage.clear();
  }

  localStorage.setItem(APP_VERSION_KEY, APP_VERSION);
}

async function bootstrap() {
  const isDemo = isDialogDemoRoute();

  if (!isDemo) handleAppVersion();

  if (!isAdminRoute() && !isDemo) {
    try {
      const { initializeLiff } = await import("./liff/liffClient");
      await initializeLiff();
    } catch (error) {
      console.error("LIFF_INIT_ERROR:", error);
    }
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <HashRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/register" element={<RegisterProfilePage />} />
            <Route path="/ticket" element={<UpcomingReservationPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/ui-kit" element={<FrontendUIKitPage />} />
            <Route path="/dialog-demo" element={<SystemGuideDemoPage />} />
            <Route path="/admin/*" element={<AdminApp />} />
            <Route path="*" element={<Navigate replace to="/" />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </React.StrictMode>,
  );
}

bootstrap();
