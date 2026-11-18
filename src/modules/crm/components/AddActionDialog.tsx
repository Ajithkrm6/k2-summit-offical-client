"use client";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import type {
  CreateLogActivityRequest,
  CreateTaxFirmContactRequest,
} from "@/lib/api/generated/k2-tax-api/k2TaxAPI.schemas";
import type { LookupOption } from "@/modules/crm/components/TaxFirmDialogs";
import {
  type CreateContactFormData,
  type CreateLogActivityFormData,
  type CreateTaxClientFormData,
  createContactSchema,
  createLogActivitySchema,
  createTaxClientSchema,
} from "@/modules/crm/lib";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
  useForm,
} from "react-hook-form";

// ============================================================================
// Add Tax Client Dialog
// ============================================================================

export interface AddTaxClientDialogProps {
  /** Firm the new client belongs to. Injected into the form automatically. */
  firmId: string;
  open: boolean;
  contactMethodOptions: LookupOption[];
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaxClientFormData) => void;
}

export const CLIENT_STATUS_OPTIONS: LookupOption[] = [
  { value: "new", label: "New" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const FILING_STATUS_OPTIONS: LookupOption[] = [
  { value: "single", label: "Single" },
  { value: "married_filing_jointly", label: "Married Filing Jointly" },
  { value: "married_filing_separately", label: "Married Filing Separately" },
  { value: "head_of_household", label: "Head of Household" },
  { value: "qualifying_widow", label: "Qualifying Widow(er)" },
];

const getTaxYearOptions = (): LookupOption[] =>
  Array.from({ length: 5 }, (_, i) => {
    const year = String(new Date().getFullYear() - i);
    return { value: year, label: year };
  });

const getAddTaxClientDefaults = (firmId: string): CreateTaxClientFormData => ({
  firmId,
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
  preferredContactMethod: "",
  numberOfDependents: "0",
  priorYearAGI: "",
  notes: "",
});

export const AddTaxClientDialog = ({
  firmId,
  open,
  contactMethodOptions,
  isSubmitting = false,
  onClose,
  onSubmit,
}: AddTaxClientDialogProps) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateTaxClientFormData>({
    resolver: zodResolver(createTaxClientSchema),
    mode: "onChange",
    defaultValues: getAddTaxClientDefaults(firmId),
  });

  // Start with a clean form (and the latest firmId) every time the dialog opens.
  useEffect(() => {
    if (open) reset(getAddTaxClientDefaults(firmId));
  }, [open, firmId, reset]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
        showCloseButton={!isSubmitting}
      >
        <DialogHeader>
          <DialogTitle>Add tax client</DialogTitle>
          <DialogDescription>
            Fields marked <span className="text-red-500">*</span> are required.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4"
        >
          {/* firmId comes from props, so it is never typed by the user */}
          <input type="hidden" {...register("firmId")} />

          <fieldset disabled={isSubmitting} className="space-y-4">
            <h3 className="text-sm font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-client-taxYear">
                  Tax Year <span className="text-red-500">*</span>
                </Label>
                <StringSelect
                  id="add-client-taxYear"
                  name="taxYear"
                  control={control}
                  options={getTaxYearOptions()}
                  invalid={!!errors.taxYear}
                />
                {errors.taxYear && (
                  <p role="alert" className="text-red-500 text-sm">
                    {errors.taxYear.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-client-clientStatus">Client Status</Label>
                <StringSelect
                  id="add-client-clientStatus"
                  name="clientStatus"
                  control={control}
                  options={CLIENT_STATUS_OPTIONS}
                  invalid={!!errors.clientStatus}
                />
                {errors.clientStatus && (
                  <p role="alert" className="text-red-500 text-sm">
                    {errors.clientStatus.message}
                  </p>
                )}
              </div>
            </div>

            <h3 className="text-sm font-semibold border-t pt-4">
              Taxpayer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-client-firstName">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="add-client-firstName"
                  {...register("taxpayerFirstName")}
                  aria-invalid={!!errors.taxpayerFirstName}
                />
                {errors.taxpayerFirstName && (
                  <p role="alert" className="text-red-500 text-sm">
                    {errors.taxpayerFirstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-client-lastName">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="add-client-lastName"
                  {...register("taxpayerLastName")}
                  aria-invalid={!!errors.taxpayerLastName}
                />
                {errors.taxpayerLastName && (
                  <p role="alert" className="text-red-500 text-sm">
                    {errors.taxpayerLastName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-client-ssn">
                  SSN <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="add-client-ssn"
                  ssnFormat
                  placeholder="123-45-6789"
                  {...register("taxpayerSSN")}
                  aria-invalid={!!errors.taxpayerSSN}
                />
                {errors.taxpayerSSN && (
                  <p role="alert" className="text-red-500 text-sm">
                    {errors.taxpayerSSN.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-client-dob">Date of Birth</Label>
                <Input
                  id="add-client-dob"
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  {...register("taxpayerDOB")}
                  aria-invalid={!!errors.taxpayerDOB}
                />
                {errors.taxpayerDOB && (
                  <p role="alert" className="text-red-500 text-sm">
                    {errors.taxpayerDOB.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-client-occupation">Occupation</Label>
                <Input
                  id="add-client-occupation"
                  placeholder="Software Engineer"
                  {...register("taxpayerOccupation")}
                  aria-invalid={!!errors.taxpayerOccupation}
                />
                {errors.taxpayerOccupation && (
                  <p role="alert" className="text-red-500 text-sm">
                    {errors.taxpayerOccupation.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-client-filingStatus">Filing Status</Label>
                <StringSelect
                  id="add-client-filingStatus"
                  name="filingStatus"
                  control={control}
                  options={FILING_STATUS_OPTIONS}
                  invalid={!!errors.filingStatus}
                />
                {errors.filingStatus && (
                  <p role="alert" className="text-red-500 text-sm">
                    {errors.filingStatus.message}
                  </p>
                )}
              </div>
            </div>

            <h3 className="text-sm font-semibold border-t pt-4">
              Contact Information
            </h3>
            <div className="space-y-2">
              <Label htmlFor="add-client-address">Mailing Address</Label>
              <Textarea
                id="add-client-address"
                rows={2}
                placeholder="123 Main Street, City, State, ZIP"
                {...register("mailingAddress")}
                aria-invalid={!!errors.mailingAddress}
              />
              {errors.mailingAddress && (
                <p role="alert" className="text-red-500 text-sm">
                  {errors.mailingAddress.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-client-phone">Phone Number</Label>
                <Input
                  id="add-client-phone"
                  type="tel"
                  placeholder="+15551234567"
                  {...register("phoneNumber")}
                  aria-invalid={!!errors.phoneNumber}
                />
                {errors.phoneNumber && (
                  <p role="alert" className="text-red-500 text-sm">
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-client-email">Email</Label>
                <Input
                  id="add-client-email"
                  type="email"
                  placeholder="john@example.com"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p role="alert" className="text-red-500 text-sm">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-client-contactMethod">
                  Preferred Contact Method
                </Label>
                <StringSelect
                  id="add-client-contactMethod"
                  name="preferredContactMethod"
                  control={control}
                  options={contactMethodOptions}
                  invalid={!!errors.preferredContactMethod}
                />
                {errors.preferredContactMethod && (
                  <p role="alert" className="text-red-500 text-sm">
                    {errors.preferredContactMethod.message}
                  </p>
                )}
              </div>
            </div>

            <h3 className="text-sm font-semibold border-t pt-4">
              Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-client-dependents">
                  Number of Dependents
                </Label>
                <Input
                  id="add-client-dependents"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register("numberOfDependents")}
                  aria-invalid={!!errors.numberOfDependents}
                />
                {errors.numberOfDependents && (
                  <p role="alert" className="text-red-500 text-sm">
                    {errors.numberOfDependents.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-client-agi">Prior Year AGI</Label>
                <Input
                  id="add-client-agi"
                  type="number"
                  placeholder="0"
                  {...register("priorYearAGI")}
                  aria-invalid={!!errors.priorYearAGI}
                />
                {errors.priorYearAGI && (
                  <p role="alert" className="text-red-500 text-sm">
                    {errors.priorYearAGI.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-client-notes">Notes</Label>
              <Textarea
                id="add-client-notes"
                rows={3}
                placeholder="Any additional notes..."
                {...register("notes")}
                aria-invalid={!!errors.notes}
              />
              {errors.notes && (
                <p role="alert" className="text-red-500 text-sm">
                  {errors.notes.message}
                </p>
              )}
            </div>
          </fieldset>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !firmId}>
              {isSubmitting ? "Adding..." : "Add Tax Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// Add Contact Dialog
// ============================================================================

export interface AddContactDialogProps {
  firmId: string;
  open: boolean;
  roleOptions: LookupOption[];
  contactMethodOptions: LookupOption[];
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (data: CreateContactFormData) => void;
}

const getAddContactDefaults = (firmId: string): CreateContactFormData => ({
  firmId,
  firstName: "",
  lastName: "",
  // Left undefined so zod shows "Please select ..." until the user picks one.
  roleTitleTypeId: undefined as unknown as number,
  preferredContactMethodTypeId: undefined as unknown as number,
  phoneNumber: "",
  cellPhone: "",
  email: "",
  bestTimeToReach: "",
  isPrimaryContact: false,
  notes: "",
});

/** Converts the dialog's form values into the API request body. */
export const toCreateContactRequest = (
  data: CreateContactFormData,
): CreateTaxFirmContactRequest => ({
  firstName: data.firstName,
  lastName: data.lastName,
  roleTitleTypeId: data.roleTitleTypeId,
  preferredContactMethodTypeId: data.preferredContactMethodTypeId,
  phoneNumber: data.phoneNumber || null,
  cellPhone: data.cellPhone || null,
  email: data.email || null,
  bestTimeToReach: data.bestTimeToReach || null,
  isPrimaryContact: data.isPrimaryContact ?? false,
  notes: data.notes || null,
});

export const AddContactDialog = ({
  firmId,
  open,
  roleOptions,
  contactMethodOptions,
  isSubmitting = false,
  onClose,
  onSubmit,
}: AddContactDialogProps) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateContactFormData>({
    resolver: zodResolver(createContactSchema),
    mode: "onChange",
    defaultValues: getAddContactDefaults(firmId),
  });

  useEffect(() => {
    if (open) reset(getAddContactDefaults(firmId));
  }, [open, firmId, reset]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
        showCloseButton={!isSubmitting}
      >
        <DialogHeader>
          <DialogTitle>Add contact</DialogTitle>
          <DialogDescription>
            Fields marked <span className="text-red-500">*</span> are required.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4"
        >
          <input type="hidden" {...register("firmId")} />

          <fieldset disabled={isSubmitting} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-contact-firstName">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="add-contact-firstName"
                  {...register("firstName")}
                  aria-invalid={!!errors.firstName}
                />
                {errors.firstName && (
                  <p role="alert" className="text-red-500 text-sm">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-contact-lastName">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="add-contact-lastName"
                  {...register("lastName")}
                  aria-invalid={!!errors.lastName}
                />
                {errors.lastName && (
                  <p role="alert" className="text-red-500 text-sm">
                    {errors.lastName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-contact-role">
                  Role / Title <span className="text-red-500">*</span>
                </Label>
                <NumberSelect
                  id="add-contact-role"
                  name="roleTitleTypeId"
                  control={control}
                  options={roleOptions}
                  invalid={!!errors.roleTitleTypeId}
                />
                {errors.roleTitleTypeId && (
                  <p role="alert" className="text-red-500 text-sm">
                    {errors.roleTitleTypeId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-contact-method">
                  Preferred Contact Method{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <NumberSelect
                  id="add-contact-method"
                  name="preferredContactMethodTypeId"
                  control={control}
                  options={contactMethodOptions}
                  invalid={!!errors.preferredContactMethodTypeId}
                />
                {errors.preferredContactMethodTypeId && (
                  <p role="alert" className="text-red-500 text-sm">
                    {errors.preferredContactMethodTypeId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-contact-phone">Phone Number</Label>
                <Input
                  id="add-contact-phone"
                  type="tel"
                  placeholder="+15551234567"
                  {...register("phoneNumber")}
                  aria-invalid={!!errors.phoneNumber}
                />
                {errors.phoneNumber && (
                  <p role="alert" className="text-red-500 text-sm">
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-contact-cell">Cell Phone</Label>
                <Input
                  id="add-contact-cell"
                  type="tel"
                  placeholder="+15551234567"
                  {...register("cellPhone")}
                  aria-invalid={!!errors.cellPhone}
                />
                {errors.cellPhone && (
                  <p role="alert" className="text-red-500 text-sm">
                    {errors.cellPhone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-contact-email">Email</Label>
                <Input
                  id="add-contact-email"
                  type="email"
                  placeholder="john@example.com"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p role="alert" className="text-red-500 text-sm">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-contact-bestTime">Best Time to Reach</Label>
                <Input
                  id="add-contact-bestTime"
                  placeholder="Weekdays 9am - 12pm"
                  {...register("bestTimeToReach")}
                  aria-invalid={!!errors.bestTimeToReach}
                />
                {errors.bestTimeToReach && (
                  <p role="alert" className="text-red-500 text-sm">
                    {errors.bestTimeToReach.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Controller
                name="isPrimaryContact"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="add-contact-primary"
                    checked={field.value ?? false}
                    onCheckedChange={(checked) => field.onChange(!!checked)}
                  />
                )}
              />
              <Label htmlFor="add-contact-primary" className="cursor-pointer">
                Primary Contact
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-contact-notes">Notes</Label>
              <Textarea
                id="add-contact-notes"
                rows={3}
                {...register("notes")}
                aria-invalid={!!errors.notes}
              />
              {errors.notes && (
                <p role="alert" className="text-red-500 text-sm">
                  {errors.notes.message}
                </p>
              )}
            </div>
          </fieldset>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !firmId}>
              {isSubmitting ? "Adding..." : "Add Contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// Add Activity Dialog
// ============================================================================

export interface AddActivityDialogProps {
  firmId: string;
  open: boolean;
  activityTypeOptions: LookupOption[];
  /** The firm's contacts, so the activity can be linked to one (optional). */
  contactOptions: LookupOption[];
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLogActivityFormData) => void;
}

const getAddActivityDefaults = (firmId: string): CreateLogActivityFormData => ({
  firmId,
  contactId: "",
  activityDate: new Date().toISOString().split("T")[0],
  activityTime: "09:00",
  activityTypeId: undefined as unknown as number,
  summary: "",
  outcome: "",
  nextFollowUpDate: "",
  nextFollowUpTime: "",
  loggedBy: "",
});

/** Combines the separate date + time inputs into the ISO strings the API expects. */
export const toCreateLogActivityRequest = (
  data: CreateLogActivityFormData,
): CreateLogActivityRequest => ({
  activityDate: new Date(
    `${data.activityDate}T${data.activityTime}:00`,
  ).toISOString(),
  activityTypeId: data.activityTypeId,
  summary: data.summary,
  outcome: data.outcome || null,
  nextFollowUpDate:
    data.nextFollowUpDate && data.nextFollowUpTime
      ? new Date(
          `${data.nextFollowUpDate}T${data.nextFollowUpTime}:00`,
        ).toISOString()
      : null,
});

export const AddActivityDialog = ({
  firmId,
  open,
  activityTypeOptions,
  contactOptions,
  isSubmitting = false,
  onClose,
  onSubmit,
}: AddActivityDialogProps) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateLogActivityFormData>({
    resolver: zodResolver(createLogActivitySchema),
    mode: "onChange",
    defaultValues: getAddActivityDefaults(firmId),
  });

  useEffect(() => {
    if (open) reset(getAddActivityDefaults(firmId));
  }, [open, firmId, reset]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
        showCloseButton={!isSubmitting}
      >
        <DialogHeader>
          <DialogTitle>Log activity</DialogTitle>
          <DialogDescription>
            Fields marked <span className="text-red-500">*</span> are required.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4"
        >
          <input type="hidden" {...register("firmId")} />

          <fieldset disabled={isSubmitting} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-activity-contact">Contact</Label>
                <StringSelect
                  id="add-activity-contact"
                  name="contactId"
                  control={control}
                  options={contactOptions}
                  emptyLabel="No contacts available"
                  invalid={!!errors.contactId}
                />
                {errors.contactId && (
                  <p role="alert" className="text-red-500 text-sm">
                    {errors.contactId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-activity-type">
                  Activity Type <span className="text-red-500">*</span>
                </Label>
                <NumberSelect
                  id="add-activity-type"
                  name="activityTypeId"
                  control={control}
                  options={activityTypeOptions}
                  invalid={!!errors.activityTypeId}
                />
                {errors.activityTypeId && (
                  <p role="alert" className="text-red-500 text-sm">
                    {errors.activityTypeId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-activity-loggedBy">
                  Logged By <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="add-activity-loggedBy"
                  placeholder="Enter your name"
                  {...register("loggedBy")}
                  aria-invalid={!!errors.loggedBy}
                />
                {errors.loggedBy && (
                  <p role="alert" className="text-red-500 text-sm">
                    {errors.loggedBy.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-activity-date">
                  Activity Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="add-activity-date"
                  type="date"
                  {...register("activityDate")}
                  aria-invalid={!!errors.activityDate}
                />
                {errors.activityDate && (
                  <p role="alert" className="text-red-500 text-sm">
                    {errors.activityDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-activity-time">
                  Activity Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="add-activity-time"
                  type="time"
                  {...register("activityTime")}
                  aria-invalid={!!errors.activityTime}
                />
                {errors.activityTime && (
                  <p role="alert" className="text-red-500 text-sm">
                    {errors.activityTime.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-activity-followUpDate">
                  Next Follow-up Date
                </Label>
                <Input
                  id="add-activity-followUpDate"
                  type="date"
                  {...register("nextFollowUpDate")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-activity-followUpTime">
                  Next Follow-up Time
                </Label>
                <Input
                  id="add-activity-followUpTime"
                  type="time"
                  {...register("nextFollowUpTime")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-activity-summary">
                Summary <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="add-activity-summary"
                rows={3}
                {...register("summary")}
                aria-invalid={!!errors.summary}
              />
              {errors.summary && (
                <p role="alert" className="text-red-500 text-sm">
                  {errors.summary.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-activity-outcome">Outcome</Label>
              <Textarea
                id="add-activity-outcome"
                rows={2}
                {...register("outcome")}
                aria-invalid={!!errors.outcome}
              />
              {errors.outcome && (
                <p role="alert" className="text-red-500 text-sm">
                  {errors.outcome.message}
                </p>
              )}
            </div>
          </fieldset>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !firmId}>
              {isSubmitting ? "Saving..." : "Log Activity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// Shared: Select bound to a string form field (e.g. tax year, filing status).
// ============================================================================

interface StringSelectProps<T extends FieldValues> {
  id: string;
  name: FieldPath<T>;
  control: Control<T>;
  options: LookupOption[];
  invalid?: boolean;
  emptyLabel?: string;
}

const StringSelect = <T extends FieldValues>({
  id,
  name,
  control,
  options,
  invalid,
  emptyLabel = "No options available",
}: StringSelectProps<T>) => (
  <Controller
    name={name}
    control={control}
    render={({ field }) => {
      const value = (field.value as string | null | undefined) ?? "";
      const label = options.find((opt) => opt.value === value)?.label;
      return (
        <Select
          value={value}
          onValueChange={(next) => field.onChange(next ?? "")}
        >
          <SelectTrigger
            id={id}
            className="w-full"
            aria-invalid={invalid}
            onBlur={field.onBlur}
          >
            <SelectValue placeholder="Select...">
              {label ?? "Select..."}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.length === 0 ? (
              <SelectItem value="empty" disabled>
                {emptyLabel}
              </SelectItem>
            ) : (
              options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      );
    }}
  />
);

// ============================================================================
// Shared: Select bound to a numeric form field (lookup IDs are numbers in the
// schema, but Select only works with strings).
// ============================================================================

interface NumberSelectProps<T extends FieldValues> {
  id: string;
  name: FieldPath<T>;
  control: Control<T>;
  options: LookupOption[];
  invalid?: boolean;
}

const NumberSelect = <T extends FieldValues>({
  id,
  name,
  control,
  options,
  invalid,
}: NumberSelectProps<T>) => (
  <Controller
    name={name}
    control={control}
    render={({ field }) => {
      const value = field.value == null ? "" : String(field.value);
      const label = options.find((opt) => opt.value === value)?.label;
      return (
        <Select
          value={value}
          onValueChange={(next) =>
            field.onChange(next ? Number(next) : undefined)
          }
        >
          <SelectTrigger id={id} className="w-full" aria-invalid={invalid}>
            <SelectValue placeholder="Select...">
              {label ?? "Select..."}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.length === 0 ? (
              <SelectItem value="empty" disabled>
                No options available
              </SelectItem>
            ) : (
              options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      );
    }}
  />
);
