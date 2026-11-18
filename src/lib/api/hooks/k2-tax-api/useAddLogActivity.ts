import { toast } from "@/components/ui/toast";
import {
  getGetApiV1TaxFirmTaxFirmIdLogActivitiesQueryKey,
  getGetApiV1TaxFirmTaxFirmIdQueryKey,
  usePostApiV1TaxFirmTaxfirmidLogActivity,
} from "@/lib/api/generated/k2-tax-api";
import type { CreateLogActivityRequest } from "@/lib/api/generated/k2-tax-api/k2TaxAPI.schemas";
import { useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../error-message";
import type { AxiosError } from "axios";

interface UseAddLogActivityOptions {
  taxFirmId: string;
  onSuccess?: () => void;
  onError?: () => void;
}

export const useAddLogActivity = ({
  taxFirmId,
  onSuccess,
  onError,
}: UseAddLogActivityOptions) => {
  const queryClient = useQueryClient();
  const { mutate, isPending, error } = usePostApiV1TaxFirmTaxfirmidLogActivity({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getGetApiV1TaxFirmTaxFirmIdLogActivitiesQueryKey(taxFirmId),
        });
        // Refresh the firm detail page, which lists the firm's activities
        await queryClient.invalidateQueries({
          queryKey: getGetApiV1TaxFirmTaxFirmIdQueryKey(taxFirmId),
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
        onError?.();
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
