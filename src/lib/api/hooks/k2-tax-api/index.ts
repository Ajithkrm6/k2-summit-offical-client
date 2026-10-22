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
export { useUploadDocuments } from "./useUploadDocuments";
export type * as UploadDocumentsTypes from "./useUploadDocuments";
export type * as UsersTypes from "./useUsers";
