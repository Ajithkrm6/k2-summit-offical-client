/**
 * Dashboard Page
 * Main user dashboard showing overview and quick actions
 * Uses modules: dashboard.store
 * All components use shadcn/ui for consistency
 */

"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useDeleteTaxFirm } from "@/lib/api/hooks/k2-tax-api/useDeleteTaxFirm";
import { useGetTaxFirms } from "@/lib/api/hooks/k2-tax-api/useGetTaxFirms";
import { useLookupData } from "@/lib/api/hooks/k2-tax-api/useLookupData";
import { useUpdateTaxFirm } from "@/lib/api/hooks/k2-tax-api/useUpdateTaxFirm";
import { phoneNumberSchema } from "@/modules/crm/lib";
import { useDashboardStore } from "@/modules/dashboard/store/dashboard.store";
import { Edit, Trash } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

interface EditTaxFirmFields {
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

const numberToFormValue = (value: number | null | undefined) =>
  value == null ? "" : String(value);

const formValueToNumber = (value: string) =>
  value.trim() === "" ? null : Number(value);

const editFirmFields: {
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

const getEditFirmDefaults = (firm: GetTaxFirmResponse): EditTaxFirmFields => ({
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

// PATCH semantics: only changed fields are sent. Cleared text is sent as ""
// (the backend treats null as "leave unchanged"); cleared numbers are sent as null.
const toUpdateTaxFirmRequest = (
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
  return { maxLength: 500 };
};

export default function DashboardPage() {
  const { stats } = useDashboardStore();
  const { taxFirms, isLoading } = useGetTaxFirms();
  const {
    firmTypes,
    credentialsTypes,
    leadStatusTypes,
    isLoading: lookupLoading,
    error: lookupError,
  } = useLookupData();
  const lookupFields = {
    leadSource: [
      { value: "apple", label: "firm type 1" },
      { value: "banana", label: "firm type 2" },
      { value: "blueberry", label: "firm type 3" },
      { value: "grapes", label: "firm type 4" },
      { value: "pineapple", label: "firm type 5" },
    ],
    firmTypeId: firmTypes.flatMap((item) =>
      item.firmTypeId == null
        ? []
        : [
            {
              value: String(item.firmTypeId),
              label: item.name || `Firm type ${item.firmTypeId}`,
            },
          ],
    ),
    credentialTypeId: credentialsTypes.flatMap((item) =>
      item.credentialTypeId == null
        ? []
        : [
            {
              value: String(item.credentialTypeId),
              label: item.name || `Credential ${item.credentialTypeId}`,
            },
          ],
    ),
    leadStatusTypeId: leadStatusTypes.flatMap((item) =>
      item.leadStatusTypeId == null
        ? []
        : [
            {
              value: String(item.leadStatusTypeId),
              label: item.name || `Lead status ${item.leadStatusTypeId}`,
            },
          ],
    ),
  };
  const [editingFirm, setEditingFirm] = useState<GetTaxFirmResponse | null>(
    null,
  );
  const [deletingFirm, setDeletingFirm] = useState<GetTaxFirmResponse | null>(
    null,
  );
  const { updateTaxFirm, isPending: isUpdating } = useUpdateTaxFirm({
    onSuccess: () => setEditingFirm(null),
  });
  const { deleteTaxFirm, isPending: isDeleting } = useDeleteTaxFirm({
    onSuccess: () => setDeletingFirm(null),
  });
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { isDirty, errors },
  } = useForm<EditTaxFirmFields>({
    mode: "onChange",
    defaultValues: defaultEditFirmValues,
  });

  // Only log when taxFirms actually has data
  useEffect(() => {
    console.log("taxFirms", taxFirms);
  }, [taxFirms]);

  const openEditDialog = (firm: GetTaxFirmResponse) => {
    reset(getEditFirmDefaults(firm));
    setEditingFirm(firm);
  };

  const submitFirmUpdate = (values: EditTaxFirmFields) => {
    if (!editingFirm?.taxFirmId) {
      return;
    }

    updateTaxFirm(
      editingFirm.taxFirmId,
      toUpdateTaxFirmRequest(values, editingFirm),
    );
  };

  const confirmFirmDelete = () => {
    if (deletingFirm?.taxFirmId) {
      deleteTaxFirm(deletingFirm.taxFirmId);
    }
  };

  return (
    <div className="space-y-8 min-h-full">
      {/* Welcome Header */}
      {/* <Card
        className=" border-0 rounded-lg text-white"
        style={{
          background: "linear-gradient(to bottom right, #33538f, #1e293b)",
        }}
      >
        <CardHeader>
          <CardTitle className="text-3xl text-white">
            Welcome back, {session?.user?.name || "User"}
          </CardTitle>
          <CardDescription className="text-blue-100 text-base">
            Here&apos;s what&apos;s happening with your practice today
          </CardDescription>
        </CardHeader>
      </Card> */}

      <Card className="container border-0 rounded-lg text-white p-3 grid grid-cols-2  lg:grid-cols-4 gap-3">
        <Link href="/crm/addTaxFirm" className="col-span-1">
          <Button className="w-full">Add Tax Firm</Button>
        </Link>
        <Link href="/crm/addContact" className="col-span-1">
          <Button className="w-full">Add a contact</Button>
        </Link>
        <Link href="/comingsoon" className="col-span-1">
          <Button className="w-full">Log an Activity</Button>
        </Link>
        <Link href="/comingsoon" className="col-span-1">
          <Button className="w-full">View Tax Firms</Button>
        </Link>
      </Card>

      {/* Stats Grid */}
      <div className="container  my-4 h-full rounded-lg border p-3 space-y-4 bg-white">
        <div className="grid p-3 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            return (
              <Card key={index} className="rounded-lg">
                <CardContent>
                  <CardDescription>{stat.title}</CardDescription>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {stat.value}
                  </p>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 mt-1 text-success hover:bg-green-100"
                  >
                    {stat.trend}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid w-full grid-cols-3 gap-2 space-x-2 ">
          <div className="col-span-2">
            <Input placeholder="Search" type="search" />
          </div>

          <div className="col-span-1">
            <Button className="w-full">Search</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                  Firm Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                  Client Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                  Contact Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-muted-foreground"
                  >
                    Loading tax firms...
                  </td>
                </tr>
              ) : taxFirms?.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-muted-foreground"
                  >
                    No tax firms added yet
                  </td>
                </tr>
              ) : (
                taxFirms.map((firm: GetTaxFirmResponse) => (
                  <tr key={firm.taxFirmId} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-foreground">
                          {firm.firmName}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {firm.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="secondary">{firm.mainPhoneNumber}</Badge>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-muted-foreground">
                      {firm.taxPersonClientCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-muted-foreground">
                      {firm.taxFirmContactCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        aria-label={`Edit ${firm.firmName || "tax firm"}`}
                        disabled={!firm.taxFirmId}
                        onClick={() => openEditDialog(firm)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        aria-label={`Delete ${firm.firmName || "tax firm"}`}
                        disabled={!firm.taxFirmId}
                        onClick={() => setDeletingFirm(firm)}
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
      </div>

      <Dialog
        open={Boolean(editingFirm)}
        onOpenChange={(open) => {
          if (!open && !isUpdating) {
            setEditingFirm(null);
          }
        }}
      >
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
                      name === "leadStatusTypeId" ||
                      name === "leadSource" ? (
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
                                  isUpdating ||
                                  (name !== "leadSource" &&
                                    (lookupLoading || Boolean(lookupError)))
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
                                  {(name === "credentialTypeId" ||
                                    name === "leadSource") && (
                                    <SelectItem value={null}>
                                      {name === "credentialTypeId"
                                        ? "No credentials"
                                        : "No lead source"}
                                    </SelectItem>
                                  )}
                                  {lookupLoading && name !== "leadSource" ? (
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
                          lettersOnly={name === "firmName"}
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
                onClick={() => setEditingFirm(null)}
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

      <Dialog
        open={Boolean(deletingFirm)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeletingFirm(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete tax firm?</DialogTitle>
            <DialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-destructive">
                {deletingFirm?.firmName || "this tax firm"}
              </span>
              . Related clients, contacts, and activity records may also be
              deleted. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingFirm(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmFirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete tax firm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Actions */}
      {/* <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 bg-amber-200 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
            return (
              <Link key={index} href={action.href}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-primary group-hover:translate-x-1 transition">
                      <span className="text-sm font-medium">Get Started</span>
                      <ArrowRight size={16} className="ml-2" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
       
        </div>
      </div> */}

      {/* Recent Cases */}
      {/* <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Recent Cases</h2>
          <Link
            href="/workpool"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            View All →
          </Link>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentCases.map((caseItem) => (
                  <tr key={caseItem.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-foreground">
                          {caseItem.client}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {caseItem.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStageVariant(caseItem.stage)}>
                        {caseItem.stage}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusVariant(caseItem.status)}>
                        {caseItem.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        View →
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div> */}

      {/* Team Activity */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> */}
      {/* Team Members */}
      {/* <Card>
          <CardHeader>
            <CardTitle>Team Members Online</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamMembers.map((member, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{member.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.role}
                    </p>
                  </div>
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${
                    member.status === "online" ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
              </div>
            ))}
          </CardContent>
        </Card> */}

      {/* Upcoming Deadlines */}
      {/* <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingDeadlines.map((deadline, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{deadline.task}</p>
                  <p className="text-sm text-muted-foreground">
                    {deadline.date}
                  </p>
                </div>
                <Badge
                  variant={deadline.daysLeft <= 5 ? "destructive" : "secondary"}
                  className="flex-shrink-0"
                >
                  {deadline.daysLeft}d
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div> */}
    </div>
  );
}
