import { toast } from "@/components/ui/toast";
import {
  getGetApiV1TaxFirmTaxFirmIdTaxFirmContactsQueryKey,
  getGetApiV1UserTaxFirmsQueryKey,
  usePatchApiV1TaxFirmTaxFirmIdContactContactId,
} from "@/lib/api/generated/k2-tax-api";
import type { UpdateTaxFirmContactRequest } from "@/lib/api/generated/k2-tax-api/k2TaxAPI.schemas";
import { useQueryClient } from "@tanstack/react-query";

export const useUpdateContact = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  const { mutate, isPending } = usePatchApiV1TaxFirmTaxFirmIdContactContactId({
    mutation: {
      onSuccess: async (response, variables) => {
        if (response.data.isError) {
          toast.add({
            title: "Failed to update contact",
            description:
              response.data.firstError?.description ||
              "The contact could not be updated",
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
        toast.add({ title: "Contact updated successfully", type: "success" });
        onSuccess?.();
      },
      onError: (error) => {
        toast.add({
          title: "Failed to update contact",
          description: error.message,
          type: "error",
        });
        console.error("Update contact failed:", error);
      },
    },
  });
  return {
    updateContact: (
      taxFirmId: string,
      contactId: string,
      data: UpdateTaxFirmContactRequest,
    ) => mutate({ taxFirmId, contactId, data }),
    isPending,
  };
};
