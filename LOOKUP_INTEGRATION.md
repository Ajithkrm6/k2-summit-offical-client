# Lookup API Integration Guide

## Overview

The lookup API endpoint (`/api/v1/lookup`) has been integrated into the AddContact component to provide dynamic dropdown options. Previously, dropdown options were hardcoded; now they're fetched from the API.

## Contacts pages

- `/crm/addContact` is the Contacts landing page, with an Add Contact action and
  a saved-contacts table layout.
- `/crm/addContact/new` renders the existing contact creation form. Back and
  Cancel return to the landing page; successful creation also returns there.
  Failed submissions stay on the form.
- Contact creation uses the shared Zod resolver for required firm, first name,
  last name, role/title, and preferred contact method errors. Native browser
  validation is disabled so inline errors appear together on submit. Optional
  email may be blank, but populated email and phone values are validated.
- `useGetContacts(taxFirmId)` wraps the generated
  `useGetApiV1TaxFirmTaxFirmIdTaxFirmContacts` query for
  `GET /api/v1/TaxFirm/{taxFirmId}/TaxFirmContacts`. Requests are disabled until
  a firm is selected, and the Axios response array is exposed as `contacts`.
  The table handles selection, loading, error/retry, empty, and populated states.
  Roles are displayed by ID because the contacts response contains role IDs,
  not role names.
- `useAddContact` invalidates the created contact's firm query after success.
  Remote data and request state stay in TanStack Query; no new store is needed.

## Add Tax Client form pattern

- `/crm/addTaxClient` is the Tax Clients landing page, with an Add Tax Client
  action and saved-clients table layout (Name, Firm, Tax Year, Email, Phone).
- `/crm/addTaxClient/new` renders the creation form. Back, Cancel, and successful
  creation return to the landing page. Failed submissions preserve the form.
- `useGetTaxClients(taxFirmId)` wraps the generated
  `useGetApiV1TaxFirmTaxFirmIdTaxPersonClients` query for
  `GET /api/v1/TaxFirm/{taxFirmId}/TaxPersonClients`. It unwraps the Axios response
  array and disables fetching until a firm is selected. Query keys scope cached
  lists to each firm; the page displays selection, loading, error/retry, empty,
  and populated states. SSNs and dates of birth are not displayed in the table.
- `useAddTaxClient` invalidates the created client's firm list after successful
  creation. Query state remains in TanStack Query; no additional store is needed.

- `src/modules/crm/lib/schemas.ts` exports `createTaxClientSchema` and the inferred
  `CreateTaxClientFormData` type through the CRM library barrel.
- `AddTaxClient` uses `zodResolver(createTaxClientSchema)` with React Hook Form,
  following the shared-schema pattern in `AddFirmCRM`. Field validation belongs
  in the schema rather than inline `register` options or Controller rules.
- The component submits validated form values with `addTaxClient(data)`.
  The firm selector is controlled by React Hook Form so validation, submission,
  and reset all use the same selected firm.
  `useAddTaxClient` maps the form to `CreateTaxPersonClientRequest` and wraps the generated
  `usePostApiV1TaxFirmTaxfirmidTaxPersonClient` hook for notifications and reset
  callbacks. Pending, success, and error state remain in TanStack Query; no
  additional store is needed.
- Client status, filing status, dependents, prior-year AGI, and notes remain
  form-only fields: the current generated request does not support them, and
  they are not persisted locally or sent to the API.

## What Changed

### 1. Created Custom Hook: `useLookupData`

**File**: `src/lib/api/hooks/k2-tax-api/useLookupData.ts`

```typescript
export const useLookupData = () => {
  const { data, isLoading, error } = useGetApiV1Lookup();

  // Returns structured lookup data
  return {
    contactTypes: ContactTypeResponse[],           // Role/contact types
    contactMethodTypes: ContactMethodTypeResponse[], // Email, Phone, etc.
    contactRelationshipTypes: ContactRelationshipTypeResponse[],
    firmTypes: FirmTypeResponse[],
    credentialsTypes: CredentialsTypeResponse[],
    leadStatusTypes: LeadStatusTypeResponse[],
    isLoading,
    error,
  };
};
```

**Purpose**:

- Wraps the generated `useGetApiV1Lookup()` hook
- Normalizes API response structure
- Extracts relevant lookup arrays
- Handles loading/error states

### 2. Updated `AddTaxClient.tsx` Component

**Changes Made**:

#### Before (Hardcoded):

```typescript
const roleOptions = [
  { label: "Select a role...", value: null },
  { label: "Sales Representative", value: 1 },
  { label: "Admin", value: 2 },
];

const contactMethodOptions = [
  { label: "Select a method...", value: null },
  { label: "Email", value: 2 },
  { label: "Phone", value: 3 },
];
```

#### After (Dynamic from API):

```typescript
const { contactTypes, contactMethodTypes, isLoading: lookupLoading } = useLookupData();

// Use in Select component:
contactTypes.map((item) => (
  <SelectItem key={item.contactTypeId} value={(item.contactTypeId || "").toString()}>
    {item.contactTypeName || "Unknown"}
  </SelectItem>
))
```

### 3. Updated Dropdown Fields

#### Contact Type Selector

- **Old**: Hardcoded roles (Sales Rep, Admin)
- **New**: Dynamic from `contactTypes` array
- **Displays**: `contactTypeName` for each type
- **Value**: `contactTypeId` from API

#### Preferred Contact Method Selector

- **Old**: Hardcoded methods (Email, Phone)
- **New**: Dynamic from `contactMethodTypes` array
- **Displays**: `contactMethodTypeName` for each method
- **Value**: `contactMethodTypeId` from API

