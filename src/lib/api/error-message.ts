import { isAxiosError } from "axios";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const nonEmptyString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

const GENERIC_ERROR_TITLES = new Set([
  "failure",
  "error",
  "bad request",
  "request failed",
]);

const isGenericErrorTitle = (value: string) =>
  GENERIC_ERROR_TITLES.has(value.trim().toLowerCase());

// Map HTTP status codes to user-friendly messages
const STATUS_CODE_MESSAGES: Record<number, string> = {
  400: "Invalid request. Please check your input.",
  401: "You are not authenticated. Please log in again.",
  403: "You don't have permission to perform this action. Only administrators can perform this operation.",
  404: "The requested resource was not found.",
  409: "This operation conflicts with existing data.",
  422: "The request contains invalid data.",
  429: "Too many requests. Please try again later.",
  500: "Server error. Please try again later.",
  502: "Service temporarily unavailable. Please try again later.",
  503: "Service is temporarily unavailable. Please try again later.",
};

const getStatusCodeMessage = (
  statusCode: number | undefined,
): string | undefined => {
  if (!statusCode) return undefined;
  return STATUS_CODE_MESSAGES[statusCode];
};

const getFirstValidationError = (value: unknown): string | undefined => {
  if (!isRecord(value)) return undefined;

  const messages = Object.values(value);
  for (const message of messages) {
    if (Array.isArray(message)) {
      for (const item of message) {
        const text = nonEmptyString(item);
        if (text) return text;
      }
      continue;
    }

    const text = nonEmptyString(message);
    if (text) return text;
  }

  return undefined;
};

export const getApiErrorMessage = (
  error: unknown,
  fallback = "Something went wrong",
): string => {
  if (!isRecord(error)) return fallback;

  const data = isRecord(error.response) ? error.response.data : undefined;
  const statusCode = isRecord(error.response)
    ? (error.response.status as number | undefined)
    : undefined;

  if (isRecord(data)) {
    const title = nonEmptyString(data.title);
    if (title && !isGenericErrorTitle(title)) {
      return title;
    }

    const message =
      getFirstValidationError(data.errors) ||
      nonEmptyString(data.message) ||
      (isRecord(data.error) ? nonEmptyString(data.error.message) : undefined) ||
      title;
    if (message) return message;
  }

  // If no response body, try to get message from status code
  const statusMessage = getStatusCodeMessage(statusCode);
  if (statusMessage) return statusMessage;

  return nonEmptyString(error.message) || fallback;
};

export const normalizeApiError = (error: unknown): unknown => {
  if (isAxiosError(error)) {
    error.message = getApiErrorMessage(error);
  }
  return error;
};
