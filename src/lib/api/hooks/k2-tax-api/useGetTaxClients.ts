import { useGetApiV1TaxFirmTaxFirmIdTaxPersonClients } from "@/lib/api/generated/k2-tax-api";

export const useGetTaxClients = (taxFirmId: string) => {
  const { data, isLoading, error, refetch } =
    useGetApiV1TaxFirmTaxFirmIdTaxPersonClients(taxFirmId, {
      query: { enabled: Boolean(taxFirmId) },
    });

  return {
    taxClients: data?.data ?? [],
    isLoading,
    error,
    refetch,
  };
};
