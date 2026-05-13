export interface ApiError {
  response?: {
    data?: {
      detail?: string;
      message?: string;
      errors?: Record<string, string[]>;
      statusCode?: number;
    };
    status?: number;
    statusText?: string;
  };
  message?: string;
  request?: unknown;
}

export interface DetailedApiError {
  response: {
    data: {
      detail: string;
      message: string;
      errors?: Record<string, string[]>;
      statusCode: number;
    };
    status: number;
    statusText: string;
  };
  message: string;
}

export type UnknownApiError = ApiError | Error | unknown;

export function getErrorMessage(error: unknown, defaultMessage = 'Произошла ошибка'): string {
  if (typeof error === 'object' && error !== null) {
    const apiError = error as ApiError;
    if (apiError.response?.data?.detail) {
      return apiError.response.data.detail;
    }
    if (apiError.response?.data?.message) {
      return apiError.response.data.message;
    }
    if (apiError.message) {
      return apiError.message;
    }
  }
  return defaultMessage;
}