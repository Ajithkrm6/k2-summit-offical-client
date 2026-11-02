import { toast } from "@/components/ui/toast";
import {
  getGetApiV1UserTaxFirmsQueryKey,
  useDeleteApiV1TaxFirmTaxFirmId,
} from "@/lib/api/generated/k2-tax-api";
import { useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

interface UseDeleteTaxFirmOptions {
  onSuccess?: () => void;
}

export const useDeleteTaxFirm = ({
  onSuccess,
}: UseDeleteTaxFirmOptions = {}) => {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useDeleteApiV1TaxFirmTaxFirmId({
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
      onError: (error: AxiosError) => {
        toast.add({
          title: "Failed to delete tax firm",
          description: error.message,
          type: "error",
        });
        console.error("Delete tax firm failed:", error);
      },
    },
  });

  return {
    deleteTaxFirm: (taxFirmId: string) => mutate({ taxFirmId }),
    isPending,
  };
};
