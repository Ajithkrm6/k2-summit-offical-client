import * as z from "zod";

/**
 * CRM Module Schemas
 * Zod validation schemas for Tax Firm operations
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
export type UpdateTaxFirmFormData = z.infer<typeof updateTaxFirmSchema>;
export type GetTaxFirmData = z.infer<typeof getTaxFirmSchema>;
