import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { clientsQuery, selection, firmsQuery } = vi.hoisted(() => ({
  clientsQuery: vi.fn(),
  firmsQuery: vi.fn(),
  selection: { firmId: "" },
}));

vi.mock("@/lib/api/hooks/k2-tax-api/useGetTaxFirms", () => ({
  useGetTaxFirms: firmsQuery,
}));

vi.mock("@/lib/api/hooks/k2-tax-api/useGetTaxClients", () => ({
  useGetTaxClients: clientsQuery,
}));

vi.mock("react-hook-form", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-hook-form")>()),
  useWatch: () => selection.firmId,
}));

vi.mock("@/components/ui/button", () => ({
  buttonVariants: () => "button",
  Button: ({ children, ...props }: React.ComponentProps<"button">) =>
    createElement("button", props, children),
}));

vi.mock("@/components/ui/alert", () => ({
  Alert: ({ children }: { children: React.ReactNode }) =>
    createElement("div", { role: "alert" }, children),
  AlertDescription: ({ children }: { children: React.ReactNode }) =>
    createElement("p", null, children),
}));

vi.mock("@/components/ui/label", () => ({
  Label: ({ children }: { children: React.ReactNode }) =>
    createElement("label", null, children),
}));

vi.mock("@/components/ui/select", () => {
  const Container = ({ children }: { children: React.ReactNode }) =>
    createElement("div", null, children);
  return {
    Select: Container,
    SelectContent: Container,
    SelectGroup: Container,
    SelectItem: Container,
    SelectLabel: Container,
    SelectTrigger: Container,
    SelectValue: Container,
  };
});

import { TaxClients } from "./TaxClients";

vi.mock("@/modules/crm/lib", async () => import("../lib"));
vi.mock(
  "@/components/ui/input",
  async () => import("../../../components/ui/input"),
);
vi.mock("@/lib/api/hooks/k2-tax-api/useUpdateTaxClient", () => ({
  useUpdateTaxClient: () => ({ updateTaxClient: vi.fn(), isPending: false }),
}));
vi.mock("@/lib/api/hooks/k2-tax-api/useDeleteTaxClient", () => ({
  useDeleteTaxClient: () => ({ deleteTaxClient: vi.fn(), isPending: false }),
}));
vi.mock("@/components/ui/dialog", () => {
  const Container = ({ children }: { children: React.ReactNode }) =>
    createElement("div", null, children);
  return {
    Dialog: ({
      open,
      children,
    }: {
      open: boolean;
      children: React.ReactNode;
    }) => (open ? createElement("div", null, children) : null),
    DialogContent: Container,
    DialogDescription: Container,
    DialogFooter: Container,
    DialogHeader: Container,
    DialogTitle: Container,
  };
});

describe("TaxClients", () => {
  beforeEach(() => {
    clientsQuery.mockClear();
    selection.firmId = "";
    firmsQuery.mockReturnValue({
      taxFirms: [
        { taxFirmId: "firm-1", firmName: "Example Firm" },
        { taxFirmId: "firm-2", firmName: "Second Firm" },
      ],
      isLoading: false,
      error: null,
    });
    clientsQuery.mockReturnValue({
      taxClients: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it("links to the separate creation form", () => {
    const markup = renderToStaticMarkup(createElement(TaxClients));

    expect(markup).toContain('href="/crm/addTaxClient/new"');
    expect(markup).toContain("Add Tax Client</a>");
    expect(markup).toContain('id="tax-clients-heading"');
    expect(markup).toContain('id="saved-tax-clients-heading"');
  });

  it("selects the first firm and fetches its tax clients by default", () => {
    const markup = renderToStaticMarkup(createElement(TaxClients));

    for (const column of ["Name", "Firm", "Tax Year", "Email", "Phone"]) {
      expect(markup).toContain(`${column}</th>`);
    }
    expect(clientsQuery).toHaveBeenCalledWith("firm-1");
    expect(markup).not.toContain("Select a firm to view tax clients.");
    expect(markup).toContain("No tax clients found for this firm.");
    expect(markup).not.toContain("<form");
    expect(markup).not.toContain("SSN");
  });

  it("keeps a manually selected firm instead of the default", () => {
    selection.firmId = "firm-2";

    renderToStaticMarkup(createElement(TaxClients));

    expect(clientsQuery).toHaveBeenCalledWith("firm-2");
  });

  it("does not select a firm when none are available", () => {
    firmsQuery.mockReturnValue({
      taxFirms: [],
      isLoading: false,
      error: null,
    });

    const markup = renderToStaticMarkup(createElement(TaxClients));

    expect(clientsQuery).toHaveBeenCalledWith("");
    expect(markup).toContain("No firms available");
    expect(markup).toContain("Select a firm to view tax clients.");
  });

  it.each([
    [true, null, "Loading tax clients..."],
    [
      false,
      new Error("Access denied"),
      "Failed to load tax clients: Access denied",
    ],
    [false, null, "No tax clients found for this firm."],
  ])(
    "shows the correct selected-firm request state",
    (isLoading, error, message) => {
      selection.firmId = "firm-1";
      clientsQuery.mockReturnValue({
        taxClients: [],
        isLoading,
        error,
        refetch: vi.fn(),
      });
      const markup = renderToStaticMarkup(createElement(TaxClients));
      expect(markup).toContain(message);
      if (error) expect(markup).not.toContain("No tax clients found");
    },
  );

  it("renders API clients without exposing SSNs or dates of birth", () => {
    selection.firmId = "firm-1";
    clientsQuery.mockReturnValue({
      taxClients: [
        {
          taxPersonClientId: "client-1",
          taxpayerFirstName: "Jane",
          taxpayerLastName: "Doe",
          taxYear: 2026,
          email: "jane@example.com",
          phoneNumber: "555-1234",
          taxpayerSsn: "123-45-6789",
          taxpayerDob: "1990-01-01",
        },
      ],
      isLoading: false,
      error: null,
    });
    const markup = renderToStaticMarkup(createElement(TaxClients));
    for (const value of [
      "Jane Doe",
      "Example Firm",
      "2026",
      "jane@example.com",
      "555-1234",
    ]) {
      expect(markup).toContain(value);
    }
    expect(markup).not.toContain("123-45-6789");
    expect(markup).not.toContain("1990-01-01");
    expect(markup).toContain('aria-label="Edit Jane Doe"');
    expect(markup).toContain('aria-label="Delete Jane Doe"');
  });
});
