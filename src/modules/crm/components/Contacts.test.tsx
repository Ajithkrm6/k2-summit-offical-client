import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { contactsQuery, selection } = vi.hoisted(() => ({
  contactsQuery: vi.fn(),
  selection: { firmId: "" },
}));

vi.mock("@/lib/api/hooks/k2-tax-api/useGetContacts", () => ({
  useGetContacts: contactsQuery,
}));
vi.mock("@/lib/api/hooks/k2-tax-api/useGetTaxFirms", () => ({
  useGetTaxFirms: () => ({
    taxFirms: [{ taxFirmId: "firm-1", firmName: "Example Firm" }],
    isLoading: false,
    error: null,
  }),
}));
vi.mock("react-hook-form", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-hook-form")>()),
  useWatch: () => selection.firmId,
}));

vi.mock("@/components/ui/button", () => ({
  buttonVariants: () => "button",
  Button: ({ children }: { children: React.ReactNode }) =>
    createElement("button", null, children),
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

import { Contacts } from "./Contacts";

describe("Contacts", () => {
  beforeEach(() => {
    selection.firmId = "";
    contactsQuery.mockReturnValue({
      contacts: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it("links to the separate creation form", () => {
    const markup = renderToStaticMarkup(createElement(Contacts));

    expect(markup).toContain('href="/crm/addContact/new"');
    expect(markup).toContain("Add Contact</a>");
    expect(markup).toContain('id="contacts-heading"');
    expect(markup).toContain('id="saved-contacts-heading"');
  });

  it("selects the first firm and fetches its contacts by default", () => {
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
    expect(contactsQuery).toHaveBeenCalledWith("firm-1");
    expect(markup).not.toContain("Select a firm to view contacts.");
    expect(markup).toContain("No contacts found for this firm.");
    expect(markup).not.toContain("<form");
  });

  it.each([
    [true, null, "Loading contacts..."],
    [
      false,
      new Error("Access denied"),
      "Failed to load contacts: Access denied",
    ],
    [false, null, "No contacts found for this firm."],
  ])("shows the selected firm's request state", (isLoading, error, message) => {
    selection.firmId = "firm-1";
    contactsQuery.mockReturnValue({
      contacts: [],
      isLoading,
      error,
      refetch: vi.fn(),
    });
    const markup = renderToStaticMarkup(createElement(Contacts));
    expect(markup).toContain(message);
    if (error) expect(markup).not.toContain("No contacts found");
  });

  it("renders API contact fields, firm, and primary-contact status", () => {
    selection.firmId = "firm-1";
    contactsQuery.mockReturnValue({
      contacts: [
        {
          contactId: "1",
          firstName: "Jane",
          lastName: "Doe",
          roleTitleTypeId: 2,
          email: "jane@example.com",
          phoneNumber: "555-1234",
          isPrimaryContact: true,
        },
        { contactId: "2", cellPhone: "555-5678", isPrimaryContact: false },
      ],
      isLoading: false,
      error: null,
    });
    const markup = renderToStaticMarkup(createElement(Contacts));
    for (const value of [
      "Jane Doe",
      "Example Firm",
      "Role 2",
      "jane@example.com",
      "555-1234",
      "555-5678",
      "Yes",
      "No",
      "Not provided",
    ]) {
      expect(markup).toContain(value);
    }
    expect(contactsQuery).toHaveBeenCalledWith("firm-1");
  });
});
