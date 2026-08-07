import axios from "axios";
import apiClient from "../axiosInstance";

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface TaiwaneseReservationFields {
  date: string;
  schedule: string;
  time: string;
  phone: string;
  name: string;
  passengerCount: number;
}

export interface TaiwaneseTranslationResult {
  transcript: string;
  reservation: TaiwaneseReservationFields;
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    if (error.response?.status === 413) {
      return "錄音檔超過 25 MB，請縮短錄音後再試。";
    }

    return error.response?.data?.message || "台語語音解析失敗，請稍後再試。";
  }

  return error instanceof Error
    ? error.message
    : "台語語音解析失敗，請稍後再試。";
}

export async function parseTaiwaneseReservationAudio(audio: Blob) {
  const formData = new FormData();
  const extension = audio.type.includes("ogg")
    ? "ogg"
    : audio.type.includes("mp4")
      ? "m4a"
      : "webm";
  formData.append(
    "audio",
    new File([audio], `taiwanese-reservation.${extension}`, {
      type: audio.type || "audio/webm",
    }),
  );

  try {
    const response = await apiClient.post<
      ApiResponse<TaiwaneseTranslationResult>
    >("/api/v1/admin/taiwanese-translation/parse-audio", formData, {
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
      timeout: 120000,
    });

    if (response.data.code !== 0 || !response.data.data) {
      throw new Error(response.data.message || "台語語音解析失敗。");
    }

    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
