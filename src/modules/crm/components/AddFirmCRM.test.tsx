import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { lookup } = vi.hoisted(() => ({ lookup: vi.fn() }));
vi.mock("@/lib/api/hooks/k2-tax-api/useLookupData", () => ({
  useLookupData: lookup,
}));
vi.mock("@/lib/api/hooks/k2-tax-api/useAddTaxFirm", () => ({
  useAddTaxFirm: () => ({
    addTaxFirm: vi.fn(),
    isPending: false,
    isSuccess: false,
  }),
}));
vi.mock("@/modules/crm/store/crm.store", () => ({
  useCRMStore: () => ({ error: null, setSuccess: vi.fn() }),
}));
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
vi.mock(
  "@/components/ui/checkbox",
  async () => import("../../../components/ui/checkbox"),
);
vi.mock("@/components/ui/select", () => {
  const Container = ({ children }: { children: ReactNode }) =>
    createElement("div", null, children);
  return {
    Select: Container,
    SelectContent: Container,
    SelectGroup: Container,
    SelectItem: ({ value, children }: { value: string; children: ReactNode }) =>
      createElement("div", { "data-value": value }, children),
    SelectLabel: Container,
    SelectTrigger: Container,
    SelectValue: Container,
  };
});

import { AddFirmCRM } from "./AddFirmCRM";

describe("AddFirmCRM lookup options", () => {
  beforeEach(() => {
    lookup.mockReturnValue({
      firmTypes: [
        { firmTypeId: 11, name: "Partnership" },
        { name: "Missing ID" },
      ],
      credentialsTypes: [{ credentialTypeId: 22, name: "CPA" }],
      leadStatusTypes: [{ leadStatusTypeId: 33, name: "Qualified" }],
      isLoading: false,
      error: null,
    });
  });

  it("maps each lookup category to its own labels and API IDs", () => {
    const markup = renderToStaticMarkup(createElement(AddFirmCRM));
    expect(markup).toContain('data-value="11">Partnership');
    expect(markup).toContain('data-value="22">CPA');
    expect(markup).toContain('data-value="33">Qualified');
    expect(markup).not.toContain("Missing ID");
    expect(markup).toContain("Lead Status");
    expect(markup).not.toContain("Load Status");
  });

  it("shows loading states for lookup fields", () => {
    lookup.mockReturnValue({
      firmTypes: [],
      credentialsTypes: [],
      leadStatusTypes: [],
      isLoading: true,
      error: null,
    });
    const markup = renderToStaticMarkup(createElement(AddFirmCRM));
    expect(markup).toContain("Loading firm types...");
    expect(markup).toContain("Loading credentials...");
    expect(markup).toContain("Loading lead statuses...");
  });

  it("shows lookup failures and empty categories", () => {
    lookup.mockReturnValue({
      firmTypes: [],
      credentialsTypes: [],
      leadStatusTypes: [],
      isLoading: false,
      error: new Error("Access denied"),
    });
    const markup = renderToStaticMarkup(createElement(AddFirmCRM));
    expect(markup).toContain("Failed to load firm options: Access denied");
    expect(markup).toContain("No firm types available");
    expect(markup).toContain("No credentials available");
    expect(markup).toContain("No lead statuses available");
  });
});
