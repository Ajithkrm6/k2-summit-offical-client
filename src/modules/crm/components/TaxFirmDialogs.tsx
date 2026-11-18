/**
 * Reusable Dialog Components for Tax Firm Management
 * Exports: EditTaxFirmDialog, DeleteTaxFirmDialog
 */

"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  GetTaxFirmResponse,
  UpdateTaxFirmRequest,
} from "@/lib/api/generated/k2-tax-api/k2TaxAPI.schemas";
import { phoneNumberSchema } from "@/modules/crm/lib";
import { Controller, useForm } from "react-hook-form";

// Types
export interface EditTaxFirmFields {
  firmName: string;
  leadStatusTypeId: string;
  firmTypeId: string;
  credentialTypeId: string;
  address: string;
  mainPhoneNumber: string;
  websiteUrl: string;
  numberOfOffices: string;
  numberOfTaxClients: string;
  estimatedAnnualRevenue: string;
  employeeCount: string;
  servicesOffered: string;
  currentSoftware: string;
  competitorInUse: string;
  leadSource: string;
  referralSource: string;
  potentialDealSize: string;
  notes: string;
}

export interface LookupOption {
  value: string;
  label: string;
}

export interface EditTaxFirmDialogProps {
  open: boolean;
  firm: GetTaxFirmResponse | null;
  lookupOptions: {
    firmTypes: LookupOption[];
    credentialTypes: LookupOption[];
    leadStatusTypes: LookupOption[];
  };
  isLoading?: boolean;
  isUpdating?: boolean;
  lookupError?: Error | null;
  onClose: () => void;
  onSubmit: (data: UpdateTaxFirmRequest, firmId: string) => void;
}

