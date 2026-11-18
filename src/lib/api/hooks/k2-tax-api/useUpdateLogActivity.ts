import { toast } from "@/components/ui/toast";
import {
  getGetApiV1TaxFirmTaxFirmIdLogActivitiesQueryKey,
  getGetApiV1TaxFirmTaxFirmIdQueryKey,
  usePatchApiV1TaxFirmTaxFirmIdLogActivityLogActivityId,
} from "@/lib/api/generated/k2-tax-api";
import type { UpdateLogActivityRequest } from "@/lib/api/generated/k2-tax-api/k2TaxAPI.schemas";
import { useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { getApiErrorMessage } from "../../error-message";

interface UseUpdateLogActivityOptions {
  taxFirmId: string;
  onSuccess?: () => void;
}

export const useUpdateLogActivity = ({
  taxFirmId,
  onSuccess,
}: UseUpdateLogActivityOptions) => {
  const queryClient = useQueryClient();
  const { mutate, isPending, error } =
    usePatchApiV1TaxFirmTaxFirmIdLogActivityLogActivityId({
      mutation: {
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey:
              getGetApiV1TaxFirmTaxFirmIdLogActivitiesQueryKey(taxFirmId),
          });
          await queryClient.invalidateQueries({
            queryKey: getGetApiV1TaxFirmTaxFirmIdQueryKey(taxFirmId),
          });
          toast.add({
            title: "Activity updated successfully",
            type: "success",
          });
          onSuccess?.();
        },
        onError: (err: AxiosError) => {
          toast.add({
            title: "Failed to update activity",
            description: getApiErrorMessage(err, "Failed to update activity"),
            type: "error",
          });
          console.error("Update log activity failed:", err);
        },
      },
    });

  return {
    updateLogActivity: (
      logActivityId: string,
      data: UpdateLogActivityRequest,
    ) => mutate({ taxFirmId, logActivityId, data }),
    isPending,
    error: error
      ? getApiErrorMessage(error, "Failed to update activity")
      : null,
  };
};
