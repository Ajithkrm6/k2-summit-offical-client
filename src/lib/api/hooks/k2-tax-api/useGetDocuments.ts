import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useGetApiV1ClientClientIdDocuments } from "../../generated/k2-tax-api";
import type { GetClientDocumentResponse } from "../../generated/k2-tax-api/k2TaxAPI.schemas";

const DOCUMENTS_POLL_INTERVAL_MS = 20_000;

// Normalizes values like "Report Generated", "REPORT_GENERATED" or "report-generated".
const normalizeStatus = (status: string | null | undefined) =>
  (status ?? "").toLowerCase().replace(/[^a-z]/g, "");

export const isReportGenerated = (status: string | null | undefined) =>
  normalizeStatus(status) === "reportgenerated";

export const isExtractionFailed = (status: string | null | undefined) => {
  const normalized = normalizeStatus(status);
  return normalized.includes("fail") || normalized.includes("error");
};

export const isExtractionPending = (status: string | null | undefined) =>
  !isReportGenerated(status) && !isExtractionFailed(status);

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
        staleTime: 10000, // Optional: set staleTime to 0 to always fetch fresh data
        // Keep polling while any document is still being processed.
        refetchInterval: (query) => {
          const docs = query.state.data?.data;
          return Array.isArray(docs) &&
            docs.some((doc) => isExtractionPending(doc.extractionStatus))
            ? DOCUMENTS_POLL_INTERVAL_MS
            : false;
        },
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
