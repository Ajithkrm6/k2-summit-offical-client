"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { GetTaxPersonClientByTaxFirmIdResponse } from "@/lib/api/generated/k2-tax-api/k2TaxAPI.schemas";
import { useDeleteTaxClient } from "@/lib/api/hooks/k2-tax-api/useDeleteTaxClient";
import { useGetTaxClients } from "@/lib/api/hooks/k2-tax-api/useGetTaxClients";
import { useGetTaxFirms } from "@/lib/api/hooks/k2-tax-api/useGetTaxFirms";
import { useUpdateTaxClient } from "@/lib/api/hooks/k2-tax-api/useUpdateTaxClient";
import {
  editTaxClientSchema,
  type EditTaxClientFormData,
} from "@/modules/crm/lib";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Trash } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

const editFields: {
  name: keyof EditTaxClientFormData;
  label: string;
  required?: boolean;
  type?: "text" | "date" | "tel" | "email";
}[] = [
  { name: "taxpayerFirstName", label: "First name", required: true },
  { name: "taxpayerLastName", label: "Last name", required: true },
  { name: "taxYear", label: "Tax year", required: true },
  { name: "taxpayerSSN", label: "SSN", required: true },
  { name: "taxpayerDOB", label: "Date of birth", type: "date" },
  { name: "mailingAddress", label: "Address" },
  { name: "phoneNumber", label: "Phone", type: "tel" },
  { name: "email", label: "Email", type: "email" },
];

interface SelectedClient {
  firmId: string;
  clientId: string;
  name: string;
}

