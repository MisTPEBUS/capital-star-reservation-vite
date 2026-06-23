import axios from "axios";
import {
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
  if (config.url?.startsWith("/api/v1/admin/") && hasValidAdminSession()) {
    const session = getAdminSession();
    config.headers.Authorization = `${session?.tokenType || "Bearer"} ${session?.accessToken}`;
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
