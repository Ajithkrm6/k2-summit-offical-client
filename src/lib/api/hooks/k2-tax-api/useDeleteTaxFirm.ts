import { toast } from "@/components/ui/toast";
import {
  getGetApiV1UserTaxFirmsQueryKey,
  useDeleteApiV1TaxFirmTaxFirmId,
} from "@/lib/api/generated/k2-tax-api";
import { useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../error-message";
import type { AxiosError } from "axios";

interface UseDeleteTaxFirmOptions {
  onSuccess?: () => void;
  onError?: () => void;
}

export const useDeleteTaxFirm = ({
  onSuccess,
  onError,
}: UseDeleteTaxFirmOptions = {}) => {
  const queryClient = useQueryClient();
  const { mutate, isPending, error, isError } = useDeleteApiV1TaxFirmTaxFirmId({
    mutation: {
      onSuccess: async (response) => {
        const result = response.data;
        if (result.isError) {
          const message =
            result.firstError?.description ||
            "The tax firm could not be deleted";
          toast.add({
            title: "Failed to delete tax firm",
            description: message,
            type: "error",
          });
          onError?.();
          return;
        }

        await queryClient.invalidateQueries({
          queryKey: getGetApiV1UserTaxFirmsQueryKey(),
        });
        toast.add({
          title: "Tax firm deleted successfully",
          type: "success",
        });
        onSuccess?.();
      },
      onError: (err: AxiosError) => {
        toast.add({
          title: "Failed to delete tax firm",
          description: getApiErrorMessage(err, "Failed to delete tax firm"),
          type: "error",
        });
        console.error("Delete tax firm failed:", err);
        onError?.();
      },
    },
  });

  return {
    deleteTaxFirm: (taxFirmId: string) => mutate({ taxFirmId }),
    isPending,
    error: error
      ? getApiErrorMessage(error, "Failed to delete tax firm")
      : null,
    isError,
  };
};
