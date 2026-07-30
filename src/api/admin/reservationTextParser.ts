import axios from "axios";
import apiClient from "../axiosInstance";

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface ParsedReservationText {
  time: string;
  phone: string;
  name: string;
  passengerCount: number;
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    return error.response?.data?.message || "無法解析預約內容，請稍後再試。";
  }

  return error instanceof Error
    ? error.message
    : "無法解析預約內容，請稍後再試。";
}

export async function parseReservationText(text: string) {
  try {
    const response = await apiClient.post<ApiResponse<ParsedReservationText>>(
      "/api/v1/admin/reservation-text-parser/parse",
      { text },
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (response.data.code !== 0 || !response.data.data) {
      throw new Error(response.data.message || "無法解析預約內容。");
    }

    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
