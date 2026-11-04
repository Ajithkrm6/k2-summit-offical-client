import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateHook, deleteHook, mutate, invalidateQueries, notify } =
  vi.hoisted(() => ({
    updateHook: vi.fn(),
    deleteHook: vi.fn(),
    mutate: vi.fn(),
    invalidateQueries: vi.fn(),
    notify: vi.fn(),
  }));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries }),
}));
vi.mock("@/components/ui/toast", () => ({ toast: { add: notify } }));
vi.mock("@/lib/api/generated/k2-tax-api", () => ({
  usePatchApiV1TaxFirmTaxFirmIdContactContactId: updateHook,
  useDeleteApiV1TaxFirmTaxFirmIdContactContactId: deleteHook,
  getGetApiV1TaxFirmTaxFirmIdTaxFirmContactsQueryKey: (id: string) => [
    `/api/v1/TaxFirm/${id}/TaxFirmContacts`,
  ],
  getGetApiV1UserTaxFirmsQueryKey: () => ["/api/v1/User/TaxFirms"],
}));

import { useUpdateContact } from "./useUpdateContact";
import { useDeleteContact } from "./useDeleteContact";

describe("contact actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateHook.mockReturnValue({ mutate, isPending: false });
    deleteHook.mockReturnValue({ mutate, isPending: false });
  });

  it("passes the original firm, contact and PATCH payload", () => {
    const data = {
      firstName: "Jane",
      roleTitleTypeId: 2,
      phoneNumber: null,
      isPrimaryContact: false,
    };
    useUpdateContact().updateContact("firm-1", "contact-1", data);
    expect(mutate).toHaveBeenCalledExactlyOnceWith({
      taxFirmId: "firm-1",
      contactId: "contact-1",
      data,
    });
  });

  it("passes both IDs to DELETE", () => {
    useDeleteContact().deleteContact("firm-1", "contact-1");
    expect(mutate).toHaveBeenCalledExactlyOnceWith({
      taxFirmId: "firm-1",
      contactId: "contact-1",
    });
  });

  it.each(["update", "delete"])(
    "refreshes contacts and dashboard after %s succeeds",
    async (action) => {
      const onSuccess = vi.fn();
      if (action === "update") useUpdateContact({ onSuccess });
      else useDeleteContact({ onSuccess });
      const hook = action === "update" ? updateHook : deleteHook;
      await hook.mock.calls[0][0].mutation.onSuccess(
        { data: { isError: false } },
        { taxFirmId: "firm-1", contactId: "contact-1" },
      );
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["/api/v1/TaxFirm/firm-1/TaxFirmContacts"],
      });
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["/api/v1/User/TaxFirms"],
      });
      expect(onSuccess).toHaveBeenCalledOnce();
      expect(notify).toHaveBeenCalledWith(
        expect.objectContaining({ type: "success" }),
      );
    },
  );

  it.each(["update", "delete"])(
    "keeps the dialog open on %s business errors",
    async (action) => {
      const onSuccess = vi.fn();
      if (action === "update") useUpdateContact({ onSuccess });
      else useDeleteContact({ onSuccess });
      const hook = action === "update" ? updateHook : deleteHook;
      await hook.mock.calls[0][0].mutation.onSuccess(
        { data: { isError: true, firstError: { description: "Not allowed" } } },
        { taxFirmId: "firm-1", contactId: "contact-1" },
      );
      expect(invalidateQueries).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
      expect(notify).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error", description: "Not allowed" }),
      );
    },
  );

  it.each(["update", "delete"])(
    "notifies network failures for %s",
    (action) => {
      const log = vi.spyOn(console, "error").mockImplementation(() => {});
      try {
        if (action === "update") useUpdateContact();
        else useDeleteContact();
        const hook = action === "update" ? updateHook : deleteHook;
        const error = new Error("Network unavailable");
        hook.mock.calls[0][0].mutation.onError(error);
        expect(notify).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "error",
            description: error.message,
          }),
        );
        expect(log).toHaveBeenCalledWith(expect.any(String), error);
      } finally {
        log.mockRestore();
      }
    },
  );
});
