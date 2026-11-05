# Cache & Data Synchronization Analysis Report

**Date:** November 4, 2026  
**Scope:** Complete analysis of TanStack Query cache usage, data dependencies, and potential synchronization issues

---

## Executive Summary

The application uses TanStack Query with a 5-minute staleTime and 10-minute gcTime globally. While basic cache invalidation is implemented for mutations, **several cache-related issues have been identified** that could cause:

1. ✅ **Stale data displays** (DocumentsCentral client selection)
2. ✅ **Race conditions** in dependent queries
3. ✅ **Missing cache invalidations** in certain workflows
4. ✅ **Query dependency ordering problems**
5. ✅ **Lookup data caching** without invalidation on server changes

---

## 1. CRITICAL: DocumentsCentral Client Selection Error

### Issue Description

When users select a firm in DocumentsCentral, sometimes an error appears under the client select component (as reported).

### Root Causes Identified

#### 1A. Query Dependency Race Condition

**File:** `src/modules/crm/components/DocumentsCentral.tsx` (lines 36-67)

```typescript
// ISSUE: Multiple race conditions here
const {
  taxClients,
  isLoading: clientsLoading,
  error: clientsError,
} = useGetTaxClients(selectedFirmId); // Line 66

const clientOptions = taxClients.flatMap((client) => {
  // clientsLoading might be true, but taxClients is stale from previous firm
  if (!client.taxPersonClientId) return [];
  return [{ id: client.taxPersonClientId, label: "..." }];
});
```

**Problem:**

- When `selectedFirmId` changes, `useGetTaxClients` is called with the new ID
- BUT `taxClients` is still populated with the **old firm's data** (from cache)
- Meanwhile, `clientsLoading = true` while the query fetches the new firm's data
- The Select component renders **old clients with new firm context**
- Race condition: If new data arrives while rendering old data, React throws errors

**Evidence:**

- `useGetTaxClients` uses `enabled: Boolean(taxFirmId)` to control when to fetch
- When ID changes from "F001" → "F002", the cache contains data for F001
- The UI renders F001's clients until F002's data arrives (5-second staleTime window)

#### 1B. Missing "Loading" State for Query Key Change

**Issue:** There's no reset mechanism when the query key changes (firm ID changes).

**Current behavior:**

```
Time 0ms: Select firm F001 → loads clients, clientsLoading = false
Time 100ms: Select firm F002 → clientsLoading = true, but clientOptions = [F001 clients]
Time 300ms: F002 data arrives → clientOptions = [F002 clients], clientsLoading = false
```

**Problem:** Between 100-300ms, the Select component shows F001's clients while F002 is loading

#### 1C. Error Handling Without Clear State Reset

**File:** `src/modules/crm/components/DocumentsCentral.tsx` (lines 169-183)

```typescript
{clientsError && selectedFirmId && (
  <Alert variant="destructive">
    <AlertDescription>
      Failed to load tax clients: {clientsError.message}
    </AlertDescription>
    // No automatic retry or recovery
  </Alert>
)}
```

**Problem:**

- If a query fails, the error persists in TanStack Query cache
- User selects a different firm: New query doesn't clear old error
- Old error from F001 might display while F002 is loading
- User is confused because the error isn't related to their current selection

---

## 2. HIGH: Query Parameter Change Not Properly Handled

### Components Affected

1. **DocumentsCentral.tsx** - `useGetTaxClients(selectedFirmId)`
2. **TaxClients.tsx** - `useGetTaxClients(selectedFirmId)`
3. **Contacts.tsx** - `useGetContacts(selectedFirmId)`

### Issue

When `selectedFirmId` changes (firm selection changes), the query key changes, but:

**Missing:** No explicit cache reset when parameter changes  
**Missing:** No manual data clearing before new query starts  
**Missing:** No "transition" state for dependent queries

### Example Flow (TaxClients Component)

