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
  firstName: string | null;
  sex: string | null;
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

export interface UpdateAuthProfileInput {
  firstName: string;
  sex: string;
}

export function isProfileRegistrationRequired(profile: AuthProfile) {
  return !profile.firstName?.trim() || !profile.sex?.trim();
}

export function getSexTitle(sex: string | null | undefined) {
  const normalizedSex = sex?.trim().toUpperCase();

  if (
    normalizedSex === "MALE" ||
    normalizedSex === "M" ||
    normalizedSex === "男"
  ) {
    return "先生";
  }

  if (
    normalizedSex === "FEMALE" ||
    normalizedSex === "F" ||
    normalizedSex === "女"
  ) {
    return "小姐";
  }

  return "";
}

export function getPreferredProfileName(
  profile: Pick<AuthProfile, "firstName" | "sex" | "displayName">,
  fallbackName: string,
) {
  const firstName = profile.firstName?.trim();
  const title = getSexTitle(profile.sex);

  if (firstName && title) return `${firstName}${title}`;
  if (firstName) return firstName;

  return profile.displayName ?? fallbackName;
}

export async function updateAuthProfile(
  lineUserId: string,
  input: UpdateAuthProfileInput,
) {
  const response = await apiClient.patch<ApiResponse<AuthProfile>>(
    "/api/v1/auth/profile",
    input,
    {
      headers: {
        "X-Line-User-Id": lineUserId,
      },
    },
  );

  return response.data.data;
}
