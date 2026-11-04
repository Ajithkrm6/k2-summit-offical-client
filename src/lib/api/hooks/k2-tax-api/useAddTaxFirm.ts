import { toast } from "@/components/ui/toast";
import {
  getGetApiV1UserTaxFirmsQueryKey,
  usePostApiV1TaxFirm,
} from "../../generated/k2-tax-api";
import { useQueryClient } from "@tanstack/react-query";
import { CreateTaxFirmRequest } from "../../generated/k2-tax-api/k2TaxAPI.schemas";
import { getApiErrorMessage } from "../../error-message";

/**
 * Custom hook to add a tax firm
 * - Manages firm creation via TanStack Query mutation
 * - Invalidates firm list after successful creation
 * - Returns mutation state directly (no Zustand dependency) - MEDIUM #5 Fix
 */
export const useAddTaxFirm = () => {
  const queryClient = useQueryClient();
  const { mutate, isPending, isSuccess, error } = usePostApiV1TaxFirm({
    mutation: {
      onSuccess: async (response) => {
        if (response.data.isError) {
          const message =
            response.data.firstError?.description ||
            "The tax firm could not be added";
          toast.add({
            title: "Failed to add Tax Firm",
            description: message,
            type: "error",
          });
          return;
        }
        await queryClient.invalidateQueries({
          queryKey: getGetApiV1UserTaxFirmsQueryKey(),
        });
        toast.add({ title: "Tax Firm added successfully" });
      },
      onError: (err) => {
        const errorMessage = getApiErrorMessage(err, "Failed to add tax firm");
        toast.add({
          title: "Failed to add Tax Firm",
          description: errorMessage,
          type: "error",
        });
      },
    },
  });

  return {
    addTaxFirm: (data: CreateTaxFirmRequest) =>
      mutate({
        data: {
          ...data,
          credentialTypeId: data.credentialTypeId ?? null,
        },
      }),
    isPending,
    isSuccess,
    error: error ? getApiErrorMessage(error, "Failed to add tax firm") : null,
  };
};
