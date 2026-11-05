import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useGetApiV1ClientClientIdDocuments } from "../../generated/k2-tax-api";
import type { GetClientDocumentResponse } from "../../generated/k2-tax-api/k2TaxAPI.schemas";

/**
 * Custom hook to fetch documents for a specific tax client
 * Wraps the generated useGetApiV1ClientClientIdDocuments hook with additional logic
 */
export const useGetDocuments = (clientId: string | null | undefined) => {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useGetApiV1ClientClientIdDocuments(
    clientId || "",
    {
      query: {
        enabled: !!clientId,
      },
    },
  );

  // Clear cache when clientId changes to prevent stale data
  useEffect(() => {
    if (!clientId) {
      // Reset documents when no client is selected
      queryClient.setQueryData(
        ["api", "useGetApiV1ClientClientIdDocuments", clientId || ""],
        undefined,
      );
    }
  }, [clientId, queryClient]);

  // Extract documents from response
  // API returns: AxiosResponse where response.data is an ARRAY of GetClientDocumentResponse
  const documents: GetClientDocumentResponse[] =
    clientId && Array.isArray(data?.data) ? data.data : [];

  return {
    documents,
    isLoading,
    error,
  };
};
