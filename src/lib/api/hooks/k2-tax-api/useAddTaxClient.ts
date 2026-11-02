import { toast } from "@/components/ui/toast";
import { usePostApiV1TaxFirmTaxfirmidTaxPersonClient } from "@/lib/api/generated/k2-tax-api";
import type { CreateTaxPersonClientRequest } from "@/lib/api/generated/k2-tax-api/k2TaxAPI.schemas";
import type { CreateTaxClientFormData } from "@/modules/crm/lib";
import type { AxiosError } from "axios";

interface UseAddTaxClientProps {
  onSuccess?: () => void;
}

/**
 * Custom hook to add a tax client/person to a tax firm
 * Wraps the generated usePostApiV1TaxFirmTaxfirmidTaxPersonClient hook
 *
 * - Handles API call for creating a new tax client
 * - Manages loading and error states via TanStack Query
 * - Provides toast notifications for user feedback
 */
export const useAddTaxClient = ({ onSuccess }: UseAddTaxClientProps = {}) => {
  const { mutate, isPending, isSuccess, error } =
    usePostApiV1TaxFirmTaxfirmidTaxPersonClient({
      mutation: {
        onSuccess: () => {
          toast.add({
            title: "Tax client added successfully",
            description: "The tax client has been added to the firm",
            type: "success",
          });
          onSuccess?.();
        },
        onError: (error: AxiosError) => {
          const errorMessage =
            (error.response?.data as Record<string, unknown>)?.message ||
            error.message ||
            "Failed to add tax client";
          toast.add({
            title: "Failed to add tax client",
            description: String(errorMessage),
            type: "error",
          });
          console.error("Add tax client failed:", error);
        },
      },
    });

  return {
    addTaxClient: (data: CreateTaxClientFormData) => {
      const request: CreateTaxPersonClientRequest = {
        taxYear: Number(data.taxYear),
        taxpayerFirstName: data.taxpayerFirstName || null,
        taxpayerLastName: data.taxpayerLastName || null,
        taxpayerSsn: data.taxpayerSSN || null,
        taxpayerDob: data.taxpayerDOB || null,
        taxpayerOccupation: data.taxpayerOccupation || null,
        address: data.mailingAddress || null,
        phoneNumber: data.phoneNumber || null,
        email: data.email || null,
        preferredContactMethodTypeId: data.preferredContactMethod
          ? Number(data.preferredContactMethod)
          : null,
      };

      mutate({ taxfirmid: data.firmId, data: request });
    },
    isPending,
    isSuccess,
    error,
  };
};
