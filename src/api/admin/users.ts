import apiClient from "../axiosInstance";

export type UserRole = "MEMBER" | "STAFF" | "ADMIN";

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface AdminUser {
  userId: string;
  displayName: string | null;
  lineId: string | null;
  email: string | null;
  phone: string | null;
  activeCode: string | null;
  role: UserRole;
  isEnabled: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserRoleUpdateResult {
  userId: string;
  activeCode: string;
  previousRole: UserRole;
  role: UserRole;
  updatedAt: string;
}

export async function getAdminUsers(role?: UserRole) {
  const response = await apiClient.get<ApiResponse<AdminUser[]>>(
    "/api/v1/admin/users",
    {
      params: role ? { role } : undefined,
    },
  );

  if (response.data.code !== 0 || !response.data.data) {
    throw new Error(response.data.message || "使用者清單讀取失敗");
  }

  return response.data.data;
}

export async function findUserByActiveCode(activeCode: string) {
  const response = await apiClient.post<ApiResponse<AdminUser>>(
    "/api/v1/admin/users/active-code",
    { ActiveCode: activeCode },
  );

  if (response.data.code !== 0 || !response.data.data) {
    throw new Error(response.data.message || "查無使用者資料");
  }

  return response.data.data;
}

export async function updateUserRole(activeCode: string, role: UserRole) {
  const response = await apiClient.patch<ApiResponse<UserRoleUpdateResult>>(
    "/api/v1/admin/users/role",
    { ActiveCode: activeCode, Role: role },
  );

  if (response.data.code !== 0 || !response.data.data) {
    throw new Error(response.data.message || "更新使用者權限失敗");
  }

  return response.data.data;
}
