import { beforeEach, describe, expect, it, vi } from "vitest";

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@/lib/api/generated/k2-tax-api", () => ({
  useGetApiV1TaxFirmTaxFirmIdTaxPersonClients: query,
}));

import { useGetTaxClients } from "./useGetTaxClients";

describe("useGetTaxClients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    query.mockReturnValue({ data: undefined, isLoading: false, error: null });
  });

  it("does not fetch before a firm is selected", () => {
    expect(useGetTaxClients("").taxClients).toEqual([]);
    expect(query).toHaveBeenCalledWith("", { query: { enabled: false } });
  });

  it("uses the selected firm and unwraps the Axios response", () => {
    const clients = [
      { taxPersonClientId: "client-1", taxpayerFirstName: "Jane" },
    ];
    query.mockReturnValue({
      data: { data: clients },
      isLoading: false,
      error: null,
    });
    expect(useGetTaxClients("firm-1").taxClients).toBe(clients);
    expect(query).toHaveBeenCalledWith("firm-1", { query: { enabled: true } });
    useGetTaxClients("firm-2");
    expect(query).toHaveBeenLastCalledWith("firm-2", {
      query: { enabled: true },
    });
  });

  it("exposes query loading, errors, and retry without masking failures", () => {
    const error = new Error("Request failed");
    const refetch = vi.fn();
    query.mockReturnValue({ isLoading: true, error, refetch });
    expect(useGetTaxClients("firm-1")).toMatchObject({
      isLoading: true,
      error,
      refetch,
    });
  });
});