```typescript
const { taxClients, error, refetch } = useGetTaxClients(selectedFirmId);

// When user changes firm:
// 1. selectedFirmId updates
// 2. useGetTaxClients query key changes (includes firmId)
// 3. TanStack Query fetches NEW data
// 4. BUT: taxClients still holds OLD data until response arrives
// 5. Component renders with MIXED state (old data + new loading state)
```

**Severity:** HIGH (causes confusing UI states)

---

## 3. MEDIUM: Missing Bidirectional Cache Invalidation

### Issue: Incompletely Invalidated Queries

#### 3A. AddTaxClient Hook

**File:** `src/lib/api/hooks/k2-tax-api/useAddTaxClient.ts` (lines 38-44)

```typescript
await queryClient.invalidateQueries({
  queryKey: getGetApiV1TaxFirmTaxFirmIdTaxPersonClientsQueryKey(
    variables.taxfirmid,
  ),
});
// MISSING: invalidateQueries for useGetTaxFirms
// The firm's "number of clients" might be cached and not updated
```

**Impact:**

- After adding a tax client, the client list is refreshed ✓
- BUT the tax firm might have a cached count/summary that's stale ✗

#### 3B. AddContact Hook

**File:** `src/lib/api/hooks/k2-tax-api/useAddContact.ts` (lines 38-42)

```typescript
await queryClient.invalidateQueries({
  queryKey: getGetApiV1TaxFirmTaxFirmIdTaxFirmContactsQueryKey(
    variables.taxfirmid,
  ),
});
// Missing invalidation of firm summary/contact counts
```

#### 3C. UpdateTaxClient & DeleteTaxClient

**File:** `src/lib/api/hooks/k2-tax-api/useUpdateTaxClient.ts` (lines 22-34)

```typescript
await Promise.all([
  queryClient.invalidateQueries({
    queryKey: getGetApiV1TaxFirmTaxFirmIdTaxPersonClientsQueryKey(
      variables.taxFirmId,
    ),
  }),
  queryClient.invalidateQueries({
    queryKey: getGetApiV1UserTaxFirmsQueryKey(), // ✓ Good! Updates firm list
  }),
]);
```

**Status:** ✓ This one IS correct (invalidates both)

#### 3D. DeleteContact Hook

**File:** `src/lib/api/hooks/k2-tax-api/useDeleteContact.ts`

```typescript
// Uses getGetApiV1TaxFirmTaxFirmIdTaxFirmContactsQueryKey
// Also invalidates useGetTaxFirms
// Status: ✓ Correct
```

---

## 4. MEDIUM: Lookup Data Caching Without Invalidation Strategy

### Issue

**File:** `src/lib/api/hooks/k2-tax-api/useLookupData.ts`

```typescript
export const useLookupData = () => {
  const { data, isLoading, error } = useGetApiV1Lookup();
  // No cache control parameters specified
  // No explicit staleTime/gcTime configuration
  // Lookup data is assumed to be static, but:
  // - New firm types might be added by admin
  // - New credentials types might be added
  // - New lead statuses might be added
};
```

**Problems:**

1. Lookup data is cached for 5 minutes globally (from query-client.ts)
2. If admin adds new credential type in backend, client won't see it for 5 minutes
3. Multiple components call `useLookupData()` - but only ONE query executes (efficient, but risky)
4. No manual invalidation strategy if user role/permissions change

**Components using lookupData:**

- AddFirmCRM.tsx - Uses for firm types, credentials, lead statuses
- Dashboard.tsx (edit dialog) - Uses for same dropdowns
- TaxPersonClientForm.tsx - Uses for contact methods
- Contacts.tsx (edit) - Uses for contact methods
- TaxClients.tsx (edit) - Uses for contact methods

**Risk:** If lookup data becomes stale, ALL these components show outdated options.

---

## 5. MEDIUM: Query Enabled Conditions Create Stale States

