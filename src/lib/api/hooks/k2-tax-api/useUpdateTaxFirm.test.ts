import { beforeEach, describe, expect, it, vi } from "vitest";

const { mutation, mutate, invalidateQueries, notify } = vi.hoisted(() => ({
  mutation: vi.fn(),
  mutate: vi.fn(),
  invalidateQueries: vi.fn(),
  notify: vi.fn(),
}));

vi.mock("@/components/ui/toast", () => ({ toast: { add: notify } }));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries }),
}));
vi.mock("@/lib/api/generated/k2-tax-api", () => ({
  usePatchApiV1TaxFirmTaxFirmId: mutation,
  getGetApiV1UserTaxFirmsQueryKey: () => ["/api/v1/User/TaxFirms"],
}));

import { useUpdateTaxFirm } from "./useUpdateTaxFirm";

describe("useUpdateTaxFirm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutation.mockReturnValue({ mutate, isPending: false });
  });

  it("preserves explicit nulls for cleared optional fields in the PATCH payload", () => {
    const data = { websiteUrl: null, address: null, credentialTypeId: null };
    useUpdateTaxFirm().updateTaxFirm("firm-1", data);
    expect(mutate).toHaveBeenCalledExactlyOnceWith({
      taxFirmId: "firm-1",
      data,
    });
    expect(JSON.stringify(mutate.mock.calls[0][0].data)).toBe(
      JSON.stringify(data),
    );
  });

  it("waits for the latest firm list before closing the editor", async () => {
    const onSuccess = vi.fn();
    let finishRefetch: (() => void) | undefined;
    invalidateQueries.mockReturnValue(
      new Promise<void>((resolve) => {
        finishRefetch = resolve;
      }),
    );
    useUpdateTaxFirm({ onSuccess });
    const completion = mutation.mock.calls[0][0].mutation.onSuccess({
      data: { isError: false },
    });
    expect(invalidateQueries).toHaveBeenCalledExactlyOnceWith({
      queryKey: ["/api/v1/User/TaxFirms"],
    });
    expect(onSuccess).not.toHaveBeenCalled();
    finishRefetch?.();
    await completion;
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it("does not close the editor or refetch on a business failure", async () => {
    const onSuccess = vi.fn();
    useUpdateTaxFirm({ onSuccess });
    await mutation.mock.calls[0][0].mutation.onSuccess({
      data: { isError: true, firstError: { description: "Not allowed" } },
    });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(invalidateQueries).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Not allowed",
        type: "error",
      }),
    );
  });
});
