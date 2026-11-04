import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreateTaxClientFormData } from "../../../../modules/crm/lib";

const { mutate, useMutation, notify, invalidateQueries } = vi.hoisted(() => ({
  mutate: vi.fn(),
  useMutation: vi.fn(),
  notify: vi.fn(),
  invalidateQueries: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries }),
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { add: notify },
}));

vi.mock("@/lib/api/generated/k2-tax-api", () => ({
  usePostApiV1TaxFirmTaxfirmidTaxPersonClient: useMutation,
  getGetApiV1TaxFirmTaxFirmIdTaxPersonClientsQueryKey: (id: string) => [
    `/api/v1/TaxFirm/${id}/TaxPersonClients`,
  ],
}));

import { useAddTaxClient } from "./useAddTaxClient";

const form: CreateTaxClientFormData = {
  firmId: "selected-firm-id",
  taxYear: "2026",
  clientStatus: "new",
  taxpayerFirstName: "Jane",
  taxpayerLastName: "Doe",
  taxpayerSSN: "123-45-6789",
  taxpayerDOB: "",
  taxpayerOccupation: "",
  filingStatus: "single",
  mailingAddress: "",
  phoneNumber: "",
  email: "",
  numberOfDependents: "0",
  priorYearAGI: "",
  preferredContactMethod: "",
  notes: "",
};

describe("useAddTaxClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMutation.mockReturnValue({
      mutate,
      isPending: false,
      isSuccess: false,
      error: null,
    });
  });

  it("submits the selected firm and only supported API fields", () => {
    useAddTaxClient().addTaxClient(form);

    expect(mutate).toHaveBeenCalledExactlyOnceWith({
      taxfirmid: "selected-firm-id",
      data: {
        taxYear: 2026,
        taxpayerFirstName: "Jane",
        taxpayerLastName: "Doe",
        taxpayerSsn: "123-45-6789",
        taxpayerDob: null,
        taxpayerOccupation: null,
        address: null,
        phoneNumber: null,
        email: null,
        preferredContactMethodTypeId: null,
      },
    });
  });

  it("shows the backend title instead of the HTTP status message", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      useAddTaxClient();
      useMutation.mock.calls[0][0].mutation.onError({
        message: "Request failed with status code 409",
        response: {
          data: { title: "Client already exists", message: "Other message" },
        },
      });
      expect(notify).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          description: "Client already exists",
        }),
      );
    } finally {
      log.mockRestore();
    }
  });

  it("maps populated form fields to API names and numeric IDs", () => {
    useAddTaxClient().addTaxClient({
      ...form,
      taxpayerDOB: "1990-05-10",
      taxpayerOccupation: "Accountant",
      mailingAddress: "123 Main Street",
      phoneNumber: "555-123-4567",
      email: "jane@example.com",
      preferredContactMethod: "2",
    });

    expect(mutate).toHaveBeenCalledWith({
      taxfirmid: form.firmId,
      data: {
        taxYear: 2026,
        taxpayerFirstName: "Jane",
        taxpayerLastName: "Doe",
        taxpayerSsn: "123-45-6789",
        taxpayerDob: "1990-05-10",
        taxpayerOccupation: "Accountant",
        address: "123 Main Street",
        phoneNumber: "555-123-4567",
        email: "jane@example.com",
        preferredContactMethodTypeId: 2,
      },
    });
  });

  it("uses mutation state without a second store", () => {
    const error = new Error("Request failed");
    useMutation.mockReturnValue({
      mutate,
      isPending: true,
      isSuccess: false,
      error,
    });

    const result = useAddTaxClient();

    expect(result.isPending).toBe(true);
    expect(result.isSuccess).toBe(false);
    expect(result.error).toBe(error);
  });

  it("saves optional spouse fields through the client API", () => {
    useAddTaxClient().addTaxClient({
      ...form,
      spouseFirstName: "Alex",
      spouseLastName: "Doe",
      spouseSsn: "987-65-4321",
      spouseDob: "1991-04-03",
      spouseOccupation: "Teacher",
    });
    expect(mutate).toHaveBeenCalledWith({
      taxfirmid: form.firmId,
      data: expect.objectContaining({
        spouseFirstName: "Alex",
        spouseLastName: "Doe",
        spouseSsn: "987-65-4321",
        spouseDob: "1991-04-03",
        spouseOccupation: "Teacher",
      }),
    });
  });

  it("does not redirect or notify success for an API business error", async () => {
    const onSuccess = vi.fn();
    useAddTaxClient({ onSuccess });
    await useMutation.mock.calls[0][0].mutation.onSuccess(
      { data: { isError: true, firstError: { description: "Invalid SSN" } } },
      { taxfirmid: form.firmId },
    );
    expect(onSuccess).not.toHaveBeenCalled();
    expect(invalidateQueries).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        description: "Invalid SSN",
      }),
    );
  });

  it("invalidates the created client's firm list before the success callback", async () => {
    const onSuccess = vi.fn();
    useAddTaxClient({ onSuccess });
    await useMutation.mock.calls[0][0].mutation.onSuccess(
      { data: {} },
      { taxfirmid: form.firmId },
    );
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [`/api/v1/TaxFirm/${form.firmId}/TaxPersonClients`],
    });
    expect(onSuccess).toHaveBeenCalledOnce();
  });
});
