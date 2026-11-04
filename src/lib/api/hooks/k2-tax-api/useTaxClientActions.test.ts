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
  usePatchApiV1TaxFirmTaxFirmIdClientClientId: updateHook,
  useDeleteApiV1TaxFirmTaxFirmIdClientClientId: deleteHook,
  getGetApiV1TaxFirmTaxFirmIdTaxPersonClientsQueryKey: (id: string) => [
    `/api/v1/TaxFirm/${id}/TaxPersonClients`,
  ],
  getGetApiV1UserTaxFirmsQueryKey: () => ["/api/v1/User/TaxFirms"],
}));

import { useUpdateTaxClient } from "./useUpdateTaxClient";
import { useDeleteTaxClient } from "./useDeleteTaxClient";

describe("tax client actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateHook.mockReturnValue({ mutate, isPending: false });
    deleteHook.mockReturnValue({ mutate, isPending: false });
  });

  it("passes the firm, client and PATCH payload unchanged", () => {
    const data = {
      taxpayerFirstName: "Jane",
      taxYear: 2026,
      phoneNumber: null,
    };
    useUpdateTaxClient().updateTaxClient("firm-1", "client-1", data);
    expect(mutate).toHaveBeenCalledExactlyOnceWith({
      taxFirmId: "firm-1",
      clientId: "client-1",
      data,
    });
  });

  it("passes both IDs to DELETE", () => {
    useDeleteTaxClient().deleteTaxClient("firm-1", "client-1");
    expect(mutate).toHaveBeenCalledExactlyOnceWith({
      taxFirmId: "firm-1",
      clientId: "client-1",
    });
  });

  it.each(["update", "delete"])(
    "notifies network failures for %s",
    (action) => {
      const error = new Error("Network unavailable");
      const log = vi.spyOn(console, "error").mockImplementation(() => {});
      if (action === "update") useUpdateTaxClient();
      else useDeleteTaxClient();
      const hook = action === "update" ? updateHook : deleteHook;
      hook.mock.calls[0][0].mutation.onError(error);
      expect(notify).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          description: "Network unavailable",
        }),
      );
      expect(log).toHaveBeenCalledWith(expect.any(String), error);
      log.mockRestore();
    },
  );

  it.each(["update", "delete"])(
    "refreshes clients and dashboard after %s succeeds",
    async (action) => {
      const onSuccess = vi.fn();
      if (action === "update") useUpdateTaxClient({ onSuccess });
      else useDeleteTaxClient({ onSuccess });
      const hook = action === "update" ? updateHook : deleteHook;
      await hook.mock.calls[0][0].mutation.onSuccess(
        { data: { isError: false } },
        { taxFirmId: "firm-1", clientId: "client-1" },
      );
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["/api/v1/TaxFirm/firm-1/TaxPersonClients"],
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
      if (action === "update") useUpdateTaxClient({ onSuccess });
      else useDeleteTaxClient({ onSuccess });
      const hook = action === "update" ? updateHook : deleteHook;
      await hook.mock.calls[0][0].mutation.onSuccess(
        { data: { isError: true, firstError: { description: "Not allowed" } } },
        { taxFirmId: "firm-1", clientId: "client-1" },
      );
      expect(invalidateQueries).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
      expect(notify).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error", description: "Not allowed" }),
      );
    },
  );
});