export interface DeleteTaxFirmDialogProps {
  open: boolean;
  firm: GetTaxFirmResponse | null;
  isDeleting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

// Constants and Utilities
const numberToFormValue = (value: number | null | undefined) =>
  value == null ? "" : String(value);

const formValueToNumber = (value: string) =>
  value.trim() === "" ? null : Number(value);

export const editFirmFields: {
  name: keyof EditTaxFirmFields;
  label: string;
  type?: string;
  maxLength?: number;
}[] = [
  { name: "firmName", label: "Firm Name", maxLength: 255 },
  { name: "firmTypeId", label: "Firm Type" },
  { name: "credentialTypeId", label: "Credentials" },
  { name: "leadStatusTypeId", label: "Lead Status" },
  { name: "address", label: "Address", maxLength: 500 },
  { name: "websiteUrl", label: "Url" },
  { name: "mainPhoneNumber", label: "Main Phone number", type: "tel" },
  { name: "numberOfOffices", label: "No of Offices", type: "number" },
  {
    name: "numberOfTaxClients",
    label: "No of Tax Clients",
    type: "number",
  },
  {
    name: "estimatedAnnualRevenue",
    label: "Estimated Annual Revenue",
    type: "number",
  },
  { name: "employeeCount", label: "Employee Count", type: "number" },
  { name: "currentSoftware", label: "Current Software", maxLength: 500 },
  { name: "servicesOffered", label: "Services Offered" },
  { name: "leadSource", label: "Lead Source", maxLength: 500 },
  { name: "referralSource", label: "Referral Source", maxLength: 500 },
  {
    name: "potentialDealSize",
    label: "Potential deal size",
    type: "number",
  },
  { name: "competitorInUse", label: "Competitor in use", maxLength: 500 },
  { name: "notes", label: "Notes", maxLength: 1000 },
];

const numericEditFirmFields = new Set<string>([
  "leadStatusTypeId",
  "firmTypeId",
  "credentialTypeId",
  "numberOfOffices",
  "numberOfTaxClients",
  "estimatedAnnualRevenue",
  "employeeCount",
  "potentialDealSize",
]);

const integerEditFirmFields = new Set<string>([
  "leadStatusTypeId",
  "firmTypeId",
  "credentialTypeId",
  "numberOfOffices",
  "numberOfTaxClients",
  "employeeCount",
]);

export const getEditFirmDefaults = (
  firm: GetTaxFirmResponse,
): EditTaxFirmFields => ({
  firmName: firm.firmName ?? "",
  leadStatusTypeId: numberToFormValue(firm.leadStatusTypeId),
  firmTypeId: numberToFormValue(firm.firmTypeId),
  credentialTypeId: numberToFormValue(firm.credentialTypeId),
  address: firm.address ?? "",
  mainPhoneNumber: firm.mainPhoneNumber ?? "",
  websiteUrl: firm.websiteUrl ?? "",
  numberOfOffices: numberToFormValue(firm.numberOfOffices),
  numberOfTaxClients: numberToFormValue(firm.numberOfTaxClients),
  estimatedAnnualRevenue: numberToFormValue(firm.estimatedAnnualRevenue),
  employeeCount: numberToFormValue(firm.employeeCount),
  servicesOffered: firm.servicesOffered ?? "",
  currentSoftware: firm.currentSoftware ?? "",
  competitorInUse: firm.competitorInUse ?? "",
  leadSource: firm.leadSource ?? "",
  referralSource: firm.referralSource ?? "",
  potentialDealSize: numberToFormValue(firm.potentialDealSize),
  notes: firm.notes ?? "",
});

export const toUpdateTaxFirmRequest = (
  values: EditTaxFirmFields,
  original: GetTaxFirmResponse,
): UpdateTaxFirmRequest => {
  const initial = getEditFirmDefaults(original);
  const payload: Record<string, string | number | null> = {};

  for (const key of Object.keys(values) as (keyof EditTaxFirmFields)[]) {
    const value = values[key].trim();
    if (value === initial[key].trim()) continue;

    payload[key] = numericEditFirmFields.has(key)
      ? formValueToNumber(value)
      : value;
  }

  return payload as UpdateTaxFirmRequest;
};

const defaultEditFirmValues: EditTaxFirmFields = {
  firmName: "",
  leadStatusTypeId: "",
  firmTypeId: "",
  credentialTypeId: "",
  address: "",
  mainPhoneNumber: "",
  websiteUrl: "",
  numberOfOffices: "",
  numberOfTaxClients: "",
  estimatedAnnualRevenue: "",
  employeeCount: "",
  servicesOffered: "",
  currentSoftware: "",
  competitorInUse: "",
  leadSource: "",
  referralSource: "",
  potentialDealSize: "",
  notes: "",
};

const editFirmFieldRules = (name: keyof EditTaxFirmFields) => {
  if (name === "firmTypeId" || name === "leadStatusTypeId") {
    return {
      required:
        name === "firmTypeId"
          ? "Firm type is required"
          : "Lead status is required",
      validate: (value: string) =>
        (Number.isInteger(Number(value)) && Number(value) > 0) ||
        "Please select a valid option",
    };
  }
  if (name === "firmName") {
    return {
      required: "Firm name is required",
      maxLength: 255,
      pattern: {
        value: /^[A-Za-z ]+$/,
        message: "Firm name must contain only letters and spaces",
      },
    };
  }

  if (name === "mainPhoneNumber") {
    return {
      validate: (value: string) => {
        const result = phoneNumberSchema.safeParse(value);
        return result.success || result.error.issues[0].message;
      },
    };
  }

  if (numericEditFirmFields.has(name)) {
    return {
      validate: (value: string) => {
        if (!value.trim()) return true;
        const number = Number(value);
        if (!Number.isFinite(number) || number < 0) return false;
        return !integerEditFirmFields.has(name) || Number.isInteger(number);
      },
    };
  }

  if (name === "address") return { maxLength: 500 };
  if (name === "websiteUrl") {
    return {
      validate: (value: string) => {
        if (!value.trim()) return true;
        try {
          new URL(value.startsWith("http") ? value : `https://${value}`);
          return true;
        } catch {
          return false;
        }
      },
    };
  }
  if (name === "notes") return { maxLength: 1000 };

  return {};
};

// Components
export const EditTaxFirmDialog = ({
  open,
  firm,
  lookupOptions,
  isLoading = false,
  isUpdating = false,
  lookupError,
  onClose,
  onSubmit,
}: EditTaxFirmDialogProps) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<EditTaxFirmFields>({
    defaultValues: firm ? getEditFirmDefaults(firm) : defaultEditFirmValues,
    mode: "onChange",
  });

  const submitFirmUpdate = (values: EditTaxFirmFields) => {
    if (!firm?.taxFirmId) return;
    const updateRequest = toUpdateTaxFirmRequest(values, firm);
    onSubmit(updateRequest, firm.taxFirmId);
  };

