"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useUpdateContact } from "@/lib/api/hooks/k2-tax-api/useUpdateContact";
import { useDeleteContact } from "@/lib/api/hooks/k2-tax-api/useDeleteContact";
import { useLookupData } from "@/lib/api/hooks/k2-tax-api/useLookupData";
import type { GetTaxFirmContactByTaxFirmIdResponse } from "@/lib/api/generated/k2-tax-api/k2TaxAPI.schemas";
import {
  editContactSchema,
  getRoleTitleLabel,
  type EditContactFormData,
} from "@/modules/crm/lib";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Trash } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

interface SelectedContact {
  firmId: string;
  contactId: string;
  name: string;
}

const editFields: {
  name:
    "firstName" | "lastName" | "phoneNumber" | "cellPhone" | "email" | "notes";
  label: string;
  required?: boolean;
  type?: "text" | "tel" | "email";
}[] = [
  { name: "firstName", label: "First name", required: true },
  { name: "lastName", label: "Last name", required: true },
  { name: "phoneNumber", label: "Phone", type: "tel" },
  { name: "cellPhone", label: "Cell phone", type: "tel" },
  { name: "email", label: "Email", type: "email" },
  { name: "notes", label: "Notes" },
];

export const Contacts = () => {
  const [editingContact, setEditingContact] = useState<SelectedContact | null>(
    null,
  );
  const [deletingContact, setDeletingContact] =
    useState<SelectedContact | null>(null);
  const { updateContact, isPending: isUpdating } = useUpdateContact({
    onSuccess: () => setEditingContact(null),
  });
  const { deleteContact, isPending: isDeleting } = useDeleteContact({
    onSuccess: () => setDeletingContact(null),
  });
  const {
    contactTypes,
    contactMethodTypes,
    isLoading: lookupLoading,
    error: lookupError,
  } = useLookupData();
  const {
    register,
    handleSubmit,
    reset,
    control: editControl,
    formState: { errors: editErrors, isDirty },
  } = useForm<EditContactFormData>({
    resolver: zodResolver(editContactSchema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      cellPhone: "",
      email: "",
      notes: "",
      isPrimaryContact: false,
    },
  });
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

  const selectContact = (
    contact: GetTaxFirmContactByTaxFirmIdResponse,
  ): SelectedContact => ({
    firmId: selectedFirmId,
    contactId: contact.contactId || "",
    name:
      [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
      "this contact",
  });
  const openEditDialog = (contact: GetTaxFirmContactByTaxFirmIdResponse) => {
    reset({
      firstName: contact.firstName ?? "",
      lastName: contact.lastName ?? "",
      phoneNumber: contact.phoneNumber ?? "",
      cellPhone: contact.cellPhone ?? "",
      email: contact.email ?? "",
      notes: contact.notes ?? "",
      roleTitleTypeId: contact.roleTitleTypeId,
      preferredContactMethodTypeId:
        contact.preferredContactMethodTypeId ?? undefined,
      isPrimaryContact: contact.isPrimaryContact ?? false,
    });
    setEditingContact(selectContact(contact));
  };
  const submitUpdate = (data: EditContactFormData) => {
    if (!editingContact || !isDirty || isUpdating) return;
    updateContact(editingContact.firmId, editingContact.contactId, {
      firstName: data.firstName,
      lastName: data.lastName,
      roleTitleTypeId: data.roleTitleTypeId,
      preferredContactMethodTypeId: data.preferredContactMethodTypeId,
      phoneNumber: data.phoneNumber || null,
      cellPhone: data.cellPhone || null,
      email: data.email || null,
      notes: data.notes || null,
      isPrimaryContact: data.isPrimaryContact ?? false,
    });
  };

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
                  "Actions",
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
              {!selectedFirmId ||
              isLoading ||
              error ||
              contacts.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
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
                    <td className="px-4 py-3 text-center">
                      {[contact.firstName, contact.lastName]
                        .filter(Boolean)
                        .join(" ") || "Not provided"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {selectedFirmName || selectedFirmId}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getRoleTitleLabel(contact.roleTitleTypeId)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {contact.email || "Not provided"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {contact.phoneNumber ||
                        contact.cellPhone ||
                        "Not provided"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {contact.isPrimaryContact == null
                        ? "Not provided"
                        : contact.isPrimaryContact
                          ? "Yes"
                          : "No"}
                    </td>
                    <td className="px-4 py-3 flex text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        aria-label={`Edit ${selectContact(contact).name}`}
                        disabled={
                          !contact.contactId || isUpdating || isDeleting
                        }
                        onClick={() => openEditDialog(contact)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        aria-label={`Delete ${selectContact(contact).name}`}
                        disabled={
                          !contact.contactId || isUpdating || isDeleting
                        }
                        onClick={() =>
                          setDeletingContact(selectContact(contact))
                        }
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
        open={Boolean(editingContact)}
        onOpenChange={(open) => {
          if (!open && !isUpdating) setEditingContact(null);
        }}
      >
        <DialogContent
          className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
          showCloseButton={!isUpdating}
        >
          <DialogHeader>
            <DialogTitle>Edit contact</DialogTitle>
            <DialogDescription>
              Update contact details. Fields marked * are required.
            </DialogDescription>
          </DialogHeader>
          {editingContact && (
            <form
              noValidate
              onSubmit={handleSubmit(submitUpdate)}
              className="space-y-4"
            >
              {lookupError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Failed to load contact options: {lookupError.message}
                  </AlertDescription>
                </Alert>
              )}
              <fieldset
                disabled={isUpdating}
                className="grid gap-4 sm:grid-cols-2"
              >
                {editFields.map(({ name, label, type, required }) => (
                  <div key={name} className="space-y-2">
                    <Label htmlFor={`editContact-${name}`}>
                      {label}
                      {required && <span className="text-red-500"> *</span>}
                    </Label>
                    <Input
                      {...register(name)}
                      lettersOnly={name === "firstName" || name === "lastName"}
                      id={`editContact-${name}`}
                      type={type ?? "text"}
                      aria-required={required}
                      aria-invalid={Boolean(editErrors[name])}
                      aria-describedby={
                        editErrors[name]
                          ? `editContact-${name}-error`
                          : undefined
                      }
                    />
                    {editErrors[name] && (
                      <p
                        id={`editContact-${name}-error`}
                        role="alert"
                        className="text-sm text-red-500"
                      >
                        {editErrors[name]?.message}
                      </p>
                    )}
                  </div>
                ))}
                {(
                  ["roleTitleTypeId", "preferredContactMethodTypeId"] as const
                ).map((name) => {
                  const options =
                    name === "roleTitleTypeId"
                      ? contactTypes.flatMap((item) =>
                          item.contactTypeId != null
                            ? [
                                {
                                  id: item.contactTypeId,
                                  label:
                                    item.contactTypeName ||
                                    `Role ${item.contactTypeId}`,
                                },
                              ]
                            : [],
                        )
                      : contactMethodTypes.flatMap((item) =>
                          item.contactMethodTypeId != null
                            ? [
                                {
                                  id: item.contactMethodTypeId,
                                  label:
                                    item.contactMethodTypeName ||
                                    `Method ${item.contactMethodTypeId}`,
                                },
                              ]
                            : [],
                        );
                  const label =
                    name === "roleTitleTypeId"
                      ? "Role / title"
                      : "Preferred contact method";
                  return (
                    <div key={name} className="space-y-2">
                      <Label htmlFor={`editContact-${name}`}>
                        {label} <span className="text-red-500">*</span>
                      </Label>
                      <Controller
                        name={name}
                        control={editControl}
                        render={({ field }) => (
                          <Select
                            value={field.value?.toString() ?? ""}
                            onValueChange={(value) =>
                              field.onChange(value ? Number(value) : undefined)
                            }
                            disabled={
                              isUpdating ||
                              lookupLoading ||
                              Boolean(lookupError)
                            }
                          >
                            <SelectTrigger
                              id={`editContact-${name}`}
                              className="w-full"
                              aria-required="true"
                              aria-invalid={Boolean(editErrors[name])}
                            >
                              <SelectValue
                                placeholder={`Select ${label.toLowerCase()}`}
                              >
                                {
                                  options.find(
                                    (item) => item.id === field.value,
                                  )?.label
                                }
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {lookupLoading ? (
                                <SelectItem value="loading" disabled>
                                  Loading options...
                                </SelectItem>
                              ) : options.length === 0 ? (
                                <SelectItem value="empty" disabled>
                                  No options available
                                </SelectItem>
                              ) : (
                                options.map((item) => (
                                  <SelectItem
                                    key={item.id}
                                    value={String(item.id)}
                                  >
                                    {item.label}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {editErrors[name] && (
                        <p role="alert" className="text-sm text-red-500">
                          {editErrors[name]?.message}
                        </p>
                      )}
                    </div>
                  );
                })}
                <div className="flex items-center gap-2">
                  <Controller
                    name="isPrimaryContact"
                    control={editControl}
                    render={({ field }) => (
                      <Checkbox
                        id="editContact-primary"
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                        disabled={isUpdating}
                      />
                    )}
                  />
                  <Label htmlFor="editContact-primary">Primary contact</Label>
                </div>
              </fieldset>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUpdating}
                  onClick={() => setEditingContact(null)}
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
        open={Boolean(deletingContact)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeletingContact(null);
        }}
      >
        <DialogContent showCloseButton={!isDeleting}>
          <DialogHeader>
            <DialogTitle>Delete contact?</DialogTitle>
            <DialogDescription>
              Delete {deletingContact?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeletingContact(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => {
                if (deletingContact && !isDeleting)
                  deleteContact(
                    deletingContact.firmId,
                    deletingContact.contactId,
                  );
              }}
            >
              {isDeleting ? "Deleting..." : "Delete contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
