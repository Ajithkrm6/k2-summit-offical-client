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
import type { PostApiV1ClientDocumentsBody } from "@/lib/api/generated/k2-tax-api/k2TaxAPI.schemas";
import { useUploadDocuments } from "@/lib/api/hooks/k2-tax-api/useUploadDocuments";
import {
  uploadDocumentsSchema,
  type UploadDocumentsFormData,
} from "@/modules/crm/lib";
import { useCRMStore } from "@/modules/crm/store/crm.store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";

/**
 * Document Upload Form Schema
 */

export const DocumentsCentral = () => {
  const { uploadDocuments, isPending, isSuccess } = useUploadDocuments();
  const { error, setSuccess } = useCRMStore();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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

  // Tax person clients - real IDs from database
  const taxClients = [
    { id: "TC0020", label: "TC0020-client-1", value: "TC0020" },
    { id: "TC0021", label: "TC0021-client-2", value: "TC0021" },
    { id: "TC0030", label: "TC0030-client-3", value: "TC0030" },
    { id: "TC0040", label: "TC0040-client-4", value: "TC0040" },
    { id: "TC0044", label: "TC0044-client-5", value: "TC0044" },
    { id: "TC0045", label: "TC0045-client-6", value: "TC0045" },
    { id: "TC0048", label: "TC0048-client-7", value: "TC0048" },
  ];

  const documentTypes = [
    { id: "1040", label: "Form 1040 - Individual Income Tax" },
    { id: "1065", label: "Form 1065 - Partnership Return" },
    { id: "1120", label: "Form 1120 - Corporate Income Tax" },
    { id: "1120s", label: "Form 1120-S - S Corporation Return" },
  ];

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
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
        setSuccess(false);
      }, 0);
    }
  }, [isSuccess, isPending, reset, setSuccess]);

  return (
    <div className="p-4 space-y-3 min-h-screen bg-white rounded-lg">
      <h1 className="text-2xl font-bold">Documents Central</h1>
      <p>
        Track everyday documents requested for a client&apos;s tax year. Open a
        request or leave a comment and mark it complete once the document is in
        hand.
      </p>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tax Client */}
          <div className="space-y-2">
            <Label htmlFor="taxPersonClientId">Tax Client *</Label>
            <Controller
              name="taxPersonClientId"
              control={control}
              render={({ field }) => {
                const selectedItem = taxClients.find(
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
                        {taxClients.map((item) => (
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
            {errors.taxPersonClientId && (
              <p className="text-red-500 text-sm">
                {errors.taxPersonClientId.message}
              </p>
            )}
          </div>

          {/* Tax Year */}
          <div className="space-y-2">
            <Label htmlFor="taxYear">Tax Year *</Label>
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
                          { length: 50 },
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
            <Label htmlFor="formType">Document Type *</Label>
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
          <div className="flex justify-center items-end">
            {/* <Label className="invisible">Button</Label> */}
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
              Supported: PDF, Word, Excel, JPG, PNG (up to 25 MB per file)
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
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
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
