# Medium & Low Priority Cache Issues - Detailed Analysis

**Date:** 2026-11-04  
**Scope:** Understanding MEDIUM and LOW priority cache issues without implementation  
**Total Issues:** 7 (5 MEDIUM + 2 LOW)

---

## Overview Summary

| Severity  | Count | Components Affected     | User Impact                    |
| --------- | ----- | ----------------------- | ------------------------------ |
| 🟡 MEDIUM | 5     | All CRM components      | Moderate - rare, mostly silent |
| 🟢 LOW    | 2     | DocumentsCentral, Forms | Minimal - very rare            |

---

## 🟡 MEDIUM Priority Issues

### **MEDIUM Issue #1: Query Enabled Conditions Create Stale States**

**File:**

- `src/lib/api/hooks/k2-tax-api/useGetTaxClients.ts`
- `src/lib/api/hooks/k2-tax-api/useGetContacts.ts`

**Current Code:**

```typescript
export const useGetTaxClients = (taxFirmId: string) => {
  const { data, isLoading, error, refetch } =
    useGetApiV1TaxFirmTaxFirmIdTaxPersonClients(taxFirmId, {
      query: { enabled: Boolean(taxFirmId) }, // ← THE PROBLEM
    });

  return {
    taxClients: data?.data ?? [],
    isLoading,
    error,
    refetch,
  };
};
```

**What's the Problem?**

When `enabled: Boolean(taxFirmId)` is used:

- If `taxFirmId = ""` → query is DISABLED, doesn't fetch
- When `taxFirmId` changes to `"F001"` → query becomes ENABLED
- Component still shows old state from previous render
- User sees temporary "no clients" before "loading" state appears

**Example Scenario:**

```
Timeline:
T=0ms:    User opens DocumentsCentral (taxFirmId = "")
          query disabled, taxClients = []

T=100ms:  User selects firm "F001" (taxFirmId = "F001")
          query ENABLES and starts fetching
          BUT: Component renders with taxClients still = []
          UI briefly shows: "No clients available"

T=200ms:  clientsLoading = true
          Component re-renders showing: "Loading clients..."

T=500ms:  Data arrives
          Component shows: Actual client list
```

**User Experience Impact:**

- ⚠️ Brief flicker: "No clients" → "Loading" → Client list
- ⚠️ User might click dropdown, see "No clients", then click again
- ⚠️ Confusion about whether data exists

**Why It Happens:**
The React Hook Form doesn't know about the "enabled" transition. It sees:

1. First render: `taxClients = []`
2. Query enables and fetches
3. Second render: `isLoading = true`, but still rendering `taxClients = []`

---

### **MEDIUM Issue #2: Missing Firm List Invalidation After Adding Client/Contact**

**Files:**

- `src/lib/api/hooks/k2-tax-api/useAddTaxClient.ts` (Line 35-50)
- `src/lib/api/hooks/k2-tax-api/useAddContact.ts` (Line 40-50)

**Current Code:**

```typescript
export const useAddTaxClient = ({ onSuccess }: UseAddTaxClientProps = {}) => {
  const queryClient = useQueryClient();
  const { mutate, isPending, isSuccess, error } =
    usePostApiV1TaxFirmTaxfirmidTaxPersonClient({
      mutation: {
        onSuccess: async (response, variables) => {
          // Only invalidates clients for THIS firm
          await queryClient.invalidateQueries({
            queryKey: getGetApiV1TaxFirmTaxFirmIdTaxPersonClientsQueryKey(
              variables.taxfirmid,
            ),
          });

          // ❌ MISSING: Doesn't invalidate firm summaries/stats
          // ❌ MISSING: Doesn't invalidate parent firm list
        },
        // ...
      },
    });
};
```

**What's the Problem?**

When you add a new tax client to a firm:

1. The clients list is invalidated ✅
2. BUT the firm summary/stats are NOT invalidated ❌

**Example Scenario:**

```
Scenario: Dashboard shows "Firm Summary" with client count

T=0ms:    Dashboard loads firm data
          Display: "ABC Tax Services - 5 clients"
          Cache: firmSummaries["F001"] = { count: 5, ... }

T=100ms:  User navigates to TaxClients
          Adds 1 new client to F001
          Client list refreshes correctly

T=200ms:  User navigates back to Dashboard
          Display: STILL shows "ABC Tax Services - 5 clients"
          Should show: 6 clients
```

**Why It Happens:**

