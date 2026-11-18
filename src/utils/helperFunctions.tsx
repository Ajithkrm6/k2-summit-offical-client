export const FormatDate = (date: string | Date | undefined): string => {
  return new Date(String(date)).toLocaleDateString();
};

export const FormatDateTime = (
  date: string | Date | null | undefined,
): string => {
  if (!date) return "";
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return "";
    }
    return dateObj.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
};

/**
 * ============================================================================
 * Follow-up Date Helper Functions
 * For validating and constraining follow-up dates (present and future only)
 * ============================================================================
 */

/**
 * Check if a date is today or in the future
 * Used for follow-up date validation
 * @param dateString - Date in YYYY-MM-DD format (from input[type="date"])
 * @returns true if date is today or future, false if past
 */
export const isValidFollowUpDate = (
  dateString: string | null | undefined,
): boolean => {
  if (!dateString) return false;

  try {
    const inputDate = new Date(`${dateString}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(inputDate.getTime())) {
      return false;
    }

    return inputDate >= today;
  } catch {
    return false;
  }
};

/**
 * Get today's date in YYYY-MM-DD format
 * Used as minimum date for calendar inputs to disable past dates
 * @returns Today's date in YYYY-MM-DD format (e.g., "2026-11-13")
 */
export const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Get today's date constraints (min and max set to today)
 * Use this to allow selection of ONLY today's date in a date input
 * @returns Object with min and max properties both set to today's date
 */
export const getTodayOnly = (): { min: string; max: string } => {
  const today = getTodayDateString();
  return { min: today, max: today };
};

/**
 * Check if a selected date equals today
 * @param dateString - Date in YYYY-MM-DD format
 * @returns true if date is today, false otherwise
 */
export const isToday = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false;

  try {
    const selectedDate = new Date(`${dateString}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(selectedDate.getTime())) {
      return false;
    }

    return selectedDate.getTime() === today.getTime();
  } catch {
    return false;
  }
};

/**
 * Get error message for invalid follow-up date
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Error message or empty string if valid
 */
export const getFollowUpDateError = (
  dateString: string | null | undefined,
): string => {
  if (!dateString) return "Follow-up date is required";

  if (!isValidFollowUpDate(dateString)) {
    return "Follow-up date cannot be in the past";
  }

  return "";
};

/**
 * ============================================================================
 * Usage Examples for Follow-up Date:
 * ============================================================================
 *
 * // 1. In Zod schema validation
 * import { isValidFollowUpDate } from "@/utils/helperFunctions";
 *
 * export const activitySchema = z.object({
 *   nextFollowUpDate: z
 *     .string()
 *     .date("Invalid date format")
 *     .refine(
 *       (date) => isValidFollowUpDate(date),
 *       "Follow-up date cannot be in the past"
 *     ),
 * });
 *
 * // 2. In form component (disable past dates)
 * import { getTodayDateString } from "@/utils/helperFunctions";
 *
 * <Input
 *   type="date"
 *   {...register("nextFollowUpDate")}
 *   min={getTodayDateString()}  // Disables all past dates
 * />
 *
 * // 3. Display error message
 * import { getFollowUpDateError } from "@/utils/helperFunctions";
 *
 * const errorMsg = getFollowUpDateError(watchedDate);
 * {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
 *
 * // 4. Check if date is valid
 * if (isValidFollowUpDate(formData.nextFollowUpDate)) {
 *   // Submit form
 * }
 *
 * ============================================================================
 * Usage Examples for Today-Only Date Selection:
 * ============================================================================
 *
 * // 1. Allow selection of ONLY today's date
 * import { getTodayOnly } from "@/utils/helperFunctions";
 *
 * const { min, max } = getTodayOnly();
 * <Input
 *   type="date"
 *   {...register("activityDate")}
 *   min={min}  // min = today
 *   max={max}  // max = today
 * />
 *
 * // 2. Check if selected date is today
 * import { isToday } from "@/utils/helperFunctions";
 *
 * if (isToday(formData.activityDate)) {
 *   console.log("Activity date is today");
 * }
 *
 * // 3. In Zod schema - validate date must be today
 * import { isToday } from "@/utils/helperFunctions";
 *
 * export const activitySchema = z.object({
 *   activityDate: z
 *     .string()
 *     .date()
 *     .refine(
 *       (date) => isToday(date),
 *       "Activity date must be today"
 *     ),
 * });
 */
