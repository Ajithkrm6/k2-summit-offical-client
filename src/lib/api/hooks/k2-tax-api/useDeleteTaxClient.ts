import { toast } from "@/components/ui/toast";
import {
  getGetApiV1TaxFirmTaxFirmIdTaxPersonClientsQueryKey,
  getGetApiV1UserTaxFirmsQueryKey,
  useDeleteApiV1TaxFirmTaxFirmIdClientClientId,
} from "@/lib/api/generated/k2-tax-api";
import { useQueryClient } from "@tanstack/react-query";

export const useDeleteTaxClient = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useDeleteApiV1TaxFirmTaxFirmIdClientClientId({
    mutation: {
      onSuccess: async (response, variables) => {
        if (response.data.isError) {
          toast.add({
            title: "Failed to delete tax client",
            description:
              response.data.firstError?.description ||
              "The client could not be deleted",
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
        ]);
        toast.add({
          title: "Tax client deleted successfully",
          type: "success",
        });
        onSuccess?.();
      },
      onError: (error) => {
        toast.add({
          title: "Failed to delete tax client",
          description: error.message,
          type: "error",
        });
        console.error("Delete tax client failed:", error);
      },
    },
  });
  return {
    deleteTaxClient: (taxFirmId: string, clientId: string) =>
      mutate({ taxFirmId, clientId }),
    isPending,
  };
};
