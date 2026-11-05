"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from "@/components/ui/toast";
import { getGetApiV1TaxFirmTaxFirmIdTaxPersonClientsQueryKey } from "@/lib/api/generated/k2-tax-api";
import type { PostApiV1ClientDocumentsBody } from "@/lib/api/generated/k2-tax-api/k2TaxAPI.schemas";
import { useGetTaxClients } from "@/lib/api/hooks/k2-tax-api/useGetTaxClients";
import { useGetTaxFirms } from "@/lib/api/hooks/k2-tax-api/useGetTaxFirms";
import { useUploadDocuments } from "@/lib/api/hooks/k2-tax-api/useUploadDocuments";
import {
  uploadDocumentsSchema,
  type UploadDocumentsFormData,
} from "@/modules/crm/lib";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";

export const UploadDocuments = () => {
  const queryClient = useQueryClient();
  const {
    taxFirms,
    isLoading: firmsLoading,
    error: firmsError,
  } = useGetTaxFirms();
  const {
    uploadDocuments,
    isPending,
    isSuccess,
    error: uploadError,
  } = useUploadDocuments();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedFirmId, setSelectedFirmId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UploadDocumentsFormData>({
    resolver: zodResolver(uploadDocumentsSchema),
    defaultValues: {
      taxPersonClientId: "",
      taxYear: new Date().getFullYear(),
      formType: "",
    },
  });
  const firmOptions = taxFirms.flatMap((firm) =>
    firm.taxFirmId
      ? [{ id: firm.taxFirmId, name: firm.firmName || "Unknown" }]
      : [],
  );

  const {
    taxClients,
    isLoading: clientsLoading,
    error: clientsError,
    refetch,
  } = useGetTaxClients(selectedFirmId);

  // Issue #2: Prefetch new firm's clients when selectedFirmId changes to avoid stale data race condition
  // Issue #3: Reset query cache when selectedFirmId changes to clear errors from previous firm selection
  useEffect(() => {
    if (selectedFirmId) {
      // Prefetch: Load new firm's clients data immediately for smooth transition
      queryClient.prefetchQuery({
        queryKey:
          getGetApiV1TaxFirmTaxFirmIdTaxPersonClientsQueryKey(selectedFirmId),
        queryFn: async () => {
          const response = await fetch(
            `/api/v1/TaxFirm/${selectedFirmId}/TaxPersonClients`,
          );
          if (!response.ok) throw new Error("Failed to fetch clients");
          return response.json();
        },
      });

      // Reset: Clear any errors from previous firm selection
      queryClient.resetQueries({
        queryKey:
          getGetApiV1TaxFirmTaxFirmIdTaxPersonClientsQueryKey(selectedFirmId),
      });
    }
  }, [selectedFirmId, queryClient]);

  const clientOptions = taxClients.flatMap((client) => {
    if (!client.taxPersonClientId) {
      return [];
    }

    return [
      {
        id: client.taxPersonClientId,
        label:
          [client.taxpayerFirstName, client.taxpayerLastName]
            .filter(Boolean)
            .join(" ") || "Unknown client",
      },
    ];
  });

  const documentTypes = [
    { id: "1040", label: "Form 1040 - Individual Income Tax" },
    { id: "1065", label: "Form 1065 - Partnership Return" },
    { id: "1120", label: "Form 1120 - Corporate Income Tax" },
    { id: "1120s", label: "Form 1120-S - S Corporation Return" },
  ];

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter((file) => {
        if (
          !file.type.includes("pdf") &&
          !file.name.toLowerCase().endsWith(".pdf")
        ) {
          toast.add({
            title: "Invalid file type",
            description: `${file.name} is not a PDF. Only PDF files are supported.`,
            type: "destructive",
          });
          return false;
        }
        return true;
      });
      setSelectedFiles(validFiles);
    }
  };

  const onSubmit = async (data: UploadDocumentsFormData) => {
    if (selectedFiles.length === 0) {
      toast.add({
        title: "No files selected",
        description: "Please select at least one file to upload",
        type: "destructive",
      });
      return;
    }

    const uploadData: PostApiV1ClientDocumentsBody = {
      TaxPersonClientId: data.taxPersonClientId,
      FormType: data.formType,
      TaxYear: data.taxYear,
      Version: 1,
      Documents: selectedFiles,
    };

    uploadDocuments(uploadData);
  };

  // Auto-clear form after successful submission
  useEffect(() => {
    if (isSuccess && !isPending) {
      setTimeout(() => {
        reset({
          taxPersonClientId: "",
          taxYear: new Date().getFullYear(),
          formType: "",
        });
        setSelectedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 0);
    }
  }, [isSuccess, isPending, reset]);

  return (
    <div className="p-4 container space-y-3 min-h-screen bg-white rounded-lg">
      <h1 className="text-2xl font-bold">Documents Central</h1>
      <p>
        Track everyday documents requested for a client&apos;s tax year. Open a
        request or leave a comment and mark it complete once the document is in
        hand.
      </p>

      {uploadError && (
        <Alert variant="destructive">
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}
      {firmsError && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load firms: {firmsError.message}
          </AlertDescription>
        </Alert>
      )}
      {clientsError && selectedFirmId && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load tax clients: {clientsError.message}
          </AlertDescription>
          <Button
            type="button"
            variant="outline"
            onClick={() => void refetch()}
          >
            Retry
          </Button>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firmSelect">
              Select Firm <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedFirmId}
              onValueChange={(value) => setSelectedFirmId(value ?? "")}
            >
              <SelectTrigger id="firmSelect" className="w-full">
                <SelectValue placeholder="Select a firm">
                  {selectedFirmId
                    ? firmOptions.find((f) => f.id === selectedFirmId)?.name ||
                      selectedFirmId
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
                        {firm.name} ({firm.id})
                      </SelectItem>
                    ))
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          {/* Tax Client */}
          <div className="space-y-2">
            <Label htmlFor="taxPersonClientId">
              Tax Client <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="taxPersonClientId"
              control={control}
              render={({ field }) => {
                const selectedItem = clientOptions.find(
                  (item) => item.id === field.value,
                );
                return (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select client">
                        {selectedItem?.label || "Select client"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Tax Clients</SelectLabel>
                        {clientsLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading clients...
                          </SelectItem>
                        ) : clientOptions.length === 0 ? (
                          <SelectItem value="empty" disabled>
                            No clients available
                          </SelectItem>
                        ) : (
                          clientOptions.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.label}
                            </SelectItem>
                          ))
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                );
              }}
            />
            {errors.taxPersonClientId && (
              <p className="text-red-500 text-sm">
                {errors.taxPersonClientId.message}
              </p>
            )}
          </div>

          {/* Tax Year */}
          <div className="space-y-2">
            <Label htmlFor="taxYear">
              Tax Year <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="taxYear"
              control={control}
              render={({ field }) => {
                return (
                  <Select
                    onValueChange={(value) =>
                      value && field.onChange(parseInt(value))
                    }
                    value={field.value ? field.value.toString() : ""}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Tax Years</SelectLabel>
                        {Array.from(
                          { length: 5 },
                          (_, i) => new Date().getFullYear() - i,
                        ).map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                );
              }}
            />
            {errors.taxYear && (
              <p className="text-red-500 text-sm">{errors.taxYear.message}</p>
            )}
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <Label htmlFor="formType">
              Document Type <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="formType"
              control={control}
              render={({ field }) => {
                const selectedItem = documentTypes.find(
                  (item) => item.id === field.value,
                );
                return (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type">
                        {selectedItem?.label || "Select type"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Document Types</SelectLabel>
                        {documentTypes.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                );
              }}
            />
            {errors.formType && (
              <p className="text-red-500 text-sm">{errors.formType.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex flex-col justify-center items-center">
            <Label className="invisible">Button</Label>
            <Button
              type="submit"
              className="w-full"
              disabled={isPending || selectedFiles.length === 0}
            >
              {isPending ? "Uploading..." : "Upload Documents"}
            </Button>
          </div>
        </div>

        {/* File Upload Section */}
        <div
          className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center space-y-4 ${isPending ? "opacity-50 pointer-events-none" : ""}`}
        >
          <div className="flex justify-center">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6"
              />
            </svg>
          </div>
          <div>
            <p className="text-lg font-medium">Drag & drop files here</p>
            <p className="text-sm text-gray-500">
              Supported: PDF only (up to 25 MB per file)
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
          >
            Browse Files
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={onFileChange}
            className="hidden"
            accept=".pdf"
            disabled={isPending}
          />
        </div>

        {/* Selected Files Display */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <Label>Selected Files ({selectedFiles.length})</Label>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFiles(
                        selectedFiles.filter((_, i) => i !== idx),
                      );
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
