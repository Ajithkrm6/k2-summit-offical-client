# Cache Issues - Quick Summary

## The Main Problem

When a user selects a different firm in DocumentsCentral, the client selection dropdown sometimes shows an error. This happens because:

1. **Stale Data Rendering**: Old firm's client data is still displayed while new firm's data loads
2. **Error Persistence**: Error from previous firm selection stays visible during new selection
3. **Timing Issue**: Between 500-1000ms, UI shows corrupted state (old data + new loading state)

---

## Why It Happens

### Problem 1: Query State Lags Behind UI State

```javascript
// DocumentsCentral.tsx - PROBLEMATIC CODE
const [selectedFirmId, setSelectedFirmId] = useState("");
const { taxClients, error: clientsError } = useGetTaxClients(selectedFirmId);
const clientOptions = taxClients.flatMap(...);

// Timeline:
// T=500ms: Select F001 → taxClients = [Client A, Client B]
// T=510ms: User selects F002 → selectedFirmId changes
// T=515ms: PROBLEM - taxClients STILL = [Client A, Client B] (from F001!)
// T=1000ms: New data arrives → taxClients = [Client X, Client Y]
```

### Problem 2: Old Errors Not Cleared

```javascript
// When selecting F001, if query fails:
// clientsError = "Failed to load"

// User immediately selects F002:
// - New query starts for F002
// - OLD error still persists in cache
// - UI shows: "Failed to load" (but for F002 context)
```

### Problem 3: Dual State Management

```javascript
// useUploadDocuments uses BOTH:
// 1. TanStack Query state (isPending, error, isSuccess)
// 2. Zustand store state (isLoading, error, success)
//
// When component unmounts:
// - Query state clears
// - Zustand state PERSISTS
// - User sees old errors when component remounts
```

---

## Impact Severity

| Component        | Issue                         | User Impact                                  |
| ---------------- | ----------------------------- | -------------------------------------------- |
| DocumentsCentral | Stale client data + old error | ❌ Error message when selecting firms        |
| TaxClients       | Stale data display            | ⚠️ 6-min-old data shown silently             |
| Contacts         | Stale data display            | ⚠️ 6-min-old data shown silently             |
| All forms        | Lookup data stale 5 minutes   | ⚠️ New admin options not available for 5 min |
| useAddTaxClient  | Incomplete cache invalidation | ⚠️ Firm summaries stay stale                 |

---

## Root Cause Analysis

**The core issue:** TanStack Query's `enabled` queries with changing parameters don't automatically reset previous data.

```javascript
// CURRENT PATTERN (PROBLEMATIC):
const { data } = useQuery({
  queryKey: ["clients", firmId], // ← Changes when firmId changes
  enabled: Boolean(firmId), // ← Query enabled/disabled
  queryFn: () => fetchClients(firmId),
});

// When firmId changes:
// 1. Query key changes
// 2. New query starts
// 3. BUT: previous `data` still in component state
// 4. UI renders with old data until new arrives
```

---

## Components Affected

### CRITICAL (User-Facing Errors)

- **DocumentsCentral** - Client selection error
  - Shows old firm's clients while new firm loading
  - Shows old firm's errors on new firm selection

### HIGH (Silent Data Issues)

- **TaxClients** - Edit/delete wrong clients if data stale
- **Contacts** - Edit/delete wrong contacts if data stale
- **Dashboard** - Sees 6-month-old firm summaries

### MEDIUM (Data Consistency)

- **AddTaxFirm** - Doesn't invalidate firms on related changes
- **AddContact** - Doesn't invalidate firms on related changes
- **useLookupData** - Lookup data stale for 5 minutes

---

## Files With Issues

```
src/modules/crm/components/
  ├─ DocumentsCentral.tsx          ← CRITICAL (query race condition)
  ├─ TaxClients.tsx                ← HIGH (stale data on 6min+)
  ├─ Contacts.tsx                  ← HIGH (stale data on 6min+)
  └─ AddTaxClient.tsx              ← MEDIUM (missing invalidation)

src/lib/api/hooks/k2-tax-api/
  ├─ useUploadDocuments.ts         ← MEDIUM (dual state management)
  ├─ useAddTaxFirm.ts              ← MEDIUM (missing invalidation)
  ├─ useAddTaxClient.ts            ← MEDIUM (missing invalidation)
  ├─ useAddContact.ts              ← MEDIUM (missing invalidation)
  ├─ useLookupData.ts              ← MEDIUM (stale lookup data)
  ├─ useGetTaxClients.ts           ← HIGH (stale state transitions)
  └─ useGetContacts.ts             ← HIGH (stale state transitions)

src/modules/crm/store/
  └─ crm.store.ts                  ← MEDIUM (dual state with Query)

src/utils/
  └─ query-client.ts               ← MEDIUM (5min staleTime too long)
```