### Issue: `enabled: Boolean(taxFirmId)` Patterns

**Files affected:**

- `useGetTaxClients.ts`: `enabled: Boolean(taxFirmId)`
- `useGetContacts.ts`: `enabled: Boolean(taxFirmId)`

**Problem Flow:**

```
1. User opens DocumentsCentral with no firm selected (selectedFirmId = "")
2. useGetTaxClients(selectedFirmId="") → query NOT ENABLED (enabled=false)
3. taxClients = [] (empty array from previous state or default)
4. User selects a firm → selectedFirmId = "F001"
5. Query ENABLES and starts fetching
6. BUT: During fetch, component still renders with taxClients = []
7. No "loading" state because query was just enabled

**Timing issue:**
- Between steps 4-5, clientsLoading changes from false → true
- Component may briefly show "no clients" before actual "loading clients" state
```

---

## 6. MEDIUM: Parallel Query Dependencies

### Issue: Multiple Queries Depend on Same Parameter

**DocumentsCentral.tsx:**

```typescript
useGetTaxFirms(); // Query A: All firms
useGetTaxClients(firmId); // Query B: Depends on firmId
useUploadDocuments(); // Mutation: Depends on taxPersonClientId (from Query B)
```

**Problem:**

- Query B depends on firmId from a UI state (selectedFirmId)
- But firmId might not be in the query key properly
- If two queries for different firms execute simultaneously, cache keys might collide

**Risk Level:** LOW (Orval-generated keys should be unique), but worth verifying

---

## 7. MEDIUM: Zustand Store Alongside TanStack Query

### Issue: Dual State Management

**File:** `src/modules/crm/store/crm.store.ts`

```typescript
interface CRMState {
  isLoading: boolean; // ← Duplicates TanStack Query's isPending
  error: string | null; // ← Duplicates TanStack Query's error
  success: boolean; // ← Duplicates TanStack Query's isSuccess
  // ...
}
```

**Where it's used:**

- `useUploadDocuments()` updates CRM store instead of relying on mutation state
- `useAddTaxFirm()` updates CRM store

**Problems:**

1. **Dual source of truth:** Store state vs. Query state
2. **Inconsistent error handling:** DocumentsCentral shows `useCRMStore().error` but other components show query errors
3. **No automatic cache invalidation:** Store errors don't trigger query refetch
4. **Stale error persistence:** DocumentsCentral keeps showing upload errors even after navigation

**Example:**

```typescript
// DocumentsCentral.tsx
const { error, setSuccess } = useCRMStore();

// If upload fails:
// 1. error = "Failed to upload"
// 2. User navigates away
// 3. User comes back to DocumentsCentral
// 4. error is still set (not cleared automatically)
```

---

## 8. MEDIUM: Missing Refetch on Component Mount

### Issue: No Initial Data Validation

**TaxClients.tsx:**

```typescript
const { taxClients, error, refetch } = useGetTaxClients(selectedFirmId);
// If component unmounts and remounts, it uses cached data
// No mechanism to validate cache freshness on mount
```

**Potential issue:**

1. User is on TaxClients for firm F001 (loaded at T=0ms)
2. User navigates away, returns 6 minutes later (T=360000ms)
3. T=0 → staleTime=300000ms (5 min), data is NOW STALE
4. Component mounts with stale data
5. Since `refetchOnWindowFocus: false`, no automatic refetch
6. User sees 6-minute-old client list

---

## 9. MEDIUM: No Cache Warming or Prefetching

### Issue: Sequential Loading Creates Perceived Slowness

**Current Flow:**

```
1. Load DocumentsCentral page
2. useGetTaxFirms() starts → fetches firms (500ms)
3. User selects firm
4. THEN useGetTaxClients(firmId) starts → fetches clients (300ms)
Total: 800ms before clients appear
```

**Better approach:** Prefetch clients while firms list is loading

**Current status:** No prefetch implementation anywhere

---

