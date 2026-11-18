import { toast } from "@/components/ui/toast";
import {
  getGetApiV1TaxFirmTaxFirmIdQueryKey,
  getGetApiV1TaxFirmTaxFirmIdTaxFirmContactsQueryKey,
  getGetApiV1UserTaxFirmsQueryKey,
  usePostApiV1TaxFirmTaxfirmidContact,
} from "@/lib/api/generated/k2-tax-api";
import { useQueryClient } from "@tanstack/react-query";
import type { CreateTaxFirmContactRequest } from "@/lib/api/generated/k2-tax-api/k2TaxAPI.schemas";
import type { AxiosError } from "axios";
import { getApiErrorMessage } from "../../error-message";

interface UseAddContactProps {
  taxFirmId: string;
  onSuccess?: () => void;
  onError?: () => void;
}

/**
 * Custom hook to add a contact to a tax firm
 * Wraps the generated usePostApiV1TaxFirmTaxfirmidContact hook
 *
 * - Handles API call for creating a new contact
 * - Manages loading and error states via TanStack Query
 * - Provides toast notifications for user feedback
 */
export const useAddContact = ({
  taxFirmId,
  onSuccess,
  onError,
}: UseAddContactProps) => {
  const queryClient = useQueryClient();
  const { mutate, isPending, isSuccess, error } =
    usePostApiV1TaxFirmTaxfirmidContact({
      mutation: {
        onSuccess: async (_response, variables) => {
          // Invalidate contact list for this specific firm
          await queryClient.invalidateQueries({
            queryKey: getGetApiV1TaxFirmTaxFirmIdTaxFirmContactsQueryKey(
              variables.taxfirmid,
            ),
          });
          // Invalidate parent firm list so summaries update (MEDIUM #2 fix)
          await queryClient.invalidateQueries({
            queryKey: getGetApiV1UserTaxFirmsQueryKey(),
          });
          // Refresh the firm detail page, which lists the firm's contacts
          await queryClient.invalidateQueries({
            queryKey: getGetApiV1TaxFirmTaxFirmIdQueryKey(variables.taxfirmid),
          });
          toast.add({
            title: "Contact added successfully",
            description: "The contact has been added to the firm",
            type: "success",
          });
          onSuccess?.();
        },
        onError: (error: AxiosError<unknown>) => {
          toast.add({
            title: "Failed to add contact",
            description: getApiErrorMessage(error, "Failed to add contact"),
            type: "error",
          });
          console.error("Add contact failed:", error);
          onError?.();
        },
      },
    });

  return {
    addContact: (data: CreateTaxFirmContactRequest) =>
      mutate({
        taxfirmid: taxFirmId,
        data,
      }),
    isPending,
    isSuccess,
    error,
    errorMessage: error
      ? getApiErrorMessage(error, "Failed to add contact")
      : null,
  };
};
