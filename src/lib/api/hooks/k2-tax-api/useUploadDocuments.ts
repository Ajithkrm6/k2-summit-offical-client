/**
 * Upload Documents Hook Wrapper
 * Bridges direct API call with Zustand store
 *
 * Responsibilities:
 * - Handle document upload API call
 * - Update CRM store with results
 * - Handle errors and user feedback
 * - Manage loading/success states
 */

import { toast } from "@/components/ui/toast";
import apiClient from "@/lib/axios-config";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { getApiErrorMessage } from "../../error-message";
import { useCRMStore } from "../../../../modules/crm/store/crm.store";
import type {
  PostApiV1ClientDocumentsBody,
  UploadClientDocumentsResult,
} from "../../generated/k2-tax-api/k2TaxAPI.schemas";

/**
 * Custom upload documents hook
 * - Manages document upload API call
 * - Updates CRM store with loading/error/success states
 * - Handles file upload as FormData
 * - Provides toast notifications
 */
export const useUploadDocuments = () => {
  const { setLoading, setError, setSuccess, isLoading, success } =
    useCRMStore();

  const { mutate, isPending } = useMutation({
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
    onMutate: () => {
      setSuccess(false);
      setLoading(true);
      setError(null);
    },
    onSuccess: (data) => {
      setSuccess(true);
      toast.add({
        title: "Documents uploaded successfully",
        description: `${data?.uploadedDocuments?.length || 0} file(s) uploaded`,
        type: "success",
      });
    },
    onError: (error: AxiosError) => {
      const errorMessage = getApiErrorMessage(
        error,
        "Failed to upload documents",
      );
      setSuccess(false);
      setError(errorMessage);
      toast.add({
        title: "Upload failed",
        description: errorMessage,
        type: "error",
      });
      console.error("Document upload failed:", error);
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  return {
    uploadDocuments: (data: PostApiV1ClientDocumentsBody) => mutate(data),
    isSuccess: success,
    isPending: isPending || isLoading,
  };
};
