import * as z from "zod";

/**
 * CRM Module Schemas
 * Zod validation schemas for Tax Firm and Document operations
 */

// ============================================================================
// Tax Firm Schemas
// ============================================================================

export const createTaxFirmSchema = z.object({
  leadStatusTypeId: z.number().int().optional(),
  firmTypeId: z.number().int().optional(),
  credentialTypeId: z.number().int().nullable().optional(),
  firmName: z
    .string()
    .min(1, "Firm name is required")
    .max(255, "Firm name cannot exceed 255 characters")
    .nullable()
    .optional(),
  address: z
    .string()
    .max(500, "Address cannot exceed 500 characters")
    .nullable()
    .optional(),
  mainPhoneNumber: z
    .string()
    .regex(/^[\d\-\+\(\)\s]*$/, "Invalid phone number")
    .nullable()
    .optional(),
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
  servicesOffered: z.boolean().optional(),
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
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(255, "First name cannot exceed 255 characters")
    .nullable()
    .optional(),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(255, "Last name cannot exceed 255 characters")
    .nullable()
    .optional(),
  roleTitleTypeId: z.number().int().optional(),
  phoneNumber: z
    .string()
    .regex(/^[\d\-\+\(\)\s]*$/, "Invalid phone number")
    .nullable()
    .optional(),
  cellPhone: z
    .string()
    .regex(/^[\d\-\+\(\)\s]*$/, "Invalid cell phone")
    .nullable()
    .optional(),
  email: z.string().email("Invalid email address").nullable().optional(),
  preferredContactMethodTypeId: z.number().int().nullable().optional(),
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
// Document Upload Schemas
// ============================================================================

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
export type UpdateTaxFirmFormData = z.infer<typeof updateTaxFirmSchema>;
export type GetTaxFirmData = z.infer<typeof getTaxFirmSchema>;
export type UploadDocumentsFormData = z.infer<typeof uploadDocumentsSchema>;
