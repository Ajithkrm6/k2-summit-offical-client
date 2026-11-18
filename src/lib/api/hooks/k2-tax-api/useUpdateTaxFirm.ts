import { toast } from "@/components/ui/toast";
import {
  getGetApiV1UserTaxFirmsQueryKey,
  getGetApiV1TaxFirmTaxFirmIdQueryKey,
  usePatchApiV1TaxFirmTaxFirmId,
} from "@/lib/api/generated/k2-tax-api";
import type { UpdateTaxFirmRequest } from "@/lib/api/generated/k2-tax-api/k2TaxAPI.schemas";
import { useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

interface UseUpdateTaxFirmOptions {
  firmId?: string;
  onSuccess?: () => void;
}

export const useUpdateTaxFirm = ({
  firmId,
  onSuccess,
}: UseUpdateTaxFirmOptions = {}) => {
  const queryClient = useQueryClient();
  const { mutate, isPending } = usePatchApiV1TaxFirmTaxFirmId({
    mutation: {
      onSuccess: async (response) => {
        const result = response.data;
        if (result.isError) {
          const message =
            result.firstError?.description ||
            "The tax firm could not be updated";
          toast.add({
            title: "Failed to update tax firm",
            description: message,
            type: "error",
          });
          return;
        }

        // Invalidate both the list query and the specific firm query
        await queryClient.invalidateQueries({
          queryKey: getGetApiV1UserTaxFirmsQueryKey(),
        });

        // Invalidate the specific firm query if firmId is available
        if (firmId) {
          await queryClient.invalidateQueries({
            queryKey: getGetApiV1TaxFirmTaxFirmIdQueryKey(firmId),
          });
        }

        toast.add({
          title: "Tax firm updated successfully",
          type: "success",
        });
        onSuccess?.();
      },
      onError: (error: AxiosError) => {
        toast.add({
          title: "Failed to update tax firm",
          description: error.message,
          type: "error",
        });
        console.error("Update tax firm failed:", error);
      },
    },
  });

  return {
    updateTaxFirm: (taxFirmId: string, data: UpdateTaxFirmRequest) =>
      mutate({ taxFirmId, data }),
    isPending,
  };
};
