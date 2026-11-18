import { toast } from "@/components/ui/toast";
import {
  getGetApiV1TaxFirmTaxFirmIdQueryKey,
  getGetApiV1TaxFirmTaxFirmIdTaxPersonClientsQueryKey,
  getGetApiV1UserTaxFirmsQueryKey,
  usePatchApiV1TaxFirmTaxFirmIdClientClientId,
} from "@/lib/api/generated/k2-tax-api";
import type { UpdateTaxPersonClientRequest } from "@/lib/api/generated/k2-tax-api/k2TaxAPI.schemas";
import { useQueryClient } from "@tanstack/react-query";

export const useUpdateTaxClient = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  const { mutate, isPending } = usePatchApiV1TaxFirmTaxFirmIdClientClientId({
    mutation: {
      onSuccess: async (response, variables) => {
        if (response.data.isError) {
          toast.add({
            title: "Failed to update tax client",
            description:
              response.data.firstError?.description ||
              "The client could not be updated",
            type: "error",
          });
          return;
        }
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: getGetApiV1TaxFirmTaxFirmIdTaxPersonClientsQueryKey(
              variables.taxFirmId,
            ),
          }),
          queryClient.invalidateQueries({
            queryKey: getGetApiV1UserTaxFirmsQueryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: getGetApiV1TaxFirmTaxFirmIdQueryKey(variables.taxFirmId),
          }),
        ]);
        toast.add({
          title: "Tax client updated successfully",
          type: "success",
        });
        onSuccess?.();
      },
      onError: (error) => {
        toast.add({
          title: "Failed to update tax client",
          description: error.message,
          type: "error",
        });
        console.error("Update tax client failed:", error);
      },
    },
  });
  return {
    updateTaxClient: (
      taxFirmId: string,
      clientId: string,
      data: UpdateTaxPersonClientRequest,
    ) => mutate({ taxFirmId, clientId, data }),
    isPending,
  };
};
