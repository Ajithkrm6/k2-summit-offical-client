import { toast } from "@/components/ui/toast";
import { useCRMStore } from "../../../../modules/crm/store/crm.store";
import { usePostApiV1TaxFirm } from "../../generated/k2-tax-api";
import { CreateTaxFirmRequest } from "../../generated/k2-tax-api/k2TaxAPI.schemas";

export const useAddTaxFirm = () => {
  const { setLoading, setError, setSuccess, isLoading, success } =
    useCRMStore();
  const { mutate } = usePostApiV1TaxFirm({
    mutation: {
      onMutate: () => {
        setSuccess(false);
        setLoading(true);
      },
      onSuccess: () => {
        setSuccess(true);
        toast.add({ title: "Tax Firm added successfully" });
      },
      onError: (error) => {
        const errorMessage = error?.message || "Unknown error";
        setSuccess(false);
        setError(errorMessage);
        toast.add({ title: "Failed to add Tax Firm" });
      },
      onSettled: () => {
        setLoading(false);
      },
    },
  });

  return {
    addTaxFirm: (data: CreateTaxFirmRequest) => mutate({ data }),
    isSuccess: success,
    isPending: isLoading,
  };
};
