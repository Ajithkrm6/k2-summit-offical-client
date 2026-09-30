import { useGetApiV1UserTaxFirms } from "../../generated/k2-tax-api";
import { GetTaxFirmResponse } from "../../generated/k2-tax-api/k2TaxAPI.schemas";

/**
 * Custom hook to fetch user's tax firms
 * Wraps the generated useGetApiV1UserTaxFirms hook with additional logic
 */
export const useGetTaxFirms = () => {
  const { data, isLoading, error } = useGetApiV1UserTaxFirms();

  // Extract array from response - API returns array of GetTaxFirmResponse
  const taxFirms = data?.data ?? [];
  console.log("taxFirms from hook", taxFirms, typeof taxFirms);

  return {
    taxFirms: taxFirms as GetTaxFirmResponse[],
    isLoading,
    error,
  };
};
