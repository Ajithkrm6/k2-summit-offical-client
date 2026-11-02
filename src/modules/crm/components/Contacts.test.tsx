import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/button", () => ({
  buttonVariants: () => "button",
}));

import { Contacts } from "./Contacts";

describe("Contacts", () => {
  it("links to the separate creation form", () => {
    const markup = renderToStaticMarkup(createElement(Contacts));

    expect(markup).toContain('href="/crm/addContact/new"');
    expect(markup).toContain("Add Contact</a>");
    expect(markup).toContain('id="contacts-heading"');
    expect(markup).toContain('id="saved-contacts-heading"');
  });

  it("shows table columns and explicitly reports unavailable retrieval", () => {
    const markup = renderToStaticMarkup(createElement(Contacts));

    for (const column of [
      "Name",
      "Firm",
      "Role",
      "Email",
      "Phone",
      "Primary Contact",
    ]) {
      expect(markup).toContain(`${column}</th>`);
    }
    expect(markup).toContain("Contact listing is not connected yet.");
    expect(markup).toContain("Contact data is currently unavailable.");
    expect(markup).not.toContain("No contacts");
    expect(markup).not.toContain("<form");
  });
});
