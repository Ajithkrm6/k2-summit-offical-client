"use client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { useAddContact } from "@/lib/api/hooks/k2-tax-api/useAddContact";
import { useGetTaxFirms } from "@/lib/api/hooks/k2-tax-api/useGetTaxFirms";
import {
  CreateContactFormData,
  createContactSchema,
  ROLE_TITLE_OPTIONS,
} from "@/modules/crm/lib";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";

export const AddContact = () => {
  const router = useRouter();
  const { taxFirms, isLoading } = useGetTaxFirms();

  // Extract firm IDs and names from taxFirms data
  const firmOptions =
    taxFirms.map((firm) => ({
      id: firm.taxFirmId || "",
      name: firm.firmName || "Unknown",
    })) || [];

  const {
    handleSubmit,
    register,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateContactFormData>({
    resolver: zodResolver(createContactSchema),
    mode: "onChange",
    defaultValues: {
      firmId: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      cellPhone: "",
      email: "",
      bestTimeToReach: "",
      isPrimaryContact: false,
      notes: "",
    },
  });

  const selectedFirmId = useWatch({ control, name: "firmId" });
  const selectedFirmName = firmOptions.find(
    (firm) => firm.id === selectedFirmId,
  )?.name;

  const handleAddContactSuccess = () => {
    reset();
    router.push("/crm/addContact");
  };

  const { addContact, isPending, errorMessage } = useAddContact({
    taxFirmId: selectedFirmId,
    onSuccess: handleAddContactSuccess,
  });

  const onSubmit = (data: CreateContactFormData) => {
    addContact({
      firstName: data.firstName,
      lastName: data.lastName,
      roleTitleTypeId: data.roleTitleTypeId,
      phoneNumber: data.phoneNumber,
      cellPhone: data.cellPhone,
      email: data.email,
      preferredContactMethodTypeId: data.preferredContactMethodTypeId,
      bestTimeToReach: data.bestTimeToReach,
      isPrimaryContact: data.isPrimaryContact,
      notes: data.notes,
    });
  };

  const roleOptions = [
    { label: "Select a role...", value: null },
    ...ROLE_TITLE_OPTIONS,
  ];

  const contactMethodOptions = [
    { label: "Email", value: 2 },
    { label: "Phone", value: 3 },
  ];

  return (
    <div className="p-4 container space-y-3 min-h-screen bg-white rounded-lg">
      <Link
        href="/crm/addContact"
        className="inline-block text-sm text-primary underline-offset-4 hover:underline"
      >
        Back to Contacts
      </Link>
      <div>
        <h1 className="text-2xl font-bold">Add a Contact</h1>
        <p className="text-gray-600 text-sm">
          Only one contact can be designated as the Primary Contact for each
          firm.
        </p>
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="firmSelect">Select Firm *</Label>
            <Controller
              name="firmId"
              control={control}
              disabled={!selectedFirmId}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
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
            {errors.firmId && (
              <p role="alert" className="text-red-500 text-sm">
                {errors.firmId.message}
              </p>
            )}
          </div>

          {selectedFirmId && (
            <div className="bg-gray-50 p-4 rounded border">
              <Label className="text-sm font-medium">Selected Firm</Label>
              <p className="text-sm font-semibold">
                {selectedFirmName} ({selectedFirmId})
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("firstName")}
                lettersOnly
                id="firstName"
                placeholder="John"
                required
                disabled={!selectedFirmId}
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("lastName")}
                lettersOnly
                id="lastName"
                placeholder="Doe"
                required
                disabled={!selectedFirmId}
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
              <Label htmlFor="roleTitleTypeId">
                Role / Title <span className="text-red-500">*</span>
              </Label>
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
                      <SelectTrigger id="roleTitleTypeId" className="w-full">
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
                type="tel"
                placeholder="+15551234567"
                disabled={!selectedFirmId}
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
                type="tel"
                placeholder="+15559876543"
                disabled={!selectedFirmId}
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
                disabled={!selectedFirmId}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferredContactMethodTypeId">
                Preferred Contact Method <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="preferredContactMethodTypeId"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value ? Number(value) : undefined)
                    }
                    value={field.value?.toString() || ""}
                  >
                    <SelectTrigger
                      id="preferredContactMethodTypeId"
                      className="w-full"
                      aria-required="true"
                      aria-invalid={Boolean(
                        errors.preferredContactMethodTypeId,
                      )}
                    >
                      <SelectValue placeholder="Select a method">
                        {
                          contactMethodOptions.find(
                            (item) => item.value === field.value,
                          )?.label
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Contact Methods</SelectLabel>
                        {contactMethodOptions.map((item) => (
                          <SelectItem
                            key={item.value}
                            value={item.value.toString()}
                          >
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
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
                disabled={!selectedFirmId}
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
              <Controller
                name="isPrimaryContact"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id="isPrimaryContact"
                    disabled={!selectedFirmId}
                    className="w-4 h-4"
                  />
                )}
              />
              <Label htmlFor="isPrimaryContact" className="cursor-pointer">
                Primary Contact?
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
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
              onClick={() => router.push("/crm/addContact")}
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
