import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/button", () => ({
  buttonVariants: () => "button",
}));

import { TaxClients } from "./TaxClients";

describe("TaxClients", () => {
  it("links to the separate creation form", () => {
    const markup = renderToStaticMarkup(createElement(TaxClients));

    expect(markup).toContain('href="/crm/addTaxClient/new"');
    expect(markup).toContain("Add Tax Client</a>");
    expect(markup).toContain('id="tax-clients-heading"');
    expect(markup).toContain('id="saved-tax-clients-heading"');
  });

  it("shows table columns and explicitly reports unavailable retrieval", () => {
    const markup = renderToStaticMarkup(createElement(TaxClients));

    for (const column of ["Name", "Firm", "Tax Year", "Email", "Phone"]) {
      expect(markup).toContain(`${column}</th>`);
    }
    expect(markup).toContain("Tax client listing is not connected yet.");
    expect(markup).toContain("Tax client data is currently unavailable.");
    expect(markup).not.toContain("No tax clients");
    expect(markup).not.toContain("<form");
    expect(markup).not.toContain("SSN");
  });
});
