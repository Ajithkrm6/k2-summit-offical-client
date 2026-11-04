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

  it("does not expose an error message before a failure", () => {
    expect(useAddContact({ taxFirmId: "firm-1" }).errorMessage).toBeNull();
  });

  it.each([
    [
      { title: "A primary contact already exists", message: "Other message" },
      "A primary contact already exists",
    ],
    [
      { title: null, message: "Contact could not be added" },
      "Contact could not be added",
    ],
    [
      { title: "   ", message: "Contact could not be added" },
      "Contact could not be added",
    ],
    [{ title: 400, message: {} }, "Request failed with status code 400"],
    [undefined, "Request failed with status code 400"],
  ])(
    "uses the same API error message for the alert and toast (%j)",
    (data, expected) => {
      const error = {
        response: { data },
        message: "Request failed with status code 400",
      };
      mutation.mockReturnValue({
        mutate,
        isPending: false,
        isSuccess: false,
        error,
      });
      const log = vi.spyOn(console, "error").mockImplementation(() => {});
      try {
        const result = useAddContact({ taxFirmId: "firm-1" });
        expect(result.error).toBe(error);
        expect(result.errorMessage).toBe(expected);
        mutation.mock.calls[0][0].mutation.onError(error);
        expect(notify).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "error",
            description: expected,
          }),
        );
      } finally {
        log.mockRestore();
      }
    },
  );

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
