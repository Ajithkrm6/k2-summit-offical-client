import * as z from "zod";

const personNameSchema = (label: string) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .regex(/^[A-Za-z ]*$/, `${label} must contain only letters and spaces`);

const pastDateSchema = (label: string) =>
  z
    .union([z.literal(""), z.string().date()])
    .refine((value) => {
      if (!value) return true;
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date <= today;
    }, `${label} cannot be in the future`)
    .optional();

export const phoneNumberSchema = z
  .string()
  .refine(
    (value) =>
      value === "" || (value.length === 12 && /^\+1[0-9]{10}$/.test(value)),
    "Enter +1 followed by exactly 10 digits (e.g. +15551234567)",
  );

/**
 * CRM Module Schemas
 * Zod validation schemas for CRM forms
 */

// ============================================================================
// Tax Firm Schemas
// ============================================================================

export const createTaxFirmSchema = z.object({
  leadStatusTypeId: z.number({ error: "Lead status is required" }).int(),
  firmTypeId: z.number({ error: "Firm type is required" }).int(),
  credentialTypeId: z.number().int().nullable().optional(),
  firmName: personNameSchema("Firm name")
    .min(1, "Firm name is required")
    .max(255, "Firm name cannot exceed 255 characters"),
  address: z
    .string()
    .max(500, "Address cannot exceed 500 characters")
    .nullable()
    .optional(),
  mainPhoneNumber: phoneNumberSchema.nullable().optional(),
  websiteUrl: z
    .string()
    .refine((url) => {
      if (!url) return true; // Allow empty strings (optional field)
      try {
        new URL(url.startsWith("http") ? url : `https://${url}`);
        return true;
      } catch {
        return false;
      }
    }, "Invalid URL - must be a valid website address")
    .nullable()
    .optional(),
  numberOfOffices: z.coerce
    .number()
    .int()
    .min(0, "Number of offices cannot be negative")
    .nullable()
    .optional(),
  numberOfTaxClients: z.coerce
    .number()
    .int()
    .min(0, "Number of tax clients cannot be negative")
    .nullable()
    .optional(),
  estimatedAnnualRevenue: z.coerce
    .number()
    .min(0, "Estimated annual revenue cannot be negative")
    .nullable()
    .optional(),
  employeeCount: z.coerce
    .number()
    .int()
    .min(0, "Employee count cannot be negative")
    .nullable()
    .optional(),
  servicesOffered: z.string().nullable().optional(),
  currentSoftware: z
    .string()
    .max(500, "Current software cannot exceed 500 characters")
    .nullable()
    .optional(),
  competitorInUse: z
    .string()
    .max(500, "Competitor cannot exceed 500 characters")
    .nullable()
    .optional(),
  referralSource: z
    .string()
    .max(500, "Referral source cannot exceed 500 characters")
    .nullable()
    .optional(),
  leadSource: z
    .string()
    .max(500, "Lead source cannot exceed 500 characters")
    .nullable()
    .optional(),
  potentialDealSize: z.coerce
    .number()
    .min(0, "Potential deal size cannot be negative")
    .nullable()
    .optional(),
  notes: z
    .string()
    .max(1000, "Notes cannot exceed 1000 characters")
    .nullable()
    .optional(),
});

// ============================================================================
// Tax Firm Contact Schemas
// ============================================================================

export const createContactSchema = z.object({
  firmId: z.string().min(1, "Please select a firm"),
  firstName: personNameSchema("First name")
    .min(1, "First name is required")
    .max(255, "First name cannot exceed 255 characters"),
  lastName: personNameSchema("Last name")
    .min(1, "Last name is required")
    .max(255, "Last name cannot exceed 255 characters"),
  roleTitleTypeId: z
    .number({ error: "Please select a role / title" })
    .int()
    .positive("Please select a role / title"),
  phoneNumber: phoneNumberSchema.nullable().optional(),
  cellPhone: phoneNumberSchema.nullable().optional(),
  email: z
    .union([z.literal(""), z.string().email("Invalid email address")])
    .nullable()
    .optional(),
  preferredContactMethodTypeId: z
    .number({ error: "Please select a preferred contact method" })
    .int()
    .positive("Please select a preferred contact method"),
  bestTimeToReach: z
    .string()
    .max(500, "Best time to reach cannot exceed 500 characters")
    .nullable()
    .optional(),
  isPrimaryContact: z.boolean().optional(),
  notes: z
    .string()
    .max(1000, "Notes cannot exceed 1000 characters")
    .nullable()
    .optional(),
});

