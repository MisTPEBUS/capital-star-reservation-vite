import apiClient from "./axiosInstance";

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface AuthProfile {
  userId: string;
  lineId: string;
  activeCode: string;
  displayName: string | null;
  phone: string | null;
  email: string | null;
  role: string;
  isEnabled: boolean;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export async function getAuthProfile(lineUserId: string) {
  const response = await apiClient.get<ApiResponse<AuthProfile>>(
    "/api/v1/auth/profile",
    {
      headers: {
        "X-Line-User-Id": lineUserId,
      },
    },
  );

  return response.data.data;
}
