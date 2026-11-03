import { beforeEach, describe, expect, it, vi } from "vitest";

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }));

vi.mock("../../generated/k2-tax-api", () => ({
  usePostApiV1TaxFirm: () => ({ mutate }),
}));
vi.mock("@/components/ui/toast", () => ({
  toast: { add: vi.fn() },
}));
vi.mock("../../../../modules/crm/store/crm.store", () => ({
  useCRMStore: () => ({
    setLoading: vi.fn(),
    setError: vi.fn(),
    setSuccess: vi.fn(),
    isLoading: false,
    success: false,
  }),
}));

import { useAddTaxFirm } from "./useAddTaxFirm";

describe("useAddTaxFirm credentials payload", () => {
  beforeEach(() => {
    mutate.mockClear();
  });

  it("includes explicit null when credentials are not selected", () => {
    useAddTaxFirm().addTaxFirm({ firmName: "Example Firm" });

    expect(mutate).toHaveBeenCalledExactlyOnceWith({
      data: { firmName: "Example Firm", credentialTypeId: null },
    });
    expect(JSON.stringify(mutate.mock.calls[0][0].data)).toContain(
      '"credentialTypeId":null',
    );
  });

  it.each([undefined, null, 0, 22])(
    "normalizes credential value %j without discarding numeric IDs",
    (credentialTypeId) => {
      useAddTaxFirm().addTaxFirm({
        firmName: "Example Firm",
        credentialTypeId,
      });

      expect(mutate).toHaveBeenCalledExactlyOnceWith({
        data: {
          firmName: "Example Firm",
          credentialTypeId: credentialTypeId ?? null,
        },
      });
    },
  );
});
