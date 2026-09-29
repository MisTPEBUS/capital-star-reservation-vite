import axios from "axios";
import {
  SUPER_ADMIN_TOKEN_HEADER,
  clearAdminSession,
  getAdminSession,
  hasValidAdminSession,
} from "./admin/session";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

apiClient.interceptors.request.use((config) => {
  if (
    !config.url?.startsWith("/api/v1/admin/") ||
    config.headers.has(SUPER_ADMIN_TOKEN_HEADER) ||
    !hasValidAdminSession()
  ) {
    return config;
  }

  const session = getAdminSession();
  if (session?.authType === "superAdmin") {
    config.headers.set(SUPER_ADMIN_TOKEN_HEADER, session.superAdminToken);
  } else if (session) {
    config.headers.Authorization = `${session.tokenType || "Bearer"} ${session.accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAdminSession();
    }

    return Promise.reject(error);
  },
);

export default apiClient;
