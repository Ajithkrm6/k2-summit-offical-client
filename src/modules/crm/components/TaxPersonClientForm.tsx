"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddTaxClient } from "@/lib/api/hooks/k2-tax-api/useAddTaxClient";
import { useGetTaxFirms } from "@/lib/api/hooks/k2-tax-api/useGetTaxFirms";
import { useLookupData } from "@/lib/api/hooks/k2-tax-api/useLookupData";
import {
  createTaxClientSchema,
  type CreateTaxClientFormData,
} from "@/modules/crm/lib";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

const fields: {
  name: keyof CreateTaxClientFormData;
  label: string;
  required?: boolean;
  type?: "text" | "date" | "tel" | "email";
  placeholder?: string;
}[] = [
  { name: "taxpayerFirstName", label: "Taxpayer First Name", required: true },
  { name: "taxpayerLastName", label: "Taxpayer Last Name", required: true },
  { name: "taxYear", label: "Tax Year", required: true, placeholder: "2026" },
  {
    name: "taxpayerSSN",
    label: "Taxpayer SSN",
    required: true,
    placeholder: "123-45-6789",
  },
  { name: "taxpayerDOB", label: "Taxpayer DOB", type: "date" },
  { name: "taxpayerOccupation", label: "Taxpayer Occupation" },
  { name: "spouseFirstName", label: "Spouse First Name" },
  { name: "spouseLastName", label: "Spouse Last Name" },
  { name: "spouseSsn", label: "Spouse SSN", placeholder: "123-45-6789" },
  { name: "spouseDob", label: "Spouse DOB", type: "date" },
  { name: "spouseOccupation", label: "Spouse Occupation" },
  {
    name: "phoneNumber",
    label: "Phone Number",
    type: "tel",
    placeholder: "+15551234567",
  },
  { name: "email", label: "Email", type: "email" },
];

export const TaxPersonClientForm = () => {
  const router = useRouter();
  const {
    taxFirms,
    isLoading: firmsLoading,
    error: firmsError,
  } = useGetTaxFirms();
  const { contactMethodTypes, isLoading: lookupLoading } = useLookupData();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateTaxClientFormData>({
    resolver: zodResolver(createTaxClientSchema),
    mode: "onChange",
    defaultValues: {
      firmId: "",
      taxYear: "",
      taxpayerFirstName: "",
      taxpayerLastName: "",
      taxpayerSSN: "",
      taxpayerDOB: "",
      taxpayerOccupation: "",
      spouseFirstName: "",
      spouseLastName: "",
      spouseSsn: "",
      spouseDob: "",
      spouseOccupation: "",
      phoneNumber: "",
      email: "",
      preferredContactMethod: "",
    },
  });
  const { addTaxClient, isPending, error } = useAddTaxClient({
    onSuccess: () => router.push("/crm/addTaxClient"),
  });

  return (
    <div className="container min-h-screen space-y-4 rounded-lg bg-white p-6">
      <h1 className="text-2xl font-bold">Add Tax Client to Firm</h1>
      <p className="text-sm text-muted-foreground">
        Fields marked <span className="text-red-500">*</span> are required. All
        other fields are optional.
      </p>
      {(error || firmsError) && (
        <Alert variant="destructive">
          <AlertDescription>{(error || firmsError)?.message}</AlertDescription>
        </Alert>
      )}
      <form
        noValidate
        onSubmit={handleSubmit(addTaxClient)}
        className="space-y-4"
      >
        {Object.keys(errors).length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              Please correct the highlighted fields before submitting.
            </AlertDescription>
          </Alert>
        )}
        <fieldset disabled={isPending} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="taxPersonClientId">Tax Person Client ID</Label>
            <Input id="taxPersonClientId" value="Generated on save" readOnly />
            <p className="text-sm text-muted-foreground">
              Assigned by the server, not entered manually.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxFirmId">
              Tax Firm <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="firmId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isPending || firmsLoading}
                >
                  <SelectTrigger
                    id="taxFirmId"
                    className="w-full"
                    aria-required="true"
                    aria-invalid={Boolean(errors.firmId)}
                    aria-describedby={
                      errors.firmId ? "firmId-error" : undefined
                    }
                  >
                    <SelectValue
                      placeholder={
                        firmsLoading ? "Loading firms..." : "Select a firm"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {taxFirms
                      .filter((firm) => firm.taxFirmId)
                      .map((firm) => (
                        <SelectItem key={firm.taxFirmId} value={firm.taxFirmId}>
                          {firm.firmName || firm.taxFirmId}
                        </SelectItem>
                      ))}
                    {!taxFirms.length && (
                      <SelectItem value="empty" disabled>
                        No firms available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.firmId && (
              <p
                id="firmId-error"
                role="alert"
                className="text-sm text-red-500"
              >
                {errors.firmId.message}
              </p>
            )}
          </div>
          {fields.map(({ name, label, required, type, placeholder }) => (
            <div key={name} className="space-y-2">
              <Label htmlFor={name}>
                {label}
                {required && <span className="text-red-500">*</span>}
              </Label>
              <Input
                {...register(name)}
                lettersOnly={[
                  "taxpayerFirstName",
                  "taxpayerLastName",
                  "spouseFirstName",
                  "spouseLastName",
                ].includes(name)}
                ssnFormat={name === "taxpayerSSN" || name === "spouseSsn"}
                id={name}
                type={type ?? "text"}
                placeholder={placeholder}
                aria-required={required}
                aria-invalid={Boolean(errors[name])}
                aria-describedby={errors[name] ? `${name}-error` : undefined}
                {...(type === "date" && {
                  max: new Date().toISOString().split("T")[0],
                })}
              />
              {errors[name] && (
                <p
                  id={`${name}-error`}
                  role="alert"
                  className="text-sm text-red-500"
                >
                  {errors[name]?.message}
                </p>
              )}
            </div>
          ))}
          <div className="space-y-2">
            <Label htmlFor="contactMethodTypeId">Contact Method</Label>
            <Controller
              name="preferredContactMethod"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  disabled={isPending || lookupLoading}
                >
                  <SelectTrigger id="contactMethodTypeId" className="w-full">
                    <SelectValue placeholder="Select contact method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Not specified</SelectItem>
                    {contactMethodTypes
                      .filter((method) => method.contactMethodTypeId)
                      .map((method) => (
                        <SelectItem
                          key={method.contactMethodTypeId}
                          value={String(method.contactMethodTypeId)}
                        >
                          {method.contactMethodTypeName ||
                            String(method.contactMethodTypeId)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.preferredContactMethod && (
              <p role="alert" className="text-sm text-red-500">
                {errors.preferredContactMethod.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="isActive">Active</Label>
            <Input id="isActive" value="Yes (server default)" readOnly />
          </div>
        </fieldset>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => router.push("/dashboard")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save tax client"}
          </Button>
        </div>
      </form>
    </div>
  );
};