## Data Flow

```
Component Mount
      ↓
useLookupData() hook executes
      ↓
useGetApiV1Lookup() [Generated hook]
      ↓
API GET /api/v1/lookup
      ↓
Backend returns LookupResponse {
  contactTypes: [],
  contactMethodTypes: [],
  contactRelationshipTypes: [],
  firmTypes: [],
  credentialsTypes: [],
  leadStatusTypes: []
}
      ↓
Hook normalizes and returns:
{
  contactTypes: ContactTypeResponse[],
  contactMethodTypes: ContactMethodTypeResponse[],
  isLoading: boolean,
  error: null | AxiosError
}
      ↓
Component renders dropdowns with data
```

## Usage Pattern

### Step 1: Import the Hook

```typescript
import { useLookupData } from "@/lib/api/hooks/k2-tax-api/useLookupData";
```

### Step 2: Use in Component

```typescript
const {
  contactTypes,
  contactMethodTypes,
  contactRelationshipTypes,
  firmTypes,
  credentialsTypes,
  leadStatusTypes,
  isLoading,
  error,
} = useLookupData();
```

### Step 3: Map to Dropdown Options

```typescript
{lookupLoading ? (
  <SelectItem value="">Loading...</SelectItem>
) : contactTypes.length === 0 ? (
  <SelectItem value="">No types available</SelectItem>
) : (
  contactTypes.map((item) => (
    <SelectItem
      key={item.contactTypeId}
      value={(item.contactTypeId || "").toString()}
    >
      {item.contactTypeName || "Unknown"}
    </SelectItem>
  ))
)}
```

## Type Definitions

### LookupResponse (from API)

```typescript
interface LookupResponse {
  contactTypes?: ContactTypeResponse[] | null;
  contactMethodTypes?: ContactMethodTypeResponse[] | null;
  contactRelationshipTypes?: ContactRelationshipTypeResponse[] | null;
  firmTypes?: FirmTypeResponse[] | null;
  credentialsTypes?: CredentialsTypeResponse[] | null;
  leadStatusTypes?: LeadStatusTypeResponse[] | null;
}
```

### ContactTypeResponse

```typescript
interface ContactTypeResponse {
  contactTypeId?: number;
  contactTypeName?: string | null;
  description?: string | null;
  isActive?: boolean;
}
```

### ContactMethodTypeResponse

```typescript
interface ContactMethodTypeResponse {
  contactMethodTypeId?: number;
  contactMethodTypeName?: string | null;
  description?: string | null;
  isDeleted?: boolean;
}
```

## Benefits

✅ **Dynamic Data**: No need to hardcode options anymore  
✅ **Type Safe**: Full TypeScript support from generated types  
✅ **Maintainable**: Update options in API, not in code  
✅ **Reusable**: Hook can be used in any component  
✅ **Cache Friendly**: React Query caches the response  
✅ **Error Handling**: Built-in error state management

## Loading States

The component handles three states for each dropdown:

1. **Loading**: Shows "Loading..." while API fetch is in progress
2. **Empty**: Shows "No types available" if API returns empty array
3. **Populated**: Shows options from the API

```typescript
{lookupLoading ? (
  <SelectItem value="">Loading...</SelectItem>
) : items.length === 0 ? (
  <SelectItem value="">No items available</SelectItem>
) : (
  items.map((item) => ...)
)}
```

## Files Modified

| File                                            | Change                                             |
| ----------------------------------------------- | -------------------------------------------------- |
| `src/lib/api/hooks/k2-tax-api/useLookupData.ts` | ✨ Created new hook                                |
| `src/lib/api/hooks/k2-tax-api/index.ts`         | Updated exports                                    |
| `src/modules/crm/components/AddTaxClient.tsx`   | Integrated lookup hook + removed hardcoded options |

## How to Add More Lookups to Other Components

1. **Import the hook**:

   ```typescript
   import { useLookupData } from "@/lib/api/hooks/k2-tax-api/useLookupData";
   ```

2. **Use in component**:

   ```typescript
   const { firmTypes, credentialsTypes, isLoading } = useLookupData();
   ```

3. **Map to dropdowns**:
   ```typescript
   firmTypes.map((firm) => (
     <SelectItem key={firm.firmTypeId} value={firm.firmTypeId?.toString()}>
       {firm.firmTypeName}
     </SelectItem>
   ))
   ```

## API Endpoint Details

**Endpoint**: `GET /api/v1/lookup`

**Method**: Query (Read-only)

**Response Type**: `LookupResponse`

**Generated Hook**: `useGetApiV1Lookup()`

**Location**: `src/lib/api/generated/k2-tax-api/lookup/lookup.ts`

**Auto-generated**: Yes (via Orval from Swagger spec)

## Testing

To verify the integration works:

1. Load the AddContact component
2. Observe contact type and method dropdowns populate
3. Select a firm first (required for form validation)
4. Verify both dropdowns show actual values from API
5. Submit form with valid data to confirm values are sent correctly

## Troubleshooting

### Dropdowns show "No types available"

- Check API is returning data for that type
- Verify backend `/api/v1/lookup` endpoint is working
- Check browser console for errors

### Dropdowns show "Loading..." indefinitely

- Check network tab in DevTools for API call status
- Verify backend auth token is valid
- Check `useGetApiV1Lookup()` error state

### Types don't match in form submission

- Ensure `value` prop converts to correct type (string ID → number ID)
- Verify Zod schema expects the correct type
- Check TypeScript type warnings in IDE

---

**Created**: 2026-10-29  
**Version**: 1.0  
**Status**: Ready for use
