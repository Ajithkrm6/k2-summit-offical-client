"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  isExtractionPending,
  isReportGenerated,
  useGetDocuments,
} from "@/lib/api/hooks/k2-tax-api/useGetDocuments";
import { useGetTaxClients } from "@/lib/api/hooks/k2-tax-api/useGetTaxClients";
import { useGetTaxFirms } from "@/lib/api/hooks/k2-tax-api/useGetTaxFirms";
import { Download, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

export const DocumentsCentral = () => {
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const {
    taxFirms,
    isLoading: firmsLoading,
    error: firmsError,
  } = useGetTaxFirms();

  const { control, setValue } = useForm<{
    firmId: string;
    clientId: string;
  }>({
    defaultValues: { firmId: "", clientId: "" },
  });

  const selectedFirmId = useWatch({ control, name: "firmId" });
  const selectedClientId = useWatch({ control, name: "clientId" });

  const firmOptions = taxFirms
    .filter((firm) => Boolean(firm.taxFirmId))
    .map((firm) => ({
      id: firm.taxFirmId,
      name: firm.firmName || "Unknown",
    }));

  const firstFirmId = firmOptions[0]?.id ?? "";

  // Set first firm on load
  useEffect(() => {
    if (!selectedFirmId && firstFirmId) {
      setValue("firmId", firstFirmId);
    }
  }, [firstFirmId, selectedFirmId, setValue]);

  // Fetch tax clients for selected firm
  const {
    taxClients,
    isLoading: clientsLoading,
    error: clientsError,
  } = useGetTaxClients(selectedFirmId);

  const clientOptions = taxClients
    .filter((client) => Boolean(client.taxPersonClientId))
    .map((client) => ({
      id: client.taxPersonClientId,
      name:
        [client.taxpayerFirstName, client.taxpayerLastName]
          .filter(Boolean)
          .join(" ") || "Unknown",
    }));

  // Set first client when firm changes or reset if no clients available
  useEffect(() => {
    const firstClientId = clientOptions[0]?.id;

    if (clientOptions.length > 0 && !selectedClientId) {
      // Only auto-select first client if no client is currently selected
      if (firstClientId) {
        setValue("clientId", firstClientId);
      }
    } else if (clientOptions.length === 0 && selectedClientId) {
      // Reset client when no clients available
      setValue("clientId", "");
    }
  }, [selectedFirmId, clientOptions.length, selectedClientId, setValue]);

  // Fetch documents for selected client
  const {
    documents,
    isLoading: documentsLoading,
    error: documentsError,
  } = useGetDocuments(selectedClientId);

  const handleDownload = (
    storageUri: string | null | undefined,
    fileName?: string | null,
  ) => {
    if (!storageUri) return;
    const link = document.createElement("a");
    link.href = storageUri;
    link.download = fileName || "document";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // const handleDownload = async (
  //   storageUri: string | null | undefined,
  //   fileName?: string | null
  // ) => {
  //   if (!storageUri) return;

  //   setDownloadError(null);

  //   try {
  //     // Fetch the file through the backend which will handle proper Content-Disposition
  //     const response = await fetch(storageUri);

  //     if (!response.ok) {
  //       throw new Error(
  //         `Failed to fetch file: ${response.status} ${response.statusText}`
  //       );
  //     }

  //     // Convert response to blob
  //     const blob = await response.blob();

  //     if (blob.size === 0) {
  //       throw new Error("Downloaded file is empty");
  //     }

  //     // Create a blob URL for download
  //     const blobUrl = window.URL.createObjectURL(blob);

  //     // Create anchor and trigger download
  //     const link = document.createElement("a");
  //     link.href = blobUrl;
  //     link.download = fileName || "document";
  //     link.style.display = "none";

  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);

  //     // Clean up blob URL
  //     setTimeout(() => {
  //       window.URL.revokeObjectURL(blobUrl);
  //     }, 100);
  //   } catch (error) {
  //     const errorMsg =
  //       error instanceof Error ? error.message : "Failed to download file";
  //     setDownloadError(errorMsg);
  //     console.error("Download error:", error);
  //   }
  // };

  return (
    <div className="container min-h-screen space-y-6 rounded-lg bg-white p-4">
      <section
        aria-labelledby="documents-heading"
        className="flex flex-col gap-4 rounded-lg border p-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="space-y-1">
          <h1 id="documents-heading" className="text-2xl font-bold">
            Documents
          </h1>
          <p className="text-sm text-gray-600">
            View and manage documents for your tax clients.
          </p>
        </div>
        <Link
          href="/crm/documentsCentral/addNewDocument"
          className={buttonVariants({ className: "self-start sm:self-auto" })}
        >
          Upload Document
        </Link>
      </section>

      <section
        aria-labelledby="saved-documents-heading"
        className="space-y-4 rounded-lg border p-6"
      >
        <div>
          <h2 id="saved-documents-heading" className="text-lg font-semibold">
            Saved Documents
          </h2>
          <p id="documents-availability" className="mt-1 text-sm text-gray-600">
            Select a tax client to view their documents.
          </p>
        </div>

        {/* Firm Selector */}
        <div className="space-y-2">
          <Label htmlFor="firmSelect">
            Select Firm <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="firmId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="firmSelect" className="w-full">
                  <SelectValue placeholder="Select a firm">
                    {field.value
                      ? firmOptions.find((f) => f.id === field.value)?.name ||
                        field.value
                      : "Select a firm"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Available Firms</SelectLabel>
                    {firmsLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading firms...
                      </SelectItem>
                    ) : firmOptions.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        No firms available
                      </SelectItem>
                    ) : (
                      firmOptions.map((firm) => (
                        <SelectItem key={firm.id} value={firm.id}>
                          {firm.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Client Selector */}
        <div className="space-y-2">
          <Label htmlFor="clientSelect">
            Select Tax Client <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="clientId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  setDownloadError(null);
                  field.onChange(value);
                }}
              >
                <SelectTrigger id="clientSelect" className="w-full">
                  <SelectValue placeholder="Select a tax client">
                    {field.value && !clientsLoading
                      ? clientOptions.find((c) => c.id === field.value)?.name ||
                        "Select a tax client"
                      : clientsLoading
                        ? "Loading clients..."
                        : "Select a tax client"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Available Tax Clients</SelectLabel>
                    {clientsLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading clients...
                      </SelectItem>
                    ) : clientOptions.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        No tax clients available
                      </SelectItem>
                    ) : (
                      clientOptions.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Error Alerts */}
        {firmsError && (
          <Alert variant="destructive">
            <AlertDescription>Failed to load firms</AlertDescription>
          </Alert>
        )}
        {clientsError && selectedFirmId && (
          <Alert variant="destructive">
            <AlertDescription>Failed to load tax clients</AlertDescription>
          </Alert>
        )}
        {documentsError && selectedClientId && (
          <Alert variant="destructive">
            <AlertDescription>Failed to load documents</AlertDescription>
          </Alert>
        )}
        {downloadError && (
          <Alert variant="destructive">
            <AlertDescription>
              Download failed: {downloadError}
            </AlertDescription>
          </Alert>
        )}

        {/* Documents Table */}
        <div className="overflow-x-auto rounded-lg border">
          <table
            className="w-full text-left text-sm"
            aria-describedby="documents-availability"
          >
            <caption className="sr-only">
              Saved documents for tax client
            </caption>
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                {[
                  "File Name",
                  "Tax Year",
                  "Form Code",
                  "Status",
                  "Upload Date",
                  "Report",
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-center font-medium"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!selectedClientId ||
              documentsLoading ||
              documentsError ||
              !documents ||
              documents.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    {!selectedClientId
                      ? "Select a tax client to view documents."
                      : documentsLoading
                        ? "Loading documents..."
                        : documentsError
                          ? "Documents could not be loaded."
                          : "No documents found for this client."}
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.documentId} className="border-t">
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        {doc.fileName || "Not provided"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {doc.taxYear || "Not provided"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {doc.primaryFormCode || "Not provided"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isExtractionPending(doc.extractionStatus) ? (
                        <span
                          role="status"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800"
                        >
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            isReportGenerated(doc.extractionStatus)
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {doc.extractionStatus}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {doc.uploadedAt
                        ? new Date(doc.uploadedAt).toLocaleDateString()
                        : "Not provided"}
                    </td>
                    <td className="px-4 py-3 flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        aria-label="Download document"
                        disabled={!isReportGenerated(doc.extractionStatus)}
                        onClick={() =>
                          handleDownload(
                            doc.taxStrategy?.taxStrategyUrl,
                            doc.fileName,
                          )
                        }
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