- `useAddTaxClient` only invalidates the `taxClients` query
- It doesn't know about or invalidate `taxFirmSummaries` or related queries
- Those queries aren't part of the mutation hook's invalidation scope

**User Experience Impact:**

- ⚠️ Silent data inconsistency on dashboard
- ⚠️ User adds client, but count doesn't update immediately
- ⚠️ User must manually refresh dashboard to see correct count
- ⚠️ Can be confusing if user is tracking metrics

---

### **MEDIUM Issue #3: Lookup Data Not Invalidated When Changed by Admin**

**File:** `src/lib/api/hooks/k2-tax-api/useLookupData.ts`

**Current Code:**

```typescript
export const useLookupData = () => {
  const { data } = useQuery({
    queryKey: ["lookupData"],
    queryFn: fetchLookupData,
    staleTime: 1000 * 60 * 5, // ← 5 MINUTE CACHE
    // No automatic invalidation strategy
  });

  return {
    contactMethodTypes: data?.contactMethodTypes ?? [],
    // ... other lookup data
  };
};
```

**What's the Problem?**

Lookup data (firm types, credentials, contact methods, etc.) is cached for 5 minutes. If an admin adds a new option, users won't see it for up to 5 minutes.

**Example Scenario:**

```
Scenario: Admin adds new credential type "EIN Verification"

T=0min:    User A opens AddTaxFirm form
           useLookupData caches credential types
           Display: "Credential Type: [Tax ID, SSN, EIN]"

T=1min:    Admin adds new credential type
           Backend now has: [Tax ID, SSN, EIN, EIN Verification]

T=2min:    User A refreshes page
           useLookupData still returns cached data
           Display: STILL shows "[Tax ID, SSN, EIN]"
           Missing the new option!

T=5min:    Cache expires, fresh data fetched
           Display: NOW shows "[Tax ID, SSN, EIN, EIN Verification]"
```

**Why It Happens:**

- `staleTime = 5 minutes` means data is considered fresh for 5 minutes
- No invalidation triggers from server or admin events
- No polling or WebSocket to notify clients of changes
- Each client independently waits for their cache to expire

**User Experience Impact:**

