/**
 * Upload Documents Hook Wrapper
 * Manages document upload via TanStack Query mutation
 *
 * Responsibilities:
 * - Handle document upload API call
 * - Manage mutation state (isPending, isSuccess, error)
 * - Handle errors and user feedback via toast
 * - MEDIUM #5 Fix: No longer uses Zustand store for mutation state
 */

import { toast } from "@/components/ui/toast";
import apiClient from "@/lib/axios-config";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { getApiErrorMessage } from "../../error-message";
import { getGetApiV1ClientClientIdDocumentsQueryKey } from "../../generated/k2-tax-api";
import type {
  PostApiV1ClientDocumentsBody,
  UploadClientDocumentsResult,
} from "../../generated/k2-tax-api/k2TaxAPI.schemas";

/**
 * Custom upload documents hook
 * - Manages document upload API call via TanStack Query
 * - Handles file upload as FormData
 * - Provides toast notifications
 * - Returns mutation state directly (no Zustand dependency)
 */
export const useUploadDocuments = () => {
  const queryClient = useQueryClient();
  const { mutate, isPending, isSuccess, error } = useMutation({
    mutationFn: async (data: PostApiV1ClientDocumentsBody) => {
      // Build FormData for multipart upload
      const formData = new FormData();
      formData.append("TaxPersonClientId", data.TaxPersonClientId);
      formData.append("FormType", data.FormType);
      formData.append("TaxYear", data.TaxYear.toString());
      formData.append("Version", data.Version.toString());

      // Append all document files
      data.Documents.forEach((doc) => {
        formData.append("Documents", doc);
      });

      const response = await apiClient.post<UploadClientDocumentsResult>(
        "/api/v1/Client/Documents",
        formData,
      );

      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.add({
        title: "Documents uploaded successfully",
        description: `${data?.uploadedDocuments?.length || 0} file(s) uploaded`,
        type: "success",
      });

      // Refresh the client's document list; useGetDocuments keeps polling
      // until extraction finishes.
      void queryClient.invalidateQueries({
        queryKey: getGetApiV1ClientClientIdDocumentsQueryKey(
          variables.TaxPersonClientId,
        ),
      });
    },
    onError: (err: AxiosError) => {
      const errorMessage = getApiErrorMessage(
        err,
        "Failed to upload documents",
      );
      toast.add({
        title: "Upload failed",
        description: errorMessage,
        type: "error",
      });
      console.error("Document upload failed:", err);
    },
  });

  return {
    uploadDocuments: (data: PostApiV1ClientDocumentsBody) => mutate(data),
    isSuccess,
    isPending,
    error: error
      ? getApiErrorMessage(error as AxiosError, "Upload failed")
      : null,
  };
};
