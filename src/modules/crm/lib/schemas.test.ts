import { describe, expect, it } from "vitest";
import {
  createContactSchema,
  createTaxClientSchema,
  type CreateTaxClientFormData,
} from "./schemas";

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
  it("allows blank optional inputs", () => {
    expect(createTaxClientSchema.safeParse(validForm).success).toBe(true);
  });

  it("accepts populated contact and additional information", () => {
    expect(
      createTaxClientSchema.safeParse({
        ...validForm,
        taxpayerDOB: "1990-05-10",
        phoneNumber: "+1 (555) 123-4567",
        email: "jane@example.com",
        numberOfDependents: "2",
        priorYearAGI: "-1234.50",
        preferredContactMethod: "2",
      }).success,
    ).toBe(true);
  });

  it.each([
    ["firmId", ""],
    ["taxYear", ""],
    ["taxYear", "2026abc"],
    ["taxYear", "2026.5"],
    ["clientStatus", ""],
    ["taxpayerFirstName", "   "],
    ["taxpayerLastName", ""],
    ["taxpayerSSN", "123456789"],
    ["taxpayerDOB", "2026-02-30"],
    ["filingStatus", ""],
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
