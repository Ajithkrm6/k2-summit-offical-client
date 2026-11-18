import { describe, expect, it } from "vitest";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createContactSchema,
  createTaxFirmSchema,
  createTaxClientSchema,
  phoneNumberSchema,
  updateTaxFirmSchema,
  type CreateTaxClientFormData,
  editTaxClientSchema,
  editContactSchema,
} from "./schemas";

describe.each([
  ["contact first name", createContactSchema.shape.firstName],
  ["contact last name", createContactSchema.shape.lastName],
  ["edited contact first name", editContactSchema.shape.firstName],
  ["edited contact last name", editContactSchema.shape.lastName],
  ["taxpayer first name", createTaxClientSchema.shape.taxpayerFirstName],
  ["taxpayer last name", createTaxClientSchema.shape.taxpayerLastName],
  ["edited taxpayer first name", editTaxClientSchema.shape.taxpayerFirstName],
  ["edited taxpayer last name", editTaxClientSchema.shape.taxpayerLastName],
  ["spouse first name", createTaxClientSchema.shape.spouseFirstName],
  ["spouse last name", createTaxClientSchema.shape.spouseLastName],
] as const)("%s character validation", (_label, schema) => {
  it.each(["John", "mary", "MARY", "Mary Jane", " van der Berg "])(
    "accepts letters and spaces: %s",
    (value) => {
      expect(schema.safeParse(value).success).toBe(true);
    },
  );

  it.each([
    "John1",
    "123",
    "Anne-Marie",
    "O'Neil",
    "Jane@",
    "Jöhn",
    "Mary\tJane",
    "Mary\nJane",
  ])("rejects non-letter characters: %s", (value) => {
    const result = schema.safeParse(value);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain(
        "only letters and spaces",
      );
    }
  });
});

it("keeps spouse names optional and permits them to be cleared", () => {
  for (const schema of [
    createTaxClientSchema.shape.spouseFirstName,
    createTaxClientSchema.shape.spouseLastName,
  ]) {
    expect(schema.safeParse(undefined).success).toBe(true);
    expect(schema.safeParse("").success).toBe(true);
  }
});

it("restricts firm names to letters and spaces", () => {
  expect(
    createTaxFirmSchema.shape.firmName.safeParse("Tax & Accounting 123, LLC")
      .success,
  ).toBe(false);
  expect(
    createTaxFirmSchema.shape.firmName.safeParse("Example Tax Firm").success,
  ).toBe(true);
});

describe("editContactSchema", () => {
  it("validates contact edits without a new firm selection", () => {
    expect(
      editContactSchema.safeParse({
        firstName: "Jane",
        lastName: "Doe",
        roleTitleTypeId: 2,
        preferredContactMethodTypeId: 3,
        phoneNumber: "+15551234567",
        cellPhone: "",
        email: "",
        isPrimaryContact: false,
      }).success,
    ).toBe(true);
  });

  it("reports all required contact edit fields", () => {
    const result = editContactSchema.safeParse({ firstName: "", lastName: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors).toEqual({
        firstName: ["First name is required"],
        lastName: ["Last name is required"],
        roleTitleTypeId: ["Please select a role / title"],
        preferredContactMethodTypeId: [
          "Please select a preferred contact method",
        ],
      });
    }
  });
});

describe("editTaxClientSchema", () => {
  it("validates an edit without requiring a new firm selection", () => {
    expect(
      editTaxClientSchema.safeParse({
        taxpayerFirstName: "Jane",
        taxpayerLastName: "Doe",
        taxYear: "2026",
        taxpayerSSN: "123-45-6789",
        phoneNumber: "+15551234567",
      }).success,
    ).toBe(true);
  });

  it("reports required fields for a blank edit", () => {
    const result = editTaxClientSchema.safeParse({
      taxpayerFirstName: "",
      taxpayerLastName: "",
      taxYear: "",
      taxpayerSSN: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(result.error.flatten().fieldErrors).sort()).toEqual([
        "taxYear",
        "taxpayerFirstName",
        "taxpayerLastName",
        "taxpayerSSN",
      ]);
    }
  });
});