## 10. LOW: Error Display Timing Issues

### Issue: Race Condition in Error Display

**DocumentsCentral.tsx:**

```typescript
{clientsError && selectedFirmId && (
  <Alert variant="destructive">
    Failed to load tax clients: {clientsError.message}
  </Alert>
)}
```

**Scenario:**

1. User selects firm F001 → Query starts for F001 clients
2. Query fails → clientsError is set
3. User immediately selects firm F002
4. New query starts for F002
5. Old error from F001 might still display briefly

**Likelihood:** LOW (error clears when query succeeds)  
**User Impact:** Momentary confusion

---

## 11. LOW: TaxYear Field Consistency

### Issue: Inconsistent Year Handling

**Multiple locations:**

- AddTaxClient.tsx: taxYear stored as string
- TaxPersonClientForm.tsx: taxYear stored as string
- TaxClients.tsx (edit): taxYear converted to string
- DocumentsCentral.tsx: taxYear as number in form defaults

**Status:** Mostly handled, but could cause cache key mismatches if types differ

---

## Summary Table: Cache Issues by Severity

| #   | Severity    | Component                              | Issue                                             | Impact                                        |
| --- | ----------- | -------------------------------------- | ------------------------------------------------- | --------------------------------------------- |
| 1A  | 🔴 CRITICAL | DocumentsCentral                       | Query dependency race condition on firm selection | Client select shows old firm's data + error   |
| 1B  | 🔴 CRITICAL | DocumentsCentral                       | Missing loading state reset on query key change   | Confusing UI transitions                      |
| 1C  | 🟠 HIGH     | DocumentsCentral                       | Error not cleared on firm selection change        | Error message persists incorrectly            |
| 2   | 🟠 HIGH     | DocumentsCentral, TaxClients, Contacts | Query parameter changes cause stale data renders  | Mixed old/new data in UI                      |
| 3A  | 🟡 MEDIUM   | useAddTaxClient                        | Missing firm list invalidation after client add   | Firm summaries stay stale                     |
| 3B  | 🟡 MEDIUM   | useAddContact                          | Missing firm list invalidation after contact add  | Firm summaries stay stale                     |
| 4   | 🟡 MEDIUM   | useLookupData                          | No automatic invalidation strategy                | Admin-added options not visible for 5 minutes |
| 5   | 🟡 MEDIUM   | useGetTaxClients/useGetContacts        | Stale render states during enabled transitions    | Momentary "no clients" before "loading"       |
| 6   | 🟡 MEDIUM   | DocumentsCentral                       | Parallel queries with parameter dependencies      | Potential cache key collisions (low risk)     |
| 7   | 🟡 MEDIUM   | useCRMStore                            | Dual state management (Zustand + Query)           | Inconsistent error handling across app        |
| 8   | 🟡 MEDIUM   | TaxClients                             | No refetch on mount validation                    | 6-minute-old data displayed silently          |
| 9   | 🟡 MEDIUM   | All components                         | No prefetching strategy                           | Sequential loading perceived as slow          |
| 10  | 🟢 LOW      | DocumentsCentral                       | Error display timing race                         | Brief incorrect error message                 |
| 11  | 🟢 LOW      | All forms                              | TaxYear type inconsistency                        | Potential cache key mismatches                |

---

## Root Cause: Query Key Strategy

The core issue stems from **how dependent queries handle parameter changes:**

### Current Pattern (Problematic):

```typescript
const [selectedFirmId, setSelectedFirmId] = useState("");
const { taxClients } = useGetTaxClients(selectedFirmId);
// When selectedFirmId changes:
// - Old cached data for previous firmId remains in state
// - New query starts with new firmId
// - UI renders old data until new data arrives
```

### Better Pattern (Not Implemented):

