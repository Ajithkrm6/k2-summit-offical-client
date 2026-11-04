import { toast } from "@/components/ui/toast";
import {
  getGetApiV1TaxFirmTaxFirmIdTaxFirmContactsQueryKey,
  getGetApiV1UserTaxFirmsQueryKey,
  useDeleteApiV1TaxFirmTaxFirmIdContactContactId,
} from "@/lib/api/generated/k2-tax-api";
import { useQueryClient } from "@tanstack/react-query";

export const useDeleteContact = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useDeleteApiV1TaxFirmTaxFirmIdContactContactId({
    mutation: {
      onSuccess: async (response, variables) => {
        if (response.data.isError) {
          toast.add({
            title: "Failed to delete contact",
            description:
              response.data.firstError?.description ||
              "The contact could not be deleted",
            type: "error",
          });
          return;
        }
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: getGetApiV1TaxFirmTaxFirmIdTaxFirmContactsQueryKey(
              variables.taxFirmId,
            ),
          }),
          queryClient.invalidateQueries({
            queryKey: getGetApiV1UserTaxFirmsQueryKey(),
          }),
        ]);
        toast.add({ title: "Contact deleted successfully", type: "success" });
        onSuccess?.();
      },
      onError: (error) => {
        toast.add({
          title: "Failed to delete contact",
          description: error.message,
          type: "error",
        });
        console.error("Delete contact failed:", error);
      },
    },
  });
  return {
    deleteContact: (taxFirmId: string, contactId: string) =>
      mutate({ taxFirmId, contactId }),
    isPending,
  };
};
