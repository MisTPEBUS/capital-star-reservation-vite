import "./admin.css";
import { Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./AdminLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { ScheduleManagementPage } from "./pages/ScheduleManagementPage";
import { UserPermissionsPage } from "./pages/UserPermissionsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { DispatchManagementPage } from "./pages/DispatchManagementPage";
import { RouteManagementPage } from "./pages/RouteManagementPage";
import { StopManagementPage } from "./pages/StopManagementPage";

export default function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<AdminLayout />}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="employees" element={<UserPermissionsPage />} />
        <Route path="schedules" element={<ScheduleManagementPage />} />
        <Route
          path="dispatch/reservations"
          element={<DispatchManagementPage title="營運預約班次" />}
        />
        <Route
          path="dispatch/stops"
          element={<StopManagementPage />}
        />
        <Route
          path="dispatch/routes"
          element={<RouteManagementPage />}
        />
        <Route
          path="dispatch/schedules"
          element={<DispatchManagementPage title="班次設定" />}
        />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate replace to="login" />} />
    </Routes>
  );
}
