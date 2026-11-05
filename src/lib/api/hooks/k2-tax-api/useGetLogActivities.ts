import { useGetApiV1TaxFirmTaxFirmIdLogActivities } from "@/lib/api/generated/k2-tax-api";

interface UseGetLogActivitiesOptions {
  taxFirmId: string;
}

export const useGetLogActivities = ({
  taxFirmId,
}: UseGetLogActivitiesOptions) => {
  const { data, isPending, error, refetch } =
    useGetApiV1TaxFirmTaxFirmIdLogActivities(taxFirmId);

  // Extract array from AxiosResponse or default to empty array
  const logActivitiesArray = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
      ? data
      : [];

  return {
    logActivities: logActivitiesArray,
    isLoading: isPending,
    error,
    refetch,
  };
};
