// CRM Module
// Centralized exports for CRM functionality

export * from "./lib/schemas";

// Components
export { AddFirmCRM } from "./components/AddFirmCRM";

// Reusable Dialog Components
export {
  EditTaxFirmDialog,
  DeleteTaxFirmDialog,
  type EditTaxFirmFields,
  type LookupOption,
  type EditTaxFirmDialogProps,
  type DeleteTaxFirmDialogProps,
  editFirmFields,
  getEditFirmDefaults,
  toUpdateTaxFirmRequest,
} from "./components/TaxFirmDialogs";
