import type { AxiosError } from 'axios';

export interface ApiError {
  message?: string;
  errors?: { msg: string }[];
}

export function getApiErrorMessage(
  err: unknown,
  fallback = 'Something went wrong'
): string {
  const error = err as AxiosError<ApiError>;
  return (
    error.response?.data?.message ||
    error.response?.data?.errors?.[0]?.msg ||
    fallback
  );
}
