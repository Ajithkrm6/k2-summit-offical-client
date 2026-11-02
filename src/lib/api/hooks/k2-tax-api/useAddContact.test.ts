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
  usePostApiV1TaxFirmTaxfirmidContact: mutation,
  getGetApiV1TaxFirmTaxFirmIdTaxFirmContactsQueryKey: (id: string) => [
    `/api/v1/TaxFirm/${id}/TaxFirmContacts`,
  ],
}));

import { useAddContact } from "./useAddContact";

describe("useAddContact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutation.mockReturnValue({
      mutate,
      isPending: false,
      isSuccess: false,
      error: null,
    });
  });

  it("preserves submission of the selected firm and payload", () => {
    useAddContact({ taxFirmId: "firm-1" }).addContact({ firstName: "Jane" });
    expect(mutate).toHaveBeenCalledWith({
      taxfirmid: "firm-1",
      data: { firstName: "Jane" },
    });
  });

  it("invalidates the submitted firm's query before calling success", async () => {
    const onSuccess = vi.fn();
    useAddContact({ taxFirmId: "firm-2", onSuccess });
    await mutation.mock.calls[0][0].mutation.onSuccess(
      { data: {} },
      { taxfirmid: "firm-1" },
    );
    expect(invalidateQueries).toHaveBeenCalledExactlyOnceWith({
      queryKey: ["/api/v1/TaxFirm/firm-1/TaxFirmContacts"],
    });
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(notify).toHaveBeenCalledOnce();
  });
});
