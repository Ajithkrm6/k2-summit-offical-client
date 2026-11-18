/**
 * K2 Tax API Hooks Barrel Export
 *
 * Re-export all wrapper hooks for easy importing
 * Each hook wraps generated API hooks with business logic
 */

// Auth hooks
export type * as AddTaxFirmTypes from "./useAddTaxFirm";
export type * as AuthTypes from "./useAuth";
export { useAddContact } from "./useAddContact";
export type * as AddContactTypes from "./useAddContact";
export { useAddTaxClient } from "./useAddTaxClient";
export type * as AddTaxClientTypes from "./useAddTaxClient";
export { useUploadDocuments } from "./useUploadDocuments";
export type * as UploadDocumentsTypes from "./useUploadDocuments";
export { useGetDocuments } from "./useGetDocuments";
export type * as GetDocumentsTypes from "./useGetDocuments";
export { useGetFirmById } from "./useGetFirmById";
export type * as UsersTypes from "./useUsers";
export { useGetTaxFirms } from "./useGetTaxFirms";
export { useGetTaxClients } from "./useGetTaxClients";
export { useUpdateTaxClient } from "./useUpdateTaxClient";
export { useDeleteTaxClient } from "./useDeleteTaxClient";
export { useGetContacts } from "./useGetContacts";
export { useUpdateContact } from "./useUpdateContact";
export { useDeleteContact } from "./useDeleteContact";
export { useUpdateTaxFirm } from "./useUpdateTaxFirm";
export { useDeleteTaxFirm } from "./useDeleteTaxFirm";
export { useLookupData } from "./useLookupData";
export { useAddLogActivity } from "./useAddLogActivity";
export { useUpdateLogActivity } from "./useUpdateLogActivity";
export { useDeleteLogActivity } from "./useDeleteLogActivity";
export { useGetLogActivities } from "./useGetLogActivities";
