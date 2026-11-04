import { toast } from "@/components/ui/toast";
import { useCRMStore } from "../../../../modules/crm/store/crm.store";
import {
  getGetApiV1UserTaxFirmsQueryKey,
  usePostApiV1TaxFirm,
} from "../../generated/k2-tax-api";
import { useQueryClient } from "@tanstack/react-query";
import { CreateTaxFirmRequest } from "../../generated/k2-tax-api/k2TaxAPI.schemas";
import { getApiErrorMessage } from "../../error-message";

export const useAddTaxFirm = () => {
  const queryClient = useQueryClient();
  const { setLoading, setError, setSuccess, isLoading, success } =
    useCRMStore();
  const { mutate } = usePostApiV1TaxFirm({
    mutation: {
      onMutate: () => {
        setSuccess(false);
        setError(null);
        setLoading(true);
      },
      onSuccess: async (response) => {
        if (response.data.isError) {
          const message =
            response.data.firstError?.description ||
            "The tax firm could not be added";
          setSuccess(false);
          setError(message);
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
        setSuccess(true);
        toast.add({ title: "Tax Firm added successfully" });
      },
      onError: (error) => {
        const errorMessage = getApiErrorMessage(
          error,
          "Failed to add tax firm",
        );
        setSuccess(false);
        setError(errorMessage);
        toast.add({
          title: "Failed to add Tax Firm",
          description: errorMessage,
          type: "error",
        });
      },
      onSettled: () => {
        setLoading(false);
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
    isSuccess: success,
    isPending: isLoading,
  };
};
