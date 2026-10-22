"use client";
import { useSearchParams } from "next/navigation";
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
import { useAddContact } from "@/lib/api/hooks/k2-tax-api/useAddContact";
import type { CreateTaxFirmContactRequest } from "@/lib/api/generated/k2-tax-api/k2TaxAPI.schemas";
import { CreateContactFormData, createContactSchema } from "@/modules/crm/lib";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

export const AddContact = () => {
  const searchParams = useSearchParams();
  const taxFirmId = searchParams.get("firmId") || "";
  const firmName = searchParams.get("firmName") || "Unknown Firm";

  const { addContact, isPending, isSuccess, error } = useAddContact({
    taxFirmId,
  });

  const {
    handleSubmit,
    register,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createContactSchema),
    defaultValues: {} as CreateContactFormData,
  });

  const onSubmit = (data: CreateContactFormData) => {
    addContact(data as CreateTaxFirmContactRequest);
  };

  useEffect(() => {
    if (isSuccess && !isPending) {
      reset();
    }
  }, [isSuccess, isPending, reset]);

  const roleOptions = [
    { label: "Select a role...", value: null },
    { label: "Owner", value: 1 },
    { label: "Manager", value: 2 },
    { label: "Staff", value: 3 },
    { label: "Accountant", value: 4 },
  ];

  const contactMethodOptions = [
    { label: "Select a method...", value: null },
    { label: "Email", value: 1 },
    { label: "Phone", value: 2 },
    { label: "Cell Phone", value: 3 },
  ];

  if (!taxFirmId) {
    return (
      <div className="p-4 bg-white rounded-lg">
        <Alert variant="destructive">
          <AlertDescription>
            Invalid access. Missing firm ID. Please select a firm first.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 min-h-screen bg-white rounded-lg">
      <div>
        <h1 className="text-2xl font-bold">Add a Contact</h1>
        <p className="text-gray-600 text-sm">
          Linked to Firm ID <strong>{taxFirmId}</strong> — {firmName}. Only one
          contact can be designated as the Primary Contact for each firm.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded border">
            <Label className="text-sm font-medium">Firm ID</Label>
            <p className="text-sm font-semibold">
              {taxFirmId} — {firmName}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                {...register("firstName")}
                id="firstName"
                placeholder="John"
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                {...register("lastName")}
                id="lastName"
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="roleTitleTypeId">Role / Title *</Label>
              <Controller
                name="roleTitleTypeId"
                control={control}
                render={({ field }) => {
                  const selectedItem = roleOptions.find(
                    (item) => item.value === field.value,
                  );
                  return (
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value ? Number(value) : undefined)
                      }
                      value={field.value?.toString() || ""}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a role">
                          {selectedItem?.label}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Roles</SelectLabel>
                          {roleOptions.map((item) => (
                            <SelectItem
                              key={item.value || "null"}
                              value={(item.value || "").toString()}
                            >
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  );
                }}
              />
              {errors.roleTitleTypeId && (
                <p className="text-red-500 text-sm">
                  {errors.roleTitleTypeId.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                {...register("phoneNumber")}
                id="phoneNumber"
                placeholder="(555) 123-4567"
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-sm">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cellPhone">Cell Phone?</Label>
              <Input
                {...register("cellPhone")}
                id="cellPhone"
                placeholder="(555) 987-6543"
              />
              {errors.cellPhone && (
                <p className="text-red-500 text-sm">
                  {errors.cellPhone.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                {...register("email")}
                id="email"
                type="email"
                placeholder="john.doe@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferredContactMethodTypeId">
                Preferred Contact Method
              </Label>
              <Controller
                name="preferredContactMethodTypeId"
                control={control}
                render={({ field }) => {
                  const selectedItem = contactMethodOptions.find(
                    (item) => item.value === field.value,
                  );
                  return (
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value ? Number(value) : undefined)
                      }
                      value={field.value?.toString() || ""}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a method">
                          {selectedItem?.label}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Contact Methods</SelectLabel>
                          {contactMethodOptions.map((item) => (
                            <SelectItem
                              key={item.value || "null"}
                              value={(item.value || "").toString()}
                            >
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  );
                }}
              />
              {errors.preferredContactMethodTypeId && (
                <p className="text-red-500 text-sm">
                  {errors.preferredContactMethodTypeId.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bestTimeToReach">Best Time to Reach</Label>
              <Input
                {...register("bestTimeToReach")}
                id="bestTimeToReach"
                placeholder="9 AM - 5 PM EST"
              />
              {errors.bestTimeToReach && (
                <p className="text-red-500 text-sm">
                  {errors.bestTimeToReach.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                {...register("isPrimaryContact")}
                id="isPrimaryContact"
                type="checkbox"
                className="w-4 h-4"
              />
              <Label htmlFor="isPrimaryContact" className="cursor-pointer">
                Primary Contact?
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              {...register("notes")}
              id="notes"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any additional notes..."
              rows={4}
            />
            {errors.notes && (
              <p className="text-red-500 text-sm">{errors.notes.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Contact"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