```typescript
// Option 1: Prefetch
queryClient.prefetchQuery({
  queryKey: getGetApiV1TaxFirmTaxFirmIdTaxPersonClientsQueryKey(selectedFirmId),
  queryFn: () => fetchClients(selectedFirmId),
});

// Option 2: Manual cache reset
const handleFirmChange = (newFirmId: string) => {
  queryClient.removeQueries({
    queryKey:
      getGetApiV1TaxFirmTaxFirmIdTaxPersonClientsQueryKey(selectedFirmId),
  });
  setSelectedFirmId(newFirmId);
};

// Option 3: Query-level staleTime overrides
useGetTaxClients(selectedFirmId, {
  query: {
    staleTime: 0, // Always refetch on mount for this query
  },
});
```

---

## Recommendations (Priority Order)

### CRITICAL (Implement First)

1. **Add query key cleanup on parameter change** in DocumentsCentral
   - Clear taxClients cache before query key changes
   - Show loading state during transition

2. **Fix error state reset** in DocumentsCentral
   - Clear clientsError when firm selection changes
   - Don't show old errors for new selections

### HIGH (Implement Next)

3. **Standardize cache invalidation** in all mutation hooks
   - Ensure parent queries are invalidated (not just direct children)
   - Create reusable invalidation patterns

4. **Unify error handling** - Remove Zustand store dual state
   - Use TanStack Query state for all loading/error/success
   - Remove CRMStore or use it only for form UI state (not server state)

### MEDIUM (Implement After)

5. **Add staleTime override for lookup data**
   - Consider `staleTime: Infinity` for truly static lookup data
   - OR add admin-triggered cache invalidation endpoint

6. **Implement prefetching strategy**
   - Prefetch clients when firms list loads
   - Prefetch related data on dropdown open

7. **Add transition states**
   - Skeleton loaders when query key changes
   - Explicit "loading new data" indicator

### LOW (Nice to Have)

8. **Verify cache key uniqueness** - Run tests to ensure no collisions
9. **Add debug logging** - Log cache hits/misses in development
10. **Consider SWR-style refetch** - Enable refetchOnWindowFocus for critical data

---

## Testing Recommendations

1. **Manual Test: Firm Selection in DocumentsCentral**
   - Open DocumentsCentral
   - Select firm F001 → observe clients load
   - Immediately select firm F002 → verify no F001 clients shown
   - Verify no error message from F001 query

2. **Network Throttling Test**
   - Use Chrome DevTools: Slow 3G
   - Select different firms rapidly
   - Verify UI doesn't show corrupted state

3. **Cache Inspection Test**
   - Open React Query DevTools (if installed)
   - Monitor query cache keys as firm selection changes
   - Verify old queries are cleaned up

4. **Error Recovery Test**
   - Simulate backend error for firm selection
   - Verify error clears when selection changes
   - No error persists when loading new firm

---

## Implementation Priority Matrix

```
CRITICALITY vs COMPLEXITY

High Impact, Low Effort:
  → DocumentsCentral query key cleanup
  → Error state reset on selection change
  → Lookup data staleTime override

High Impact, Medium Effort:
  → Unify error handling (remove Zustand store dual state)
  → Standardize invalidation patterns

Medium Impact, Low Effort:
  → Add transition states/skeleton loaders
  → Implement prefetch on mount

Medium Impact, Medium Effort:
  → Comprehensive cache testing
  → Add dev mode cache logging
```

---

## Conclusion

The application has **foundational cache issues** that manifest as:

- **DocumentsCentral client selection errors** (stale data display)
- **Inconsistent data across related components** (missing invalidations)
- **Confusing loading state transitions** (mixed old/new data)

The issues are solvable through:

1. Proper query key cleanup on parameter changes
2. Explicit error state management
3. Consistent cache invalidation patterns
4. Removal of dual state management (Zustand + Query)

Estimated effort: **8-16 hours** for complete remediation (Critical + High priority items)

---

**Report Generated:** 2026-11-04  
**Status:** Analysis Complete - Ready for Implementation
