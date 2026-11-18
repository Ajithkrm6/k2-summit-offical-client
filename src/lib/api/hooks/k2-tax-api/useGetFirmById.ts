import type { AxiosError } from "axios";
import {
  useGetApiV1TaxFirmTaxFirmId,
  getGetApiV1TaxFirmTaxFirmIdQueryKey,
} from "../../generated/k2-tax-api";
import type { GetTaxFirmResponse } from "../../generated/k2-tax-api/k2TaxAPI.schemas";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Custom hook to fetch a tax firm by ID
 * Wraps the generated useGetApiV1TaxFirmTaxFirmId hook with a simpler interface
 */
export const useGetFirmById = (
  firmId: string | null | undefined,
): {
  firm: GetTaxFirmResponse | undefined;
  isLoading: boolean;
  error: AxiosError<GetTaxFirmResponse> | null;
  refetch: () => Promise<void>;
} => {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useGetApiV1TaxFirmTaxFirmId(firmId || "", {
    query: {
      enabled: !!firmId,
    },
  });

  // Extract firm from response
  // API returns: AxiosResponse where response.data is GetTaxFirmResponse
  // Cast as GetTaxFirmResponse since the generated type is incorrect
  const firm = data?.data as GetTaxFirmResponse | undefined;

  return {
    firm,
    isLoading,
    error,
    refetch: async () => {
      if (firmId) {
        await queryClient.invalidateQueries({
          queryKey: getGetApiV1TaxFirmTaxFirmIdQueryKey(firmId),
        });
      }
    },
  };
};
