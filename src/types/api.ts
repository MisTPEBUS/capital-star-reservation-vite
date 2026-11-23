/** 後端共通成功回應格式：{ code, message, data, timestamp } */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

/** 後端共通錯誤回應格式：{ code, message, errors } */
export interface ApiErrorResponse {
  code: number;
  message: string;
  errors: Record<string, string[]> | null;
}
