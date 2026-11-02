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
import { useGetContacts } from "@/lib/api/hooks/k2-tax-api/useGetContacts";
import { useGetTaxFirms } from "@/lib/api/hooks/k2-tax-api/useGetTaxFirms";
import Link from "next/link";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

export const Contacts = () => {
  const {
    taxFirms,
    isLoading: firmsLoading,
    error: firmsError,
  } = useGetTaxFirms();
  const { control, setValue } = useForm<{ firmId: string }>({
    defaultValues: { firmId: "" },
  });
  const firmOptions = taxFirms
    .filter((firm) => Boolean(firm.taxFirmId))
    .map((firm) => ({
      id: firm.taxFirmId,
      name: firm.firmName || "Unknown",
    }));
  const selectedFirmValue = useWatch({ control, name: "firmId" });
  const firstFirmId = firmOptions[0]?.id ?? "";
  const selectedFirmId = selectedFirmValue || firstFirmId;
  const { contacts, isLoading, error, refetch } =
    useGetContacts(selectedFirmId);

  useEffect(() => {
    if (!selectedFirmValue && firstFirmId) {
      setValue("firmId", firstFirmId);
    }
  }, [firstFirmId, selectedFirmValue, setValue]);

  const selectedFirmName = firmOptions.find(
    (firm) => firm.id === selectedFirmId,
  )?.name;

  return (
    <div className="container min-h-screen space-y-6 rounded-lg bg-white p-4">
      <section
        aria-labelledby="contacts-heading"
        className="flex flex-col gap-4 rounded-lg border p-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="space-y-1">
          <h1 id="contacts-heading" className="text-2xl font-bold">
            Contacts
          </h1>
          <p className="text-sm text-gray-600">
            Manage contacts linked to your tax firms.
          </p>
        </div>
        <Link
          href="/crm/addContact/new"
          className={buttonVariants({ className: "self-start sm:self-auto" })}
        >
          Add Contact
        </Link>
      </section>

      <section
        aria-labelledby="saved-contacts-heading"
        className="space-y-4 rounded-lg border p-6"
      >
        <div>
          <h2 id="saved-contacts-heading" className="text-lg font-semibold">
            Saved Contacts
          </h2>
          <p id="contacts-availability" className="mt-1 text-sm text-gray-600">
            Select a firm to view its saved contacts.
          </p>
        </div>
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
            )}
          />
          {firmsError && (
            <Alert variant="destructive">
              <AlertDescription>{firmsError.message}</AlertDescription>
            </Alert>
          )}
        </div>
        {error && selectedFirmId && (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load contacts: {error.message}
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
            aria-describedby="contacts-availability"
          >
            <caption className="sr-only">Saved tax firm contacts</caption>
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                {[
                  "Name",
                  "Firm",
                  "Role",
                  "Email",
                  "Phone",
                  "Primary Contact",
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 font-medium"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!selectedFirmId ||
              isLoading ||
              error ||
              contacts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    {!selectedFirmId
                      ? "Select a firm to view contacts."
                      : isLoading
                        ? "Loading contacts..."
                        : error
                          ? "Contacts could not be loaded."
                          : "No contacts found for this firm."}
                  </td>
                </tr>
              ) : (
                contacts.map((contact, index) => (
                  <tr key={contact.contactId ?? index} className="border-t">
                    <td className="px-4 py-3">
                      {[contact.firstName, contact.lastName]
                        .filter(Boolean)
                        .join(" ") || "Not provided"}
                    </td>
                    <td className="px-4 py-3">
                      {selectedFirmName || selectedFirmId}
                    </td>
                    <td className="px-4 py-3">
                      {contact.roleTitleTypeId != null
                        ? `Role ${contact.roleTitleTypeId}`
                        : "Not provided"}
                    </td>
                    <td className="px-4 py-3">
                      {contact.email || "Not provided"}
                    </td>
                    <td className="px-4 py-3">
                      {contact.phoneNumber ||
                        contact.cellPhone ||
                        "Not provided"}
                    </td>
                    <td className="px-4 py-3">
                      {contact.isPrimaryContact == null
                        ? "Not provided"
                        : contact.isPrimaryContact
                          ? "Yes"
                          : "No"}
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
