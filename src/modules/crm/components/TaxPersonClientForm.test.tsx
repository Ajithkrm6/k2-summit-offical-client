import { zodResolver } from "@hookform/resolvers/zod";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { FieldErrors } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTaxClientSchema, type CreateTaxClientFormData } from "../lib";

const state = vi.hoisted(() => ({
  errors: {} as FieldErrors<CreateTaxClientFormData>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock(
  "@/modules/crm/components/TaxPersonClientForm",
  async () => import("./TaxPersonClientForm"),
);
vi.mock("@/modules/crm/lib", async () => import("../lib"));
vi.mock(
  "@/components/ui/alert",
  async () => import("../../../components/ui/alert"),
);
vi.mock(
  "@/components/ui/button",
  async () => import("../../../components/ui/button"),
);
vi.mock(
  "@/components/ui/input",
  async () => import("../../../components/ui/input"),
);
vi.mock(
  "@/components/ui/label",
  async () => import("../../../components/ui/label"),
);
vi.mock("@/lib/api/hooks/k2-tax-api/useAddTaxClient", () => ({
  useAddTaxClient: () => ({
    addTaxClient: vi.fn(),
    isPending: false,
    error: null,
  }),
}));
vi.mock("@/lib/api/hooks/k2-tax-api/useGetTaxFirms", () => ({
  useGetTaxFirms: () => ({ taxFirms: [], isLoading: false, error: null }),
}));
vi.mock("@/lib/api/hooks/k2-tax-api/useLookupData", () => ({
  useLookupData: () => ({ contactMethodTypes: [], isLoading: false }),
}));
vi.mock("react-hook-form", async (importOriginal) => {
  const original = await importOriginal<typeof import("react-hook-form")>();
  return {
    ...original,
    useForm: (options: Parameters<typeof original.useForm>[0]) => {
      const form = original.useForm(options);
      return {
        ...form,
        formState: { ...form.formState, errors: state.errors },
      };
    },
  };
});

vi.mock("@/components/ui/select", () => {
  const Container = ({ children }: { children: ReactNode }) =>
    createElement("div", null, children);
  return {
    Select: Container,
    SelectContent: Container,
    SelectItem: Container,
    SelectTrigger: Container,
    SelectValue: Container,
  };
});

import AddTaxFirmPage from "../../../../app/(protected)/crm/taxFirm/page";

describe("/crm/addTaxFirm taxpayer form", () => {
  beforeEach(() => {
    state.errors = {};
  });

  it("renders the taxpayer fields and required markers at the requested route", () => {
    const markup = renderToStaticMarkup(createElement(AddTaxFirmPage));
    for (const id of [
      "taxPersonClientId",
      "taxpayerFirstName",
      "taxpayerLastName",
      "taxYear",
      "taxpayerSSN",
      "spouseFirstName",
      "spouseLastName",
      "spouseSsn",
      "spouseDob",
      "spouseOccupation",
      "phoneNumber",
      "email",
    ]) {
      expect(markup).toContain(`id="${id}"`);
    }
    expect(markup.match(/aria-required="true"/g)).toHaveLength(4);
    expect(markup).toContain("Generated on save");
    expect(markup).toContain("Yes (server default)");
    expect(markup).not.toContain('id="firmName"');
  });

  it("renders all Zod errors from an empty submission", async () => {
    const result = await zodResolver(createTaxClientSchema)(
      {
        firmId: "",
        taxYear: "",
        taxpayerFirstName: "",
        taxpayerLastName: "",
        taxpayerSSN: "",
      },
      undefined,
      { fields: {}, shouldUseNativeValidation: false },
    );
    state.errors = result.errors;
    const markup = renderToStaticMarkup(createElement(AddTaxFirmPage));
    for (const message of [
      "Firm is required",
      "Tax year is required",
      "First name is required",
      "Last name is required",
      "SSN is required",
    ]) {
      expect(markup).toContain(message);
    }
    expect(markup).toContain("Please correct the highlighted fields");
  });
});