// ============================================================================
// Tax Client Schemas
// ============================================================================

export const editContactSchema = createContactSchema.omit({
  firmId: true,
  bestTimeToReach: true,
});
export type EditContactFormData = z.infer<typeof editContactSchema>;

export const createTaxClientSchema = z.object({
  firmId: z.string().min(1, "Firm is required"),
  taxYear: z
    .string()
    .min(1, "Tax year is required")
    .regex(/^\d{4}$/, "Tax year must be a four-digit year"),
  clientStatus: z.string().optional(),
  taxpayerFirstName: personNameSchema("First name").min(
    1,
    "First name is required",
  ),
  taxpayerLastName: personNameSchema("Last name").min(
    1,
    "Last name is required",
  ),
  taxpayerSSN: z
    .string()
    .min(1, "SSN is required")
    .regex(/^\d{3}-\d{2}-\d{4}$/, "SSN must be in format XXX-XX-XXXX"),
  taxpayerDOB: pastDateSchema("Date of birth"),
  taxpayerOccupation: z.string().optional(),
  spouseFirstName: personNameSchema("Spouse first name").optional(),
  spouseLastName: personNameSchema("Spouse last name").optional(),
  spouseSsn: z
    .union([
      z.literal(""),
      z
        .string()
        .regex(/^\d{3}-\d{2}-\d{4}$/, "SSN must be in format XXX-XX-XXXX"),
    ])
    .optional(),
  spouseDob: pastDateSchema("Spouse date of birth"),
  spouseOccupation: z.string().optional(),
  filingStatus: z.string().optional(),
  mailingAddress: z.string().optional(),
  phoneNumber: phoneNumberSchema.optional(),
  email: z.union([z.literal(""), z.email("Invalid email address")]).optional(),
  numberOfDependents: z
    .string()
    .regex(/^\d*$/, "Number of dependents must be a non-negative integer")
    .optional(),
  priorYearAGI: z
    .string()
    .refine(
      (value) =>
        value === "" || (value.trim() !== "" && Number.isFinite(Number(value))),
      "Prior year AGI must be a number",
    )
    .optional(),
  preferredContactMethod: z
    .string()
    .regex(/^$|^[1-9]\d*$/, "Invalid contact method")
    .optional(),
  notes: z.string().optional(),
});

// ============================================================================
// Document Upload Schemas
// ============================================================================

export const editTaxClientSchema = createTaxClientSchema.pick({
  taxpayerFirstName: true,
  taxpayerLastName: true,
  taxYear: true,
  taxpayerSSN: true,
  taxpayerDOB: true,
  mailingAddress: true,
  phoneNumber: true,
  email: true,
});
export type EditTaxClientFormData = z.infer<typeof editTaxClientSchema>;

export const uploadDocumentsSchema = z.object({
  taxPersonClientId: z.string().min(1, "Client is required"),
  taxYear: z
    .number()
    .int()
    .min(1900, "Invalid tax year")
    .max(new Date().getFullYear() + 1, "Tax year cannot be in the future"),
  formType: z.string().min(1, "Document type is required"),
});

export const updateTaxFirmSchema = createTaxFirmSchema;

export const getTaxFirmSchema = createTaxFirmSchema.extend({
  taxFirmId: z.string().nullable().optional(),
  currentSoftware: z.string().nullable().optional(),
  competitorInUse: z.string().nullable().optional(),
  leadSource: z.string().nullable().optional(),
  referralSource: z.string().nullable().optional(),
  potentialDealSize: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

// ============================================================================
// Form Data Types (inferred from schemas)
// ============================================================================

export type CreateTaxFirmFormData = z.infer<typeof createTaxFirmSchema>;
export type CreateContactFormData = z.infer<typeof createContactSchema>;
export type CreateTaxClientFormData = z.infer<typeof createTaxClientSchema>;
export type UpdateTaxFirmFormData = z.infer<typeof updateTaxFirmSchema>;
export type GetTaxFirmData = z.infer<typeof getTaxFirmSchema>;
export type UploadDocumentsFormData = z.infer<typeof uploadDocumentsSchema>;
