import { useGetApiV1TaxFirmTaxFirmIdTaxFirmContacts } from "@/lib/api/generated/k2-tax-api";

export const useGetContacts = (taxFirmId: string) => {
  const { data, isLoading, error, refetch } =
    useGetApiV1TaxFirmTaxFirmIdTaxFirmContacts(taxFirmId, {
      query: { enabled: Boolean(taxFirmId) },
    });

  return {
    contacts: data?.data ?? [],
    isLoading,
    error,
    refetch,
  };
};