describe("createTaxFirmSchema", () => {
  const requiredFields = {
    firmName: "Example Firm",
    firmTypeId: 1,
    leadStatusTypeId: 1,
    mainPhoneNumber: "+15551234567",
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
    const result = createTaxFirmSchema.safeParse({
      firmName: "Example Firm",
      mainPhoneNumber: requiredFields.mainPhoneNumber,
    });
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

  it.each([undefined, null, "", "   ", "+1", "+1555"])(
    "rejects a missing, blank, or incomplete main phone number: %j",
    (mainPhoneNumber) => {
      const result = createTaxFirmSchema.safeParse({
        ...requiredFields,
        mainPhoneNumber,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some(
            (issue) => issue.path[0] === "mainPhoneNumber",
          ),
        ).toBe(true);
      }
    },
  );

  it("populates the main phone error on an empty form submission", async () => {
    const resolve = zodResolver(createTaxFirmSchema);
    const result = await resolve(
      { ...requiredFields, firmName: "", mainPhoneNumber: "" },
      undefined,
      { fields: {}, shouldUseNativeValidation: false },
    );
    expect(result.errors.mainPhoneNumber?.message).toBe(
      "Main phone number is required",
    );
    expect(result.values).toEqual({});
  });

  it("keeps contact phone numbers optional", () => {
    expect(createContactSchema.shape.phoneNumber.safeParse("").success).toBe(
      true,
    );
    expect(createContactSchema.shape.cellPhone.safeParse("").success).toBe(
      true,
    );
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
        expect(schema.safeParse("").success).toBe(
          _name !== "tax-firm phone" && _name !== "edit tax-firm phone",
        );
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

describe("DOB validation", () => {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const oneMonthAgo = new Date(Date.now() - 2592000000)
    .toISOString()
    .split("T")[0];

  describe("taxpayerDOB", () => {
    const schema = createTaxClientSchema.shape.taxpayerDOB;

    it("accepts empty/undefined DOB", () => {
      expect(schema.safeParse("").success).toBe(true);
      expect(schema.safeParse(undefined).success).toBe(true);
    });

    it("accepts past dates", () => {
      expect(schema.safeParse(yesterday).success).toBe(true);
      expect(schema.safeParse(oneMonthAgo).success).toBe(true);
      expect(schema.safeParse("1990-05-10").success).toBe(true);
    });

    it("accepts today's date", () => {
      expect(schema.safeParse(today).success).toBe(true);
    });

    it("rejects future dates", () => {
      const result = schema.safeParse(tomorrow);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "cannot be in the future",
        );
      }
    });

    it("rejects invalid date formats", () => {
      expect(schema.safeParse("2026-02-30").success).toBe(false);
    });
  });

  describe("spouseDob", () => {
    const schema = createTaxClientSchema.shape.spouseDob;

    it("accepts empty/undefined spouse DOB", () => {
      expect(schema.safeParse("").success).toBe(true);
      expect(schema.safeParse(undefined).success).toBe(true);
    });

    it("accepts past dates", () => {
      expect(schema.safeParse(yesterday).success).toBe(true);
      expect(schema.safeParse("1985-03-20").success).toBe(true);
    });

    it("accepts today's date", () => {
      expect(schema.safeParse(today).success).toBe(true);
    });

    it("rejects future dates", () => {
      const result = schema.safeParse(tomorrow);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "cannot be in the future",
        );
      }
    });
  });

  describe("editTaxClientSchema DOB fields", () => {
    it("rejects taxpayerDOB as future date in edit", () => {
      const tomorrow = new Date(Date.now() + 86400000)
        .toISOString()
        .split("T")[0];
      const result = editTaxClientSchema.safeParse({
        taxpayerFirstName: "Jane",
        taxpayerLastName: "Doe",
        taxYear: "2026",
        taxpayerSSN: "123-45-6789",
        taxpayerDOB: tomorrow,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((issue) =>
            issue.message.includes("cannot be in the future"),
          ),
        ).toBe(true);
      }
    });

    it("accepts taxpayerDOB as past date in edit", () => {
      expect(
        editTaxClientSchema.safeParse({
          taxpayerFirstName: "Jane",
          taxpayerLastName: "Doe",
          taxYear: "2026",
          taxpayerSSN: "123-45-6789",
          taxpayerDOB: "1990-05-10",
        }).success,
      ).toBe(true);
    });
  });
});