  const lookupFields: Record<keyof EditTaxFirmFields, LookupOption[]> = {
    firmTypeId: lookupOptions.firmTypes,
    credentialTypeId: lookupOptions.credentialTypes,
    leadStatusTypeId: lookupOptions.leadStatusTypes,
    leadSource: [],
    firmName: [],
    address: [],
    mainPhoneNumber: [],
    websiteUrl: [],
    numberOfOffices: [],
    numberOfTaxClients: [],
    estimatedAnnualRevenue: [],
    employeeCount: [],
    servicesOffered: [],
    currentSoftware: [],
    competitorInUse: [],
    referralSource: [],
    potentialDealSize: [],
    notes: [],
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
        showCloseButton={!isUpdating}
      >
        <DialogHeader>
          <DialogTitle>Edit tax firm</DialogTitle>
          <DialogDescription>
            Update the firm details. Save becomes available when you make a
            valid change.
          </DialogDescription>
        </DialogHeader>
        {lookupError && (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load firm options: {lookupError.message}
            </AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit(submitFirmUpdate)} className="space-y-4">
          <fieldset disabled={isUpdating} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {editFirmFields.map(({ name, label, type, maxLength }) => {
                const fieldError = errors[name]?.message;
                const fieldId = `editFirm-${name}`;

                return (
                  <div
                    key={name}
                    className={`space-y-2 ${name === "notes" ? "sm:col-span-2" : ""}`}
                  >
                    <Label htmlFor={fieldId}>
                      {label}
                      {(name === "firmName" ||
                        name === "firmTypeId" ||
                        name === "leadStatusTypeId") && (
                        <span className="text-red-500"> *</span>
                      )}
                    </Label>
                    {name === "firmTypeId" ||
                    name === "credentialTypeId" ||
                    name === "leadStatusTypeId" ? (
                      <Controller
                        name={name}
                        control={control}
                        rules={editFirmFieldRules(name)}
                        render={({ field }) => {
                          const options = lookupFields[name];
                          const selectedOption = options.find(
                            (option) => option.value === field.value,
                          );
                          return (
                            <Select
                              value={field.value || null}
                              onValueChange={(value) =>
                                field.onChange(value ?? "")
                              }
                              disabled={
                                isUpdating || isLoading || Boolean(lookupError)
                              }
                            >
                              <SelectTrigger
                                id={fieldId}
                                className="w-full"
                                ref={field.ref}
                                onBlur={field.onBlur}
                                aria-invalid={Boolean(fieldError)}
                              >
                                <SelectValue
                                  placeholder={`Select ${label.toLowerCase()}`}
                                >
                                  {selectedOption?.label}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {name === "credentialTypeId" && (
                                  <SelectItem value={null}>
                                    No credentials
                                  </SelectItem>
                                )}
                                {isLoading ? (
                                  <SelectItem value="loading" disabled>
                                    Loading options...
                                  </SelectItem>
                                ) : options.length === 0 ? (
                                  <SelectItem value="empty" disabled>
                                    No options available
                                  </SelectItem>
                                ) : (
                                  options.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          );
                        }}
                      />
                    ) : name === "notes" ? (
                      <Textarea
                        id={fieldId}
                        aria-invalid={Boolean(fieldError)}
                        {...register(name, editFirmFieldRules(name))}
                        maxLength={maxLength}
                      />
                    ) : (
                      <Input
                        alphanumericOnly={name === "firmName"}
                        id={fieldId}
                        type={type ?? "text"}
                        aria-invalid={Boolean(fieldError)}
                        min={numericEditFirmFields.has(name) ? 0 : undefined}
                        step={
                          integerEditFirmFields.has(name)
                            ? 1
                            : name === "estimatedAnnualRevenue" ||
                                name === "potentialDealSize"
                              ? "any"
                              : undefined
                        }
                        {...register(name, editFirmFieldRules(name))}
                        maxLength={maxLength}
                      />
                    )}
                    {fieldError && (
                      <p className="text-sm text-destructive" role="alert">
                        {fieldError}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </fieldset>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isDirty || isUpdating}>
              {isUpdating ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const DeleteTaxFirmDialog = ({
  open,
  firm,
  isDeleting = false,
  onClose,
  onConfirm,
}: DeleteTaxFirmDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete tax firm?</DialogTitle>
          <DialogDescription>
            This will permanently delete{" "}
            <span className="font-medium text-destructive">
              {firm?.firmName || "this tax firm"}
            </span>
            . Related clients, contacts, and activity records may also be
            deleted. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete tax firm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