---

## Fix Priorities

### Priority 1: CRITICAL (Fixes DocumentsCentral Error)

**Fix: Reset query cache on parameter change**

```javascript
// Add this to DocumentsCentral.tsx
useEffect(() => {
  if (selectedFirmId) {
    // Prefetch new firm's clients
    queryClient.prefetchQuery({
      queryKey:
        getGetApiV1TaxFirmTaxFirmIdTaxPersonClientsQueryKey(selectedFirmId),
      queryFn: () => fetchTaxClients(selectedFirmId),
    });
  }
}, [selectedFirmId]);
```

### Priority 2: HIGH (Fixes Error Persistence)

**Fix: Clear errors when query key changes**

```javascript
// In useGetTaxClients hook
useEffect(() => {
  return () => {
    // Clean up on key change
    queryClient.resetQueries({
      queryKey: getGetApiV1TaxFirmTaxFirmIdTaxPersonClientsQueryKey(taxFirmId),
    });
  };
}, [taxFirmId]);
```

### Priority 3: MEDIUM (Unify State Management)

**Fix: Remove Zustand duplicates for server state**

```javascript
// Remove from useCRMStore
-  isLoading: boolean;
-  error: string | null;
-  success: boolean;

// Keep only UI state:
+  selectedTab: "documents" | "upload";
+  isDialogOpen: boolean;
```

### Priority 4: MEDIUM (Comprehensive Cache Invalidation)

**Fix: Invalidate all related queries on mutation**

```javascript
// In useAddTaxClient.ts
await Promise.all([
  queryClient.invalidateQueries({
    queryKey: getGetApiV1TaxFirmTaxFirmIdTaxPersonClientsQueryKey(firmId),
  }),
  queryClient.invalidateQueries({
    queryKey: getGetApiV1UserTaxFirmsQueryKey(),
  }),
]);
```

---

## Testing the Issues

### Test 1: DocumentsCentral Client Selection Error

1. Open DocumentsCentral
2. Select firm F001 → wait for clients to load
3. Immediately select firm F002 → observe error under client select
4. Wait 5 seconds
5. Error should disappear as F002 data loads

**Expected After Fix:** No error message appears, smooth transition

### Test 2: Stale Data After Time Passes

1. Open TaxClients for firm F001
2. Note some clients
3. Wait 6 minutes
4. Still on same page
5. Clients still showing old data (from 6 min ago)
6. Admin adds new client to F001 in another browser
7. TaxClients page doesn't show new client until manual refetch

**Expected After Fix:** Auto-refetch after staleTime expires or immediate show

### Test 3: Error Persistence After Navigation

1. Upload document in DocumentsCentral
2. Force fail the upload (disconnect network)
3. See error: "Upload failed"
4. Navigate to Dashboard
5. Navigate back to DocumentsCentral
6. Old error message still displays

**Expected After Fix:** No error message on return (or only on active operation)

---

## Estimated Effort

- **Priority 1 (Critical):** 2-3 hours - Query prefetch + state reset
- **Priority 2 (High):** 3-4 hours - Error cleanup + validation
- **Priority 3 (Medium):** 2-3 hours - State consolidation
- **Priority 4 (Medium):** 4-5 hours - Complete invalidation audit

**Total Estimated:** 11-15 hours for complete fix

---

## Recommended Reading Order

1. **Start:** This file (CACHE_QUICK_SUMMARY.md)
2. **Then:** CACHE_ISSUE_DIAGRAMS.md (visual understanding)
3. **Details:** CACHE_ANALYSIS_REPORT.md (comprehensive guide)
4. **Code:** Specific files mentioned in "Files With Issues"

---

## Key Takeaway

The app has **foundational caching issues** that cause:

- ❌ User-visible errors in DocumentsCentral
- ⚠️ Silent data staleness in dashboards
- ⚠️ Incomplete cache invalidation after mutations

All issues are **solvable** through:

1. ✅ Proper query key cleanup on parameter changes
2. ✅ Explicit error state reset
3. ✅ Single source of truth (Query only, no Zustand duplication)
4. ✅ Comprehensive cache invalidation patterns

**Status:** Analysis Complete - Ready for Implementation
