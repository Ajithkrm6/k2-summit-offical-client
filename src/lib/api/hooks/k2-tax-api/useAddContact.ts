import { toast } from "@/components/ui/toast";
import { usePostApiV1TaxFirmTaxfirmidContact } from "@/lib/api/generated/k2-tax-api";
import type { CreateTaxFirmContactRequest } from "@/lib/api/generated/k2-tax-api/k2TaxAPI.schemas";
import type { AxiosError } from "axios";

interface UseAddContactProps {
  taxFirmId: string;
}

/**
 * Custom hook to add a contact to a tax firm
 * Wraps the generated usePostApiV1TaxFirmTaxfirmidContact hook
 *
 * - Handles API call for creating a new contact
 * - Manages loading and error states via TanStack Query
 * - Provides toast notifications for user feedback
 */
export const useAddContact = ({ taxFirmId }: UseAddContactProps) => {
  const { mutate, isPending, isSuccess, error } =
    usePostApiV1TaxFirmTaxfirmidContact({
      mutation: {
        onSuccess: () => {
          toast.add({
            title: "Contact added successfully",
            description: "The contact has been added to the firm",
            type: "success",
          });
        },
        onError: (error: AxiosError) => {
          const errorMessage =
            (error.response?.data as Record<string, unknown>)?.message ||
            error.message ||
            "Failed to add contact";
          toast.add({
            title: "Failed to add contact",
            description: String(errorMessage),
            type: "error",
          });
          console.error("Add contact failed:", error);
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
  };
};
