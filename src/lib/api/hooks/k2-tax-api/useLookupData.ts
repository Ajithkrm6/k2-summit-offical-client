import { useGetApiV1Lookup } from "@/lib/api/generated/k2-tax-api";
import type { LookupResponse } from "@/lib/api/generated/k2-tax-api/k2TaxAPI.schemas";

interface LookupApiResponse extends LookupResponse {
  roleTitleTypes?:
    | {
        roleTitleTypeId: number;
        name: string;
      }[]
    | null;
  preferredContactMethodTypes?:
    | {
        preferredContactMethodTypeId: number;
        contactMethodType: string;
      }[]
    | null;
}

/**
 * Custom hook to fetch all lookup/dropdown data
 * Wraps the generated useGetApiV1Lookup hook
 *
 * Maps actual API response to normalized types for use throughout the app
 *
 * API Response Structure:
 * - roleTitleTypes → maps to contactTypes
 * - preferredContactMethodTypes → maps to contactMethodTypes
 * - activityTypes → maps to activityTypes (no mapping needed)
 * - Other fields pass through as-is
 */
export const useLookupData = () => {
  const { data, isLoading, error } = useGetApiV1Lookup();

  // Axios returns response in .data property
  // The actual API response differs from the generated schema.
  const rawResponse = (data?.data ?? {}) as LookupApiResponse;

  // Map actual API response fields to normalized structure
  const normalizedData = {
    // Map roleTitleTypes from API to contactTypes
    contactTypes: rawResponse.roleTitleTypes
      ? rawResponse.roleTitleTypes.map((item) => ({
          contactTypeId: item.roleTitleTypeId,
          contactTypeName: item.name,
          description: null,
          isActive: true,
        }))
      : [],

    // Map preferredContactMethodTypes from API to contactMethodTypes
    contactMethodTypes: rawResponse.preferredContactMethodTypes
      ? rawResponse.preferredContactMethodTypes.map((item) => ({
          contactMethodTypeId: item.preferredContactMethodTypeId,
          contactMethodTypeName: item.contactMethodType,
          description: null,
          isDeleted: false,
        }))
      : [],

    // Map activityTypes from API to activityTypes
    activityTypes: rawResponse.activityTypes
      ? rawResponse.activityTypes.map((item) => ({
          activityTypeId: item.activityTypeId,
          activityTypeName: item.name,
        }))
      : [],

    // Pass through other fields as-is
    contactRelationshipTypes: rawResponse.contactRelationshipTypes ?? [],
    firmTypes: rawResponse.firmTypes ?? [],
    credentialsTypes: rawResponse.credentialsTypes ?? [],
    leadStatusTypes: rawResponse.leadStatusTypes ?? [],
  };

  return {
    contactTypes: normalizedData.contactTypes,
    contactMethodTypes: normalizedData.contactMethodTypes,
    contactRelationshipTypes: normalizedData.contactRelationshipTypes,
    firmTypes: normalizedData.firmTypes,
    credentialsTypes: normalizedData.credentialsTypes,
    leadStatusTypes: normalizedData.leadStatusTypes,
    activityTypes: normalizedData.activityTypes,
    isLoading,
    error,
  };
};
