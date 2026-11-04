import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryObserver } from "@tanstack/react-query";

const { mutate, mutation, notify, setError, setSuccess, invalidateQueries } =
  vi.hoisted(() => ({
    mutate: vi.fn(),
    mutation: vi.fn(),
    notify: vi.fn(),
    setError: vi.fn(),
    setSuccess: vi.fn(),
    invalidateQueries: vi.fn(),
  }));

vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  useQueryClient: () => ({ invalidateQueries }),
}));

vi.mock("../../generated/k2-tax-api", () => ({
  usePostApiV1TaxFirm: mutation,
  getGetApiV1UserTaxFirmsQueryKey: () => ["/api/v1/User/TaxFirms"],
}));
vi.mock("@/components/ui/toast", () => ({
  toast: { add: notify },
}));
vi.mock("../../../../modules/crm/store/crm.store", () => ({
  useCRMStore: () => ({
    setLoading: vi.fn(),
    setError,
    setSuccess,
    isLoading: false,
    success: false,
  }),
}));

import { useAddTaxFirm } from "./useAddTaxFirm";

describe("useAddTaxFirm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutation.mockReturnValue({ mutate });
    invalidateQueries.mockReset();
    invalidateQueries.mockResolvedValue(undefined);
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

  it("shows the backend title in both the form error and toast", () => {
    useAddTaxFirm();
    mutation.mock.calls[0][0].mutation.onError({
      message: "Request failed with status code 409",
      response: { data: { title: "Firm already exists" } },
    });
    expect(setError).toHaveBeenCalledExactlyOnceWith("Firm already exists");
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Firm already exists",
        type: "error",
      }),
    );
    expect(invalidateQueries).not.toHaveBeenCalled();
  });

  it("invalidates the firm list before reporting successful creation", async () => {
    let completeInvalidation: (() => void) | undefined;
    invalidateQueries.mockReturnValue(
      new Promise<void>((resolve) => {
        completeInvalidation = resolve;
      }),
    );
    useAddTaxFirm();
    const completion = mutation.mock.calls[0][0].mutation.onSuccess({
      data: { isError: false },
    });
    expect(invalidateQueries).toHaveBeenCalledExactlyOnceWith({
      queryKey: ["/api/v1/User/TaxFirms"],
    });
    expect(setSuccess).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
    completeInvalidation?.();
    await completion;
    expect(setSuccess).toHaveBeenCalledExactlyOnceWith(true);
    expect(notify).toHaveBeenCalledWith({
      title: "Tax Firm added successfully",
    });
  });

  it("refetches a previously fresh inactive list when the dashboard returns", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { staleTime: 300000, retry: false } },
    });
    const queryKey = ["/api/v1/User/TaxFirms"];
    const latest = [{ taxFirmId: "old-firm" }, { taxFirmId: "new-firm" }];
    const fetchFirms = vi.fn(async () => latest);
    client.setQueryData(queryKey, [{ taxFirmId: "old-firm" }]);
    invalidateQueries.mockImplementation((options) =>
      client.invalidateQueries(options),
    );
    let unsubscribe: (() => void) | undefined;
    try {
      useAddTaxFirm();
      await mutation.mock.calls[0][0].mutation.onSuccess({
        data: { isError: false },
      });
      expect(client.getQueryState(queryKey)?.isInvalidated).toBe(true);
      const observer = new QueryObserver(client, {
        queryKey,
        queryFn: fetchFirms,
      });
      const updated = new Promise<void>((resolve) => {
        unsubscribe = observer.subscribe((result) => {
          if (
            result.data?.some((firm) => firm.taxFirmId === "new-firm") &&
            !result.isFetching
          )
            resolve();
        });
      });
      await updated;
      expect(fetchFirms).toHaveBeenCalledOnce();
      expect(client.getQueryData(queryKey)).toEqual(latest);
    } finally {
      unsubscribe?.();
      client.clear();
    }
  });

  it("keeps the form unsuccessful and skips invalidation for business errors", async () => {
    useAddTaxFirm();
    await mutation.mock.calls[0][0].mutation.onSuccess({
      data: {
        isError: true,
        firstError: { description: "Firm already exists" },
      },
    });
    expect(invalidateQueries).not.toHaveBeenCalled();
    expect(setSuccess).toHaveBeenCalledExactlyOnceWith(false);
    expect(setError).toHaveBeenCalledExactlyOnceWith("Firm already exists");
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Firm already exists",
        type: "error",
      }),
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
