import { toast } from "@/components/ui/toast";
import {
  getGetApiV1TaxFirmTaxFirmIdLogActivitiesQueryKey,
  usePostApiV1TaxFirmTaxfirmidLogActivity,
} from "@/lib/api/generated/k2-tax-api";
import type { CreateLogActivityRequest } from "@/lib/api/generated/k2-tax-api/k2TaxAPI.schemas";
import { useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../error-message";
import type { AxiosError } from "axios";

interface UseAddLogActivityOptions {
  taxFirmId: string;
  onSuccess?: () => void;
}

export const useAddLogActivity = ({
  taxFirmId,
  onSuccess,
}: UseAddLogActivityOptions) => {
  const queryClient = useQueryClient();
  const { mutate, isPending, error } = usePostApiV1TaxFirmTaxfirmidLogActivity({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getGetApiV1TaxFirmTaxFirmIdLogActivitiesQueryKey(taxFirmId),
        });
        toast.add({
          title: "Activity logged successfully",
          type: "success",
        });
        onSuccess?.();
      },
      onError: (err: AxiosError) => {
        toast.add({
          title: "Failed to log activity",
          description: getApiErrorMessage(err, "Failed to log activity"),
          type: "error",
        });
        console.error("Add log activity failed:", err);
      },
    },
  });

  return {
    addLogActivity: (data: CreateLogActivityRequest) =>
      mutate({ taxfirmid: taxFirmId, data }),
    isPending,
    error: error ? getApiErrorMessage(error, "Failed to log activity") : null,
  };
};
