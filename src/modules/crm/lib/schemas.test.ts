import { describe, expect, it } from "vitest";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createContactSchema,
  createTaxFirmSchema,
  createTaxClientSchema,
  phoneNumberSchema,
  updateTaxFirmSchema,
  type CreateTaxClientFormData,
} from "./schemas";

describe("createTaxFirmSchema", () => {
  const requiredFields = {
    firmName: "Example Firm",
    firmTypeId: 1,
    leadStatusTypeId: 1,
  };

  it.each([undefined, null, "", "   "])(
    "rejects a missing or blank firm name: %j",
    (firmName) => {
      const result = createTaxFirmSchema.safeParse({
        ...requiredFields,
        firmName,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.firmName).toEqual([
          "Firm name is required",
        ]);
      }
    },
  );

  it("allows optional fields to be omitted", () => {
    expect(createTaxFirmSchema.parse(requiredFields)).toEqual(requiredFields);
  });

  it("reports missing firm type and lead status", () => {
    const result = createTaxFirmSchema.safeParse({ firmName: "Example Firm" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors).toEqual({
        firmTypeId: ["Firm type is required"],
        leadStatusTypeId: ["Lead status is required"],
      });
    }
  });

  it("populates React Hook Form errors for an empty submission", async () => {
    const resolve = zodResolver(createTaxFirmSchema);
    const result = await resolve(
      { ...requiredFields, firmName: "" },
      undefined,
      {
        fields: {},
        shouldUseNativeValidation: false,
      },
    );
    expect(result.errors.firmName?.message).toBe("Firm name is required");
    expect(result.values).toEqual({});
  });
});

describe("createContactSchema", () => {
  const contact = {
    firmId: "firm-1",
    firstName: "Jane",
    lastName: "Doe",
    roleTitleTypeId: 1,
    preferredContactMethodTypeId: 2,
    email: "",
  };

  it("reports all required fields when submitting an empty form", () => {
    const result = createContactSchema.safeParse({
      firmId: "",
      firstName: "",
      lastName: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors).toEqual({
        firmId: ["Please select a firm"],
        firstName: ["First name is required"],
        lastName: ["Last name is required"],
        roleTitleTypeId: ["Please select a role / title"],
        preferredContactMethodTypeId: [
          "Please select a preferred contact method",
        ],
      });
    }
  });

  it("allows blank optional email and preserves the primary-contact boolean", () => {
    expect(
      createContactSchema.parse({ ...contact, isPrimaryContact: true }),
    ).toMatchObject({ email: "", isPrimaryContact: true });
  });

  it.each([
    ["firstName", "   "],
    ["lastName", "   "],
    ["roleTitleTypeId", undefined],
    ["preferredContactMethodTypeId", undefined],
    ["email", "invalid"],
    ["phoneNumber", "invalid"],
    ["cellPhone", "invalid"],
  ])("rejects invalid %s at the correct field path", (field, value) => {
    const result = createContactSchema.safeParse({
      ...contact,
      [field]: value,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === field)).toBe(
        true,
      );
    }
  });
});

const validForm: CreateTaxClientFormData = {
  firmId: "F0001",
  taxYear: "2026",
  clientStatus: "new",
  taxpayerFirstName: "Jane",
  taxpayerLastName: "Doe",
  taxpayerSSN: "123-45-6789",
  taxpayerDOB: "",
  taxpayerOccupation: "",
  filingStatus: "single",
  mailingAddress: "",
  phoneNumber: "",
  email: "",
  numberOfDependents: "0",
  priorYearAGI: "",
  preferredContactMethod: "",
  notes: "",
};

describe("createTaxClientSchema", () => {
  it("requires only backend-required client inputs", () => {
    expect(
      createTaxClientSchema.safeParse({
        firmId: "firm-1",
        taxYear: "2026",
        taxpayerFirstName: "Jane",
        taxpayerLastName: "Doe",
        taxpayerSSN: "123-45-6789",
      }).success,
    ).toBe(true);
  });

  it("reports all missing required client inputs together", () => {
    const result = createTaxClientSchema.safeParse({
      ...validForm,
      firmId: "",
      taxYear: "",
      taxpayerFirstName: "",
      taxpayerLastName: "",
      taxpayerSSN: "",
      clientStatus: "",
      filingStatus: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(result.error.flatten().fieldErrors).sort()).toEqual(
        [
          "firmId",
          "taxYear",
          "taxpayerFirstName",
          "taxpayerLastName",
          "taxpayerSSN",
        ].sort(),
      );
    }
  });
  it("allows blank optional inputs", () => {
    expect(createTaxClientSchema.safeParse(validForm).success).toBe(true);
  });

  it("accepts populated contact and additional information", () => {
    expect(
      createTaxClientSchema.safeParse({
        ...validForm,
        taxpayerDOB: "1990-05-10",
        phoneNumber: "+15551234567",
        email: "jane@example.com",
        numberOfDependents: "2",
        priorYearAGI: "-1234.50",
        preferredContactMethod: "2",
      }).success,
    ).toBe(true);
  });

  describe("CRM phone validation", () => {
    const phoneFields = [
      ["contact phone", createContactSchema.shape.phoneNumber],
      ["contact cell phone", createContactSchema.shape.cellPhone],
      ["tax-client phone", createTaxClientSchema.shape.phoneNumber],
      ["tax-firm phone", createTaxFirmSchema.shape.mainPhoneNumber],
      ["edit tax-firm phone", updateTaxFirmSchema.shape.mainPhoneNumber],
      ["dashboard phone", phoneNumberSchema],
    ] as const;

    it.each(phoneFields)(
      "accepts strict +1 numbers for %s",
      (_name, schema) => {
        expect(schema.safeParse("+15551234567").success).toBe(true);
        expect(schema.safeParse("").success).toBe(true);
      },
    );

    it.each(phoneFields)("rejects invalid formats for %s", (_name, schema) => {
      for (const value of [
        "5551234567",
        "15551234567",
        "+1555123456",
        "+155512345678",
        "+445551234567",
        "+1 (555) 123-4567",
        "+1 5551234567",
        "+1555123456a",
        " +15551234567",
        "+15551234567 ",
        "+15551234567\n",
        " ",
      ]) {
        const result = schema.safeParse(value);
        expect(result.success, value).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain(
            "+1 followed by exactly 10 digits",
          );
        }
      }
    });

    it("preserves nullable and omitted optional phone fields", () => {
      for (const schema of [
        createContactSchema.shape.phoneNumber,
        createContactSchema.shape.cellPhone,
        createTaxFirmSchema.shape.mainPhoneNumber,
      ]) {
        expect(schema.safeParse(null).success).toBe(true);
        expect(schema.safeParse(undefined).success).toBe(true);
      }
    });
  });

  it.each([
    ["firmId", ""],
    ["taxYear", ""],
    ["taxYear", "2026abc"],
    ["taxYear", "2026.5"],
    ["taxpayerFirstName", "   "],
    ["taxpayerLastName", ""],
    ["taxpayerSSN", "123456789"],
    ["taxpayerDOB", "2026-02-30"],
    ["spouseDob", "2026-02-30"],
    ["spouseSsn", "123456789"],
    ["phoneNumber", "not a phone"],
    ["email", "invalid"],
    ["numberOfDependents", "-1"],
    ["numberOfDependents", "1.5"],
    ["priorYearAGI", "not a number"],
    ["preferredContactMethod", "2abc"],
  ])("rejects invalid %s value %j at the field path", (field, value) => {
    const result = createTaxClientSchema.safeParse({
      ...validForm,
      [field]: value,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === field)).toBe(
        true,
      );
    }
  });
});
