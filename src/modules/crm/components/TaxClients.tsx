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
import { useGetTaxClients } from "@/lib/api/hooks/k2-tax-api/useGetTaxClients";
import { useGetTaxFirms } from "@/lib/api/hooks/k2-tax-api/useGetTaxFirms";
import Link from "next/link";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

export const TaxClients = () => {
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
            <Label htmlFor="firmSelect">Select Firm *</Label>
            <Controller
              name="firmId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || firstFirmId}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="firmSelect" className="w-full">
                    <SelectValue placeholder="Select a firm" />
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
                {["Name", "Firm", "Tax Year", "Email", "Phone"].map(
                  (heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="whitespace-nowrap px-4 py-3 font-medium"
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
                    colSpan={5}
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
                    <td className="px-4 py-3">
                      {[client.taxpayerFirstName, client.taxpayerLastName]
                        .filter(Boolean)
                        .join(" ") || "Not provided"}
                    </td>
                    <td className="px-4 py-3">
                      {selectedFirmName || selectedFirmId}
                    </td>
                    <td className="px-4 py-3">
                      {client.taxYear ?? "Not provided"}
                    </td>
                    <td className="px-4 py-3">
                      {client.email || "Not provided"}
                    </td>
                    <td className="px-4 py-3">
                      {client.phoneNumber || "Not provided"}
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