- ⚠️ New lookup options not available immediately
- ⚠️ User might search for new option that exists but isn't shown
- ⚠️ Frustrating if admin is actively adding options
- ⚠️ Multi-user workflows disrupted (one user sees new option, another doesn't)

---

### **MEDIUM Issue #4: Parallel Query Dependencies with Potential Key Collisions**

**File:** `src/modules/crm/components/DocumentsCentral.tsx`

**Current Code:**

```typescript
export const DocumentsCentral = () => {
  const [selectedFirmId, setSelectedFirmId] = useState("");

  // Query A: All firms
  const { taxFirms } = useGetTaxFirms();

  // Query B: Depends on firm selection
  const { taxClients } = useGetTaxClients(selectedFirmId);

  // Query C: Depends on client selection
  const { uploadDocuments } = useUploadDocuments();

  // If two firms selected rapidly:
  // useGetTaxClients("F001") and useGetTaxClients("F002") execute in parallel
  // Query keys SHOULD be: ["taxClients", "F001"] vs ["taxClients", "F002"]
  // But if key generation is wrong, they might collide
};
```

**What's the Problem?**

When queries with dynamic parameters execute in parallel, there's a small risk of cache key collisions if:

1. Query key generation uses wrong parameter
2. Query function doesn't properly distinguish between parameters
3. Race condition in Orval-generated code

**Example Scenario (Unlikely but Possible):**

```
Scenario: User rapidly switches between firms

T=0ms:    Select Firm F001
          Query starts: getGetApiV1TaxFirmTaxFirmIdTaxPersonClients("F001")
          Query key: ["taxClients", "F001"]

T=50ms:   Select Firm F002 (very quickly)
          Query starts: getGetApiV1TaxFirmTaxFirmIdTaxPersonClients("F002")
          Query key: ["taxClients", "F002"]
          But if key generation has bug: might also be ["taxClients", "F002"]
          Both queries race to populate same cache key

T=100ms:  F002 data arrives
          Looks correct (happens to be F002)

T=150ms:  F001 data arrives
          Overwrites cache with F001 data
          User selected F002, sees F001 clients ❌
```

**Why It Happens:**

- TanStack Query relies on query keys being unique
- With Orval-generated keys, this SHOULD work correctly
- But if parameters are in wrong order or missing, collision possible

**Risk Assessment:**

- 🟢 Very low risk (Orval usually generates correct keys)
- But worth verifying in logs if weird behavior occurs

**User Experience Impact:**

- ⚠️ Wrong client data shown after rapid firm switching
- ⚠️ Very rare (only on fast switching)
- ⚠️ User is confused why wrong data appears

---

### **MEDIUM Issue #5: Dual State Management (Zustand + TanStack Query)**

**File:** `src/modules/crm/store/crm.store.ts`

**Current Code:**

```typescript
interface CRMState {
  // ❌ These duplicate TanStack Query state
  isLoading: boolean;
  error: string | null;
  success: boolean;

  // These are fine (client UI state)
  selectedTab: string;
  isDialogOpen: boolean;
}

// In useUploadDocuments.ts:
const { error, setSuccess } = useCRMStore();
// Updates Zustand store AND TanStack Query simultaneously
// Two sources of truth!
```

**What's the Problem?**

There are TWO sources of truth for the same data:

1. **TanStack Query state** - The "real" state from the server query/mutation
2. **Zustand store state** - A duplicate copy in global store

When they get out of sync, behavior is unpredictable.

**Example Scenario:**

```
Scenario: Upload document fails, then user navigates

T=0s:     User uploads document
          TanStack Query: isPending = true, error = null
          Zustand: isLoading = true, error = null

T=2s:     Upload fails
          TanStack Query: isPending = false, error = "Upload failed"
          Zustand: isLoading = false, error = "Upload failed"
          ✅ Both in sync

T=3s:     User navigates to Dashboard
          Component unmounts
          TanStack Query: error cleared (fresh component)
          Zustand: error persists (not cleared automatically)

T=4s:     User navigates back to DocumentsCentral
          Component mounts
          TanStack Query: error = null (fresh start)
          Zustand: error = "Upload failed" (persists from step T=2s!)
          User sees old error even though it's a fresh upload ❌
```

**Why It Happens:**

- Zustand is persistent across component unmounts
- TanStack Query state is scoped to query instances
- When component remounts, TanStack Query fresh but Zustand unchanged
- Error persists because nobody clears the Zustand store

**User Experience Impact:**

- ⚠️ Old error messages persist after navigation
- ⚠️ User confused about which operation the error relates to
- ⚠️ Errors might show for unrelated operations
- ⚠️ User has to manually dismiss or refresh

---

## 🟢 LOW Priority Issues

### **LOW Issue #1: Error Display Timing Race Condition**

**File:** `src/modules/crm/components/DocumentsCentral.tsx` (lines 169-183)

**Current Code:**

```typescript
{clientsError && selectedFirmId && (
  <Alert variant="destructive">
    <AlertDescription>
      Failed to load tax clients: {clientsError.message}
    </AlertDescription>
  </Alert>
)}
```

**What's the Problem?**

Brief timing window where old error displays with new firm context.

**Example Scenario:**

```
Scenario: User selects firm, query fails, immediately switches firm

T=0ms:    Select Firm F001
          Query starts fetching

T=100ms:  Query fails for F001
          clientsError = "Failed to load clients"
          clientsError.message = "Network error"
          Display: "Failed to load tax clients: Network error"

T=110ms:  User immediately selects Firm F002
          selectedFirmId changes to "F002"
          New query starts for F002
          Old error still present

T=120ms:  Component renders with:
          selectedFirmId = "F002" (new)
          clientsError = "Network error" (from F001!)
          Display: "Failed to load tax clients: Network error"
          BUT error is from F001, not F002! ❌

T=130ms:  F002 data arrives successfully
          clientsError clears
          Display: Client list for F002
```

**Why It Happens:**

- Error clearing isn't synchronized with firm selection
- Between selecting new firm and new query arriving, old error shows
- TanStack Query hasn't reset error for new query key yet

**User Experience Impact:**

- 🟢 Very brief (20-30ms typically)
- 🟢 User unlikely to notice
- ⚠️ If user is looking at UI, might see wrong error message
- ⚠️ Rare and temporary (error disappears when new data arrives)

---

### **LOW Issue #2: TaxYear Field Type Inconsistency**

**Files:**

- `src/modules/crm/components/AddTaxClient.tsx` - stores as string
- `src/modules/crm/components/TaxPersonClientForm.tsx` - stores as string
- `src/modules/crm/components/DocumentsCentral.tsx` - stores as number
- `src/modules/crm/lib/schemas.ts` - validation expects string

**What's the Problem?**

The tax year field is stored inconsistently:

- Sometimes as STRING: "2026"
- Sometimes as NUMBER: 2026

This could theoretically cause cache key mismatches.

**Example Scenario:**

```
Query A: useGetTaxData({ taxYear: 2026 })     // number
Query B: useGetTaxData({ taxYear: "2026" })   // string

Query keys generated:
A: ["taxData", 2026]      // number in key
B: ["taxData", "2026"]    // string in key

Are they the same cache entry? ❌ NO!

Potential issue:
- Component A fetches with number
- Component B tries to reuse cache
- Cache miss because keys don't match
- Unnecessary API call
```

**Why It Happens:**

- Different form components handle year differently
- No centralized type validation
- Orval-generated types might accept both

**User Experience Impact:**

- 🟢 Minimal (redundant API calls at worst)
- 🟢 Very unlikely to cause user-facing issues
- ⚠️ Affects performance slightly (extra network requests)
- ⚠️ Not a data correctness issue

---

## Impact Assessment

### **MEDIUM Issues Summary**

| Issue                        | Frequency  | Severity | When It Occurs             |
| ---------------------------- | ---------- | -------- | -------------------------- |
| #1 Query Enabled Transitions | Common     | Low      | Every firm selection       |
| #2 Missing Firm Invalidation | Rare       | Medium   | When adding client/contact |
| #3 Lookup Data Stale         | Rare       | Low      | When admin adds options    |
| #4 Parallel Key Collisions   | Very Rare  | High     | Fast firm switching        |
| #5 Dual State Management     | Occasional | Medium   | After errors + navigation  |

---

### **LOW Issues Summary**

| Issue           | Frequency | Severity | When It Occurs                              |
| --------------- | --------- | -------- | ------------------------------------------- |
| #1 Error Timing | Rare      | Low      | Fast firm switching after error             |
| #2 TaxYear Type | Very Rare | Very Low | If multiple components fetch simultaneously |

---

## Visual Comparison: Impact Timeline

```
CRITICAL/HIGH Issues (Already Fixed):
├─ User Impact: IMMEDIATE (every user, every session)
├─ Frequency: COMMON (happens regularly)
└─ Users Affected: ALL

MEDIUM Issues:
├─ User Impact: DELAYED (might not notice at all)
├─ Frequency: OCCASIONAL (happens sometimes)
└─ Users Affected: SOME (power users, edge cases)

LOW Issues:
├─ User Impact: MINIMAL (very brief or silent)
├─ Frequency: RARE (rarely happens)
└─ Users Affected: FEW (only in specific scenarios)
```

---

## Do These Issues Need Fixing?

### Short Answer: MAYBE

**MEDIUM Issues:**

- ✅ Would improve user experience
- ✅ Would reduce confusion
- ⚠️ Not critical (users can work around)
- ⚠️ Low priority vs. CRITICAL/HIGH fixes

**LOW Issues:**

- ✅ Would be nice to fix
- ⚠️ Unlikely to affect most users
- ⚠️ Can wait until performance optimization phase

---

## Implementation Difficulty

| Issue                        | Difficulty | Effort                         |
| ---------------------------- | ---------- | ------------------------------ |
| #1 Query Enabled Transitions | Easy       | 30 minutes                     |
| #2 Missing Firm Invalidation | Easy       | 20 minutes                     |
| #3 Lookup Data Stale         | Medium     | 1-2 hours                      |
| #4 Parallel Key Collisions   | Hard       | 2-3 hours (investigation only) |
| #5 Dual State Management     | Hard       | 3-4 hours (refactoring)        |
| #1 Error Timing              | Very Easy  | 15 minutes                     |
| #2 TaxYear Type              | Easy       | 20 minutes                     |

---

## Recommendation

**For Now:**

1. ✅ HIGH/CRITICAL fixes already done (cache prefetch, error reset)
2. ⏸️ MEDIUM issues: Can fix later if users report issues
3. ⏸️ LOW issues: Not worth fixing unless performance problem

**Next Phase:**

1. Fix MEDIUM #5 (Dual State Management) - Most impactful
2. Fix MEDIUM #2 (Firm Invalidation) - Easy and useful
3. Monitor for MEDIUM #1, #3, #4 issues in production

---

## Conclusion

The CRITICAL and HIGH priority issues (already fixed) addressed the main user-facing problems:

- Stale data race conditions
- Error persistence
- Smooth transitions

The MEDIUM and LOW issues are:

- **Mostly silent** (user might not notice)
- **Rare edge cases** (unlikely to occur)
- **Nice to have** (would improve experience)

Focus should be on production testing and monitoring before addressing these.
