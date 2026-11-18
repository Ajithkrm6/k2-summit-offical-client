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
import type { ContactMethodTypeResponse } from "@/lib/api/generated/k2-tax-api/k2TaxAPI.schemas";
import { useAddTaxClient } from "@/lib/api/hooks/k2-tax-api/useAddTaxClient";
import { useGetTaxFirms } from "@/lib/api/hooks/k2-tax-api/useGetTaxFirms";
import { useLookupData } from "@/lib/api/hooks/k2-tax-api/useLookupData";
import {
  type CreateTaxClientFormData,
  createTaxClientSchema,
} from "@/modules/crm/lib";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";

interface ClientStatusOption {
  value: string;
  label: string;
}

interface FilingStatusOption {
  value: string;
  label: string;
}

export const AddTaxClient = () => {
  const router = useRouter();
  const { contactMethodTypes, isLoading: lookupLoading } = useLookupData();
  const { taxFirms, isLoading } = useGetTaxFirms();
  const {
    addTaxClient,
    isPending: isSubmitting,
    error,
  } = useAddTaxClient({
    onSuccess: () => {
      reset();
      router.push("/crm/addTaxClient");
    },
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateTaxClientFormData>({
    resolver: zodResolver(createTaxClientSchema),
    mode: "onChange",
    defaultValues: {
      firmId: "",
      taxYear: new Date().getFullYear().toString(),
      clientStatus: "",
      taxpayerFirstName: "",
      taxpayerLastName: "",
      taxpayerSSN: "",
      taxpayerDOB: "",
      taxpayerOccupation: "",
      filingStatus: "",
      mailingAddress: "",
      phoneNumber: "",
      email: "",
      numberOfDependents: "0",
      priorYearAGI: "",
      preferredContactMethod: "",
      notes: "",
    },
  });

  const firmOptions =
    taxFirms.map((firm) => ({
      id: firm.taxFirmId || "",
      name: firm.firmName || "Unknown",
    })) || [];

  const selectedFirmId = useWatch({ control, name: "firmId" });

  const onSubmit = (data: CreateTaxClientFormData) => {
    addTaxClient(data);
  };

  // Mock options for dropdowns
  const clientStatusOptions: ClientStatusOption[] = [
    { value: "new", label: "New" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const filingStatusOptions: FilingStatusOption[] = [
    { value: "single", label: "Single" },
    { value: "married_filing_jointly", label: "Married Filing Jointly" },
    { value: "married_filing_separately", label: "Married Filing Separately" },
    { value: "head_of_household", label: "Head of Household" },
    { value: "qualifying_widow", label: "Qualifying Widow(er)" },
  ];

  // Helper functions to get label from value
  const getClientStatusLabel = (value: string): string => {
    return (
      clientStatusOptions.find((opt) => opt.value === value)?.label || value
    );
  };

  const getFilingStatusLabel = (value: string): string => {
    return (
      filingStatusOptions.find((opt) => opt.value === value)?.label || value
    );
  };

  const getContactMethodLabel = (value: string): string => {
    if (!value) return "";
    const item = contactMethodTypes.find(
      (t) => String(t.contactMethodTypeId) === value,
    );
    return item?.contactMethodTypeName || value;
  };

  return (
    <div className="p-6 container  min-h-screen bg-white">
      <Link
        href="/crm/addTaxClient"
        className="mb-4 inline-block text-sm text-primary underline-offset-4 hover:underline"
      >
        Back to Tax Clients
      </Link>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Add Tax Client to Firm</h1>
        <p className="text-gray-600 text-sm mt-2">
          Link a taxpayer/client to the selected firm
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Fields marked <span className="text-red-500">*</span> are required.
          All other fields are optional.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="firmSelect">
            Select Firm <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="firmId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="firmSelect"
                  className="w-full"
                  aria-required="true"
                >
                  <SelectValue placeholder="Select a firm">
                    {selectedFirmId
                      ? firmOptions.find((f) => f.id === selectedFirmId)
                          ?.name || selectedFirmId
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
          {errors.firmId && (
            <p className="text-red-500 text-sm">{errors.firmId.message}</p>
          )}
        </div>

        {/* Basic Information */}
        <div className="space-y-4 border-t pt-6">
          <h2 className="text-lg font-semibold">Basic Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      onValueChange={(value) => value && field.onChange(value)}
                      value={field.value ?? ""}
                    >
                      <SelectTrigger
                        id="taxYear"
                        className="w-full"
                        aria-required="true"
                        onBlur={field.onBlur}
                      >
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

            <div className="space-y-2">
              <Label htmlFor="clientStatus">Client Status</Label>
              <Controller
                name="clientStatus"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status...">
                        {field.value
                          ? getClientStatusLabel(field.value)
                          : "Select status..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Client Status</SelectLabel>
                        {clientStatusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.clientStatus && (
                <p className="text-red-500 text-sm">
                  {errors.clientStatus.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Taxpayer Information */}
        <div className="space-y-4 border-t pt-6">
          <h2 className="text-lg font-semibold">Taxpayer Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxpayerFirstName">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("taxpayerFirstName")}
                lettersOnly
                id="taxpayerFirstName"
                placeholder="John"
                aria-required="true"
              />
              {errors.taxpayerFirstName && (
                <p className="text-red-500 text-sm">
                  {errors.taxpayerFirstName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxpayerLastName">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("taxpayerLastName")}
                lettersOnly
                id="taxpayerLastName"
                placeholder="Doe"
                aria-required="true"
              />
              {errors.taxpayerLastName && (
                <p className="text-red-500 text-sm">
                  {errors.taxpayerLastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxpayerSSN">
                SSN <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("taxpayerSSN")}
                ssnFormat
                id="taxpayerSSN"
                placeholder="123-45-6789"
                aria-required="true"
              />
              {errors.taxpayerSSN && (
                <p className="text-red-500 text-sm">
                  {errors.taxpayerSSN.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxpayerDOB">Date Of Birth</Label>
              <Input
                {...register("taxpayerDOB")}
                id="taxpayerDOB"
                type="date"
                max={new Date().toISOString().split("T")[0]}
              />
              {errors.taxpayerDOB && (
                <p className="text-red-500 text-sm">
                  {errors.taxpayerDOB.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxpayerOccupation">Occupation</Label>
              <Input
                {...register("taxpayerOccupation")}
                id="taxpayerOccupation"
                placeholder="Software Engineer"
              />
              {errors.taxpayerOccupation && (
                <p className="text-red-500 text-sm">
                  {errors.taxpayerOccupation.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="filingStatus">Filing Status</Label>
              <Controller
                name="filingStatus"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select...">
                        {field.value
                          ? getFilingStatusLabel(field.value)
                          : "Select..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Filing Status</SelectLabel>
                        {filingStatusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.filingStatus && (
                <p className="text-red-500 text-sm">
                  {errors.filingStatus.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4 border-t pt-6">
          <h2 className="text-lg font-semibold">Contact Information</h2>

          <div className="space-y-2">
            <Label htmlFor="mailingAddress">Mailing Address</Label>
            <textarea
              {...register("mailingAddress")}
              id="mailingAddress"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="123 Main Street, City, State, ZIP"
              rows={3}
            />
            {errors.mailingAddress && (
              <p className="text-red-500 text-sm">
                {errors.mailingAddress.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                {...register("phoneNumber")}
                id="phoneNumber"
                type="tel"
                placeholder="+15551234567"
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-sm">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                {...register("email")}
                id="email"
                type="email"
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferredContactMethod">
                Preferred Contact Method
              </Label>
              <Controller
                name="preferredContactMethod"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select...">
                        {field.value
                          ? getContactMethodLabel(field.value)
                          : "Select..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Contact Methods</SelectLabel>
                        {lookupLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading...
                          </SelectItem>
                        ) : contactMethodTypes.length === 0 ? (
                          <SelectItem value="empty" disabled>
                            No methods available
                          </SelectItem>
                        ) : (
                          contactMethodTypes.map(
                            (item: ContactMethodTypeResponse) => (
                              <SelectItem
                                key={item.contactMethodTypeId}
                                value={(
                                  item.contactMethodTypeId || ""
                                ).toString()}
                              >
                                {item.contactMethodTypeName || "Unknown"}
                              </SelectItem>
                            ),
                          )
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.preferredContactMethod && (
                <p className="text-red-500 text-sm">
                  {errors.preferredContactMethod.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-4 border-t pt-6">
          <h2 className="text-lg font-semibold">Additional Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numberOfDependents">Number of Dependents</Label>
              <Input
                {...register("numberOfDependents")}
                id="numberOfDependents"
                type="number"
                placeholder="0"
                min="0"
              />
              {errors.numberOfDependents && (
                <p className="text-red-500 text-sm">
                  {errors.numberOfDependents.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priorYearAGI">Prior Year AGI</Label>
              <Input
                {...register("priorYearAGI")}
                id="priorYearAGI"
                type="number"
                placeholder="0"
              />
              {errors.priorYearAGI && (
                <p className="text-red-500 text-sm">
                  {errors.priorYearAGI.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              {...register("notes")}
              id="notes"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any additional notes..."
              rows={3}
            />
            {errors.notes && (
              <p className="text-red-500 text-sm">{errors.notes.message}</p>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/crm/addTaxClient")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Tax Client"}
          </Button>
        </div>
      </form>
    </div>
  );
};
