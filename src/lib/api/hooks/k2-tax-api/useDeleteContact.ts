import { toast } from "@/components/ui/toast";
import {
  getGetApiV1TaxFirmTaxFirmIdTaxFirmContactsQueryKey,
  getGetApiV1UserTaxFirmsQueryKey,
  useDeleteApiV1TaxFirmTaxFirmIdContactContactId,
} from "@/lib/api/generated/k2-tax-api";
import { useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../error-message";

export const useDeleteContact = ({
  onSuccess,
  onError,
}: { onSuccess?: () => void; onError?: () => void } = {}) => {
  const queryClient = useQueryClient();
  const { mutate, isPending, error, isError } =
    useDeleteApiV1TaxFirmTaxFirmIdContactContactId({
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
            onError?.();
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
        onError: (err) => {
          toast.add({
            title: "Failed to delete contact",
            description: getApiErrorMessage(err, "Failed to delete contact"),
            type: "error",
          });
          console.error("Delete contact failed:", err);
          onError?.();
        },
      },
    });
  return {
    deleteContact: (taxFirmId: string, contactId: string) =>
      mutate({ taxFirmId, contactId }),
    isPending,
    error: error ? getApiErrorMessage(error, "Failed to delete contact") : null,
    isError,
  };
};
