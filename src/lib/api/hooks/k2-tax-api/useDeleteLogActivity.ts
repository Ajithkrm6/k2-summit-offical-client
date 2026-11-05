import { toast } from "@/components/ui/toast";
import {
  getGetApiV1TaxFirmTaxFirmIdLogActivitiesQueryKey,
  useDeleteApiV1TaxFirmTaxFirmIdLogActivityLogActivityId,
} from "@/lib/api/generated/k2-tax-api";
import { useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../error-message";
import type { AxiosError } from "axios";

interface UseDeleteLogActivityOptions {
  onSuccess?: () => void;
  onError?: () => void;
}

export const useDeleteLogActivity = ({
  onSuccess,
  onError,
}: UseDeleteLogActivityOptions = {}) => {
  const queryClient = useQueryClient();
  const { mutate, isPending, error, isError } =
    useDeleteApiV1TaxFirmTaxFirmIdLogActivityLogActivityId({
      mutation: {
        onSuccess: async (response, variables) => {
          const result = response.data;
          if (result.isError) {
            const message =
              result.firstError?.description ||
              "The activity could not be deleted";
            toast.add({
              title: "Failed to delete activity",
              description: message,
              type: "error",
            });
            onError?.();
            return;
          }

          await queryClient.invalidateQueries({
            queryKey: getGetApiV1TaxFirmTaxFirmIdLogActivitiesQueryKey(
              variables.taxFirmId,
            ),
          });
          toast.add({
            title: "Activity deleted successfully",
            type: "success",
          });
          onSuccess?.();
        },
        onError: (err: AxiosError) => {
          toast.add({
            title: "Failed to delete activity",
            description: getApiErrorMessage(err, "Failed to delete activity"),
            type: "error",
          });
          console.error("Delete log activity failed:", err);
          onError?.();
        },
      },
    });

  return {
    deleteLogActivity: (taxFirmId: string, logActivityId: string) =>
      mutate({ taxFirmId, logActivityId }),
    isPending,
    error: error
      ? getApiErrorMessage(error, "Failed to delete activity")
      : null,
    isError,
  };
};
