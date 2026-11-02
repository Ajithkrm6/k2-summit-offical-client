import { beforeEach, describe, expect, it, vi } from "vitest";

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@/lib/api/generated/k2-tax-api", () => ({
  useGetApiV1TaxFirmTaxFirmIdTaxFirmContacts: query,
}));

import { useGetContacts } from "./useGetContacts";

describe("useGetContacts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    query.mockReturnValue({ data: undefined, isLoading: false, error: null });
  });

  it("disables fetching before firm selection", () => {
    expect(useGetContacts("").contacts).toEqual([]);
    expect(query).toHaveBeenCalledWith("", { query: { enabled: false } });
  });

  it("unwraps the Axios array and uses the selected firm for each query", () => {
    const contacts = [{ contactId: "contact-1", firstName: "Jane" }];
    query.mockReturnValue({ data: { data: contacts } });
    expect(useGetContacts("firm-1").contacts).toBe(contacts);
    expect(query).toHaveBeenCalledWith("firm-1", { query: { enabled: true } });
    useGetContacts("firm-2");
    expect(query).toHaveBeenLastCalledWith("firm-2", {
      query: { enabled: true },
    });
  });

  it("exposes loading, errors, and retry", () => {
    const error = new Error("Request failed");
    const refetch = vi.fn();
    query.mockReturnValue({ isLoading: true, error, refetch });
    expect(useGetContacts("firm-1")).toMatchObject({
      isLoading: true,
      error,
      refetch,
    });
  });
});