export const TaxClients = () => {
  const [editingClient, setEditingClient] = useState<SelectedClient | null>(
    null,
  );
  const [deletingClient, setDeletingClient] = useState<SelectedClient | null>(
    null,
  );
  const { updateTaxClient, isPending: isUpdating } = useUpdateTaxClient({
    onSuccess: () => setEditingClient(null),
  });
  const { deleteTaxClient, isPending: isDeleting } = useDeleteTaxClient({
    onSuccess: () => setDeletingClient(null),
    onError: () => setDeletingClient(null),
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: editErrors, isDirty },
    clearErrors,
  } = useForm<EditTaxClientFormData>({
    resolver: zodResolver(editTaxClientSchema),
    mode: "onChange",
    defaultValues: {
      taxpayerFirstName: "",
      taxpayerLastName: "",
      taxYear: "",
      taxpayerSSN: "",
      taxpayerDOB: "",
      mailingAddress: "",
      phoneNumber: "",
      email: "",
    },
  });
  const { taxFirms, isLoading, error: firmsError } = useGetTaxFirms();
  const { control, setValue } = useForm<{ firmId: string }>({
    defaultValues: { firmId: "" },
  });
  // Extract firm IDs and names from taxFirms data
  const firmOptions = taxFirms.flatMap((firm) =>
    firm.taxFirmId
      ? [{ id: firm.taxFirmId, name: firm.firmName || "Unknown" }]
      : [],
  );
  const selectedFirmValue = useWatch({ control, name: "firmId" });
  const firstFirmId = firmOptions[0]?.id ?? "";
  const selectedFirmId = selectedFirmValue || firstFirmId;

  useEffect(() => {
    if (!selectedFirmValue && firstFirmId) {
      setValue("firmId", firstFirmId);
    }
  }, [firstFirmId, selectedFirmValue, setValue]);

  const {
    taxClients,
    isLoading: clientsLoading,
    error,
    refetch,
  } = useGetTaxClients(selectedFirmId);

  const selectedFirmName = firmOptions.find(
    (firm) => firm.id === selectedFirmId,
  )?.name;

  const selectClient = (
    client: GetTaxPersonClientByTaxFirmIdResponse,
  ): SelectedClient => ({
    firmId: selectedFirmId,
    clientId: client.taxPersonClientId || "",
    name:
      [client.taxpayerFirstName, client.taxpayerLastName]
        .filter(Boolean)
        .join(" ") || "this tax client",
  });

  const openEditDialog = (client: GetTaxPersonClientByTaxFirmIdResponse) => {
    clearErrors();
    reset({
      taxpayerFirstName: client.taxpayerFirstName ?? "",
      taxpayerLastName: client.taxpayerLastName ?? "",
      taxYear: client.taxYear == null ? "" : String(client.taxYear),
      taxpayerSSN: client.taxpayerSsn ?? "",
      taxpayerDOB: client.taxpayerDob ?? "",
      mailingAddress: client.address ?? "",
      phoneNumber: client.phoneNumber ?? "",
      email: client.email ?? "",
    });
    setEditingClient(selectClient(client));
  };

  const submitUpdate = (data: EditTaxClientFormData) => {
    if (!editingClient || !isDirty || isUpdating) return;
    updateTaxClient(editingClient.firmId, editingClient.clientId, {
      taxpayerFirstName: data.taxpayerFirstName,
      taxpayerLastName: data.taxpayerLastName,
      taxYear: Number(data.taxYear),
      taxpayerSsn: data.taxpayerSSN,
      taxpayerDob: data.taxpayerDOB || null,
      address: data.mailingAddress || null,
      phoneNumber: data.phoneNumber || null,
      email: data.email || null,
    });
  };

  return (
    <div className="container min-h-screen space-y-6 rounded-lg bg-white p-4">
      <section
        aria-labelledby="tax-clients-heading"
        className="flex flex-col gap-4 rounded-lg border p-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="space-y-1">
          <h1 id="tax-clients-heading" className="text-2xl font-bold">
            Tax Clients
          </h1>
          <p className="text-sm text-gray-600">
            Manage taxpayers and clients linked to your tax firms.
          </p>
        </div>
        <Link
          href="/crm/addTaxClient/new"
          className={buttonVariants({ className: "self-start sm:self-auto" })}
        >
          Add Tax Client
        </Link>
      </section>

      <section
        aria-labelledby="saved-tax-clients-heading"
        className="space-y-4 rounded-lg border p-6"
      >
        <div>
          <h2 id="saved-tax-clients-heading" className="text-lg font-semibold">
            Saved Tax Clients
          </h2>
          <p
            id="tax-clients-availability"
            className="mt-1 text-sm text-gray-600"
          >
            Select a firm to view its saved tax clients.
          </p>
        </div>
        <div className="space-y-4 flex flex-col ">
          <div className="space-y-2">
            <Label htmlFor="firmSelect">
              Select Firm <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="firmId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || firstFirmId}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="firmSelect" className="w-full">
                    <SelectValue placeholder="Select a firm">
                      {field.value || firstFirmId
                        ? firmOptions.find(
                            (f) => f.id === (field.value || firstFirmId),
                          )?.name ||
                          field.value ||
                          firstFirmId
                        : "Select a firm"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Available Firms</SelectLabel>
                      {isLoading ? (
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
              )}
            />
            {firmsError && (
              <Alert variant="destructive">
                <AlertDescription>{firmsError.message}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
        {error && selectedFirmId && (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load tax clients: {error.message}
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
        <div className="overflow-x-auto rounded-lg border">
          <table
            className="w-full text-left text-sm"
            aria-describedby="tax-clients-availability"
          >
            <caption className="sr-only">Saved tax clients</caption>
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                {["Name", "Firm", "Tax Year", "Email", "Phone", "Actions"].map(
                  (heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="whitespace-nowrap px-4 py-3 font-medium text-center"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {!selectedFirmId ||
              clientsLoading ||
              error ||
              taxClients.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    {!selectedFirmId
                      ? "Select a firm to view tax clients."
                      : clientsLoading
                        ? "Loading tax clients..."
                        : error
                          ? "Tax clients could not be loaded."
                          : "No tax clients found for this firm."}
                  </td>
                </tr>
              ) : (
                taxClients.map((client, index) => (
                  <tr
                    key={client.taxPersonClientId ?? index}
                    className="border-t"
                  >
                    <td className="px-4 py-3 text-center">
                      {[client.taxpayerFirstName, client.taxpayerLastName]
                        .filter(Boolean)
                        .join(" ") || "Not provided"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {selectedFirmName || selectedFirmId}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {client.taxYear ?? "Not provided"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {client.email || "Not provided"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {client.phoneNumber || "Not provided"}
                    </td>
                    {/* <td className="px-4 py-3 text-center">
                      {client. || "Not provided"}
                    </td> */}
                    <td className="px-4 py-3 flex text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        aria-label={`Edit ${selectClient(client).name}`}
                        disabled={
                          !client.taxPersonClientId || isUpdating || isDeleting
                        }
                        onClick={() => openEditDialog(client)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        aria-label={`Delete ${selectClient(client).name}`}
                        disabled={
                          !client.taxPersonClientId || isUpdating || isDeleting
                        }
                        onClick={() => setDeletingClient(selectClient(client))}
                      >
                        <Trash size={16} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      <Dialog
        open={Boolean(editingClient)}
        onOpenChange={(open) => {
          if (!open && !isUpdating) {
            setEditingClient(null);
            reset();
          }
        }}
      >
        <DialogContent
          className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
          showCloseButton={!isUpdating}
        >
          <DialogHeader>
            <DialogTitle>Edit tax client</DialogTitle>
            <DialogDescription>
              Update client details. Fields marked * are required.
            </DialogDescription>
          </DialogHeader>
          {editingClient && (
            <form
              noValidate
              onSubmit={handleSubmit(submitUpdate)}
              className="space-y-4"
            >
              <fieldset
                disabled={isUpdating}
                className="grid gap-4 sm:grid-cols-2"
              >
                {editFields.map(({ name, label, required, type }) => (
                  <div key={name} className="space-y-2">
                    <Label htmlFor={`editClient-${name}`}>
                      {label}
                      {required && <span className="text-red-500"> *</span>}
                    </Label>
                    <Input
                      {...register(name)}
                      lettersOnly={
                        name === "taxpayerFirstName" ||
                        name === "taxpayerLastName"
                      }
                      ssnFormat={name === "taxpayerSSN"}
                      id={`editClient-${name}`}
                      type={type ?? "text"}
                      aria-required={required}
                      aria-invalid={Boolean(editErrors[name])}
                      aria-describedby={
                        editErrors[name]
                          ? `editClient-${name}-error`
                          : undefined
                      }
                      {...(type === "date" && {
                        max: new Date().toISOString().split("T")[0],
                      })}
                    />
                    {editErrors[name] && (
                      <p
                        id={`editClient-${name}-error`}
                        role="alert"
                        className="text-sm text-red-500"
                      >
                        {editErrors[name]?.message}
                      </p>
                    )}
                  </div>
                ))}
              </fieldset>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUpdating}
                  onClick={() => setEditingClient(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!isDirty || isUpdating}>
                  {isUpdating ? "Saving..." : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(deletingClient)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeletingClient(null);
        }}
      >
        <DialogContent showCloseButton={!isDeleting}>
          <DialogHeader>
            <DialogTitle>Delete tax client?</DialogTitle>
            <DialogDescription>
              Delete {deletingClient?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeletingClient(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => {
                if (deletingClient && !isDeleting)
                  deleteTaxClient(
                    deletingClient.firmId,
                    deletingClient.clientId,
                  );
              }}
            >
              {isDeleting ? "Deleting..." : "Delete tax client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
