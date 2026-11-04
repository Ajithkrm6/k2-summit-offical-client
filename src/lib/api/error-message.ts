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

  return nonEmptyString(error.message) || fallback;
};

export const normalizeApiError = (error: unknown): unknown => {
  if (isAxiosError(error)) {
    error.message = getApiErrorMessage(error);
  }
  return error;
};
