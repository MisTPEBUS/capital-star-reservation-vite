import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";

import App from "./App";
import AdminApp from "./admin/AdminApp";
import { UpcomingReservationPage } from "./pages/UpcomingReservationPage";
import { FaqPage } from "./pages/FaqPage";
import { FrontendUIKitPage } from "./pages/FrontendUIKitPage";
import { RegisterProfilePage } from "./pages/RegisterProfilePage";
import { initializeLiff } from "./liff/liffClient";

import "./index.css";

const APP_VERSION = import.meta.env.VITE_APP_VERSION;
const APP_VERSION_KEY = "capital_star_app_version";

function isAdminRoute() {
  return window.location.hash.startsWith("#/admin");
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
  handleAppVersion();

  if (!isAdminRoute()) {
    try {
      await initializeLiff();
    } catch (error) {
      console.error("LIFF_INIT_ERROR:", error);
    }
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <HashRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/register" element={<RegisterProfilePage />} />
          <Route path="/ticket" element={<UpcomingReservationPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/ui-kit" element={<FrontendUIKitPage />} />
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </HashRouter>
    </React.StrictMode>,
  );
}

bootstrap();
