# Cache Issues - Visual Diagrams & Flow Charts

## Diagram 1: DocumentsCentral Query Dependency Race Condition

```
IDEAL BEHAVIOR:
═══════════════════════════════════════════════════════════════

Select Firm F001
    ↓
    │ useGetTaxClients("F001") starts
    │ ├─ Loading: clients = []
    │ └─ Complete: clients = [F001 Client A, F001 Client B]
    │
    └─→ Select Firm F002
        ↓
        │ useGetTaxClients("F002") starts
        │ ├─ Loading: clients = ???  (PROBLEM HERE)
        │ └─ Complete: clients = [F002 Client X, F002 Client Y]

ACTUAL BEHAVIOR (PROBLEMATIC):
═════════════════════════════════════════════════════════════════

T=0ms:  Select Firm F001
        ├─ useGetTaxClients("F001") → ENABLED
        ├─ Loading... taxClients = (from cache)
        └─ clientsLoading = true

T=500ms: Request complete
        ├─ taxClients = [F001 Client A, F001 Client B]
        ├─ clientsLoading = false
        └─ Cache: { "F001": [F001 A, F001 B] }

T=510ms: USER SELECTS FIRM F002  ← ERROR STARTS HERE
        ├─ selectedFirmId = "F002"
        ├─ useGetTaxClients query key changes
        ├─ New query starts
        └─ clientsLoading = true (again)

        BUT: taxClients = [F001 Client A, F001 Client B]  ← STALE!

T=515ms: React renders Select component
        ├─ <SelectLabel>Tax Clients</SelectLabel>
        ├─ clientsLoading = true
        ├─ clientOptions.map() tries to render
        ├─ Each item is from F001, but context is F002
        └─ ERROR: "Cannot read property of F002 context" or similar

T=1000ms: F002 request completes
         ├─ taxClients = [F002 Client X, F002 Client Y]
         ├─ clientsLoading = false
         ├─ Select re-renders (now correctly showing F002 clients)
         └─ ERROR DISAPPEARS

PROBLEM WINDOW: 510ms - 1000ms (490ms of corrupted state)
```

---

## Diagram 2: Error Persistence Bug

```
SCENARIO: Client Selection Error with Multiple Firm Selections

T=0ms:   Select Firm F001
         └─→ useGetTaxClients("F001") starts

T=200ms: Request fails (network error)
         ├─ error = "Failed to load tax clients"
         ├─ clientsError = AxiosError object
         └─ Alert shows: "Failed to load tax clients: [error message]"

T=300ms: USER IMMEDIATELY SELECTS FIRM F002
         ├─ selectedFirmId = "F002"
         ├─ useGetTaxClients query key changes
         ├─ New query starts for F002
         │
         │ PROBLEM: Old error NOT cleared yet
         │
         └─ clientsError = still AxiosError from F001

T=305ms: React renders
         ├─ selectedFirmId = "F002" ✓
         ├─ clientsLoading = true ✓ (F002 loading)
         │
         │ BUT: {clientsError && selectedFirmId && (  ← CONDITION TRUE
         │   <Alert>Failed to load tax clients</Alert>  ← WRONG MESSAGE!
         │ )}
         │
         └─ Alert shows: "Failed to load tax clients"
            (from F001 failure, but shown for F002 context)

T=1000ms: F002 request succeeds
          ├─ error = null (cleared)
          ├─ clientsError = null
          ├─ Alert disappears
          └─ Clients display correctly

USER EXPERIENCE:
  1. Selects F002
  2. Sees "Failed to load tax clients" error immediately
  3. Thinks F002 failed, but error is from F001
  4. Confusion and distrust in app

ROOT CAUSE:
  TanStack Query doesn't automatically clear error from previous query
  when query key changes. Error persists in cache.
```

---

## Diagram 3: Parallel Query State Confusion

```
TIMELINE: Multiple Queries Running Simultaneously

T=0ms:   DocumentsCentral mounts
         ├─ useGetTaxFirms() starts          [Query A]
         ├─ useGetTaxClients("") disabled    [Query B - not running]
         └─ useLookupData() starts           [Query C]

T=100ms: User selects firm F001
         ├─ selectedFirmId = "F001"
         ├─ useGetTaxClients("F001") enables [Query B - starts NOW]
         │
         │ STATE AT THIS MOMENT:
         │ ├─ firmsLoading = true   (Query A still running)
         │ ├─ clientsLoading = true (Query B just started)
         │ ├─ lookupLoading = true  (Query C still running)
         │ │
         │ ├─ taxFirms = [] or (old cache)
         │ ├─ taxClients = [] or (old cache)
         │ └─ lookupData = {} or (old cache)
         │
         └─ SELECT COMPONENT RENDERS:
            ├─ Firm Select: Shows placeholder or old firms
            ├─ Client Select: Shows placeholder or old clients
            ├─ Document Type: Shows placeholder or old types
            └─ User sees: Loading state but unclear which field is loading

T=300ms: Query A completes (firms)
         ├─ firmsLoading = false
         ├─ taxFirms = [F001, F002, F003]
         └─ Firm Select updates ✓

T=500ms: Query B completes (clients)
         ├─ clientsLoading = false
         ├─ taxClients = [Client X for F001]
         └─ Client Select updates ✓

T=800ms: Query C completes (lookups)
         ├─ lookupLoading = false
         ├─ lookupData = {...}
         └─ Selects update ✓

ISSUE: Between T=100-300ms:
  - User sees loading spinners
  - But doesn't know which query is slow
  - User waits unnecessarily

BETTER FLOW: Prefetch
T=0ms:    useGetTaxFirms() starts
          └─ On success, prefetch useGetTaxClients for default/first firm

T=300ms:  Query A completes + prefetch starts
          ├─ Firms display
          └─ Clients already loading (prefetch)

T=500ms:  Query B prefetch completes
          └─ Clients appear almost immediately when user selects F001
```

---

## Diagram 4: Stale Time Impact

```
STALE TIME LIFECYCLE: Global staleTime = 5 minutes (300,000ms)

SCENARIO: User Returns to TaxClients After 6 Minutes

T=0s:    First visit to TaxClients
         ├─ useGetTaxClients("F001") starts
         └─ Cache: { queryKey: ["F001"], data: [...], staleTime: 300s }

T=5s:    Query completes
         ├─ data = [Client A, Client B]
         ├─ isFetching = false
         ├─ Cache entry marked "fresh"
         └─ Next refetch window: T=305s

T=360s:  User navigates away
         └─ Component unmounts
            Cache entry: STALE (360s > 300s stale window)

T=400s:  User returns to TaxClients
         └─ Component mounts
            ├─ useGetTaxClients("F001") runs
            │  ├─ Cache hit! Returns stale data immediately
            │  └─ Since refetchOnWindowFocus=false, no refetch
            │
            ├─ UI renders with 100-SECOND-OLD data
            └─ No "loading" state because cache hit immediate

T=410s:  User doesn't see updated clients
         ├─ Admin deleted a client at T=365s
         ├─ But user still sees it in UI
         ├─ User: "Why is the client still there?"
         └─ Confusion

QUERY STALE STATUS TIMELINE:
┌─────────────────────────────────────────────────────────┐
│ T=0s     T=5s            T=305s        T=360s            │
│  │        │               │             │                │
│  ▼        ▼               ▼             ▼                │
│ [Fetch]→[Fresh]→→→→→→→→→[STALE]→→→→→→[VERY STALE]     │
│          │<─ 300s ─>│                  │                │
│          (staleTime)                   (user returns)    │
└─────────────────────────────────────────────────────────┘

NO REFETCH TRIGGERED because:
  • refetchOnWindowFocus = false
  • No manual refetch on component mount
  • No automatic stale check
```

---

## Diagram 5: Cache Invalidation Pattern Comparison

```
CURRENT IMPLEMENTATION:
═════════════════════════════════════════════════════════════

useAddTaxClient mutation:
  onSuccess:
    └─→ invalidateQueries({
         queryKey: getGetApiV1TaxFirmTaxFirmIdTaxPersonClientsQueryKey(firmId)
       })

       └─ Invalidates: Tax clients list for that firm ✓
       └─ NOT invalidated: useGetTaxFirms (firm summary)
       └─ NOT invalidated: useGetContacts for same firm
       └─ NOT invalidated: Other firm lists

WHAT GETS STALE:
┌─────────────────────────────────────────┐
│ Added Client to F001                    │
├─────────────────────────────────────────┤
│ Invalidated:  ✓ TaxClients for F001     │
│ Stale:        ✗ Firm F001 summary       │
│ Stale:        ✗ Dashboard firm list     │
│ Stale:        ✗ DocumentsCentral list   │
└─────────────────────────────────────────┘


BETTER IMPLEMENTATION:
═════════════════════════════════════════════════════════════

useAddTaxClient mutation:
  onSuccess:
    └─→ Promise.all([
         invalidateQueries({ queryKey: ...TaxClients(firmId) }),
         invalidateQueries({ queryKey: ...TaxFirms() }),
         invalidateQueries({ queryKey: ...TaxFirmSummary(firmId) })
       ])

WHAT GETS INVALIDATED:
┌──────────────────────────────────┐
│ Added Client to F001             │
├──────────────────────────────────┤
│ Invalidated:  ✓ TaxClients F001  │
│ Invalidated:  ✓ All Firms list   │
│ Invalidated:  ✓ Firm summary     │
│ Fresh:        ✓ All displays     │
└──────────────────────────────────┘
```

---

## Diagram 6: Dual State Management Problem

```
CURRENT STATE ARCHITECTURE:

┌─────────────────────────────────────┐
│     useUploadDocuments Hook         │
├─────────────────────────────────────┤
│  TanStack Query Mutation:           │
│  ├─ isPending: true/false           │
│  ├─ error: AxiosError | null        │
│  └─ isSuccess: true/false           │
│                                     │
│  ALSO Updates Zustand Store:        │
│  ├─ setLoading(isPending)           │
│  ├─ setError(error?.message)        │
│  └─ setSuccess(isSuccess)           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  DocumentsCentral Component         │
├─────────────────────────────────────┤
│  Reads from ZUSTAND (not Query):    │
│  const { error, setSuccess } =      │
│    useCRMStore()                    │
│                                     │
│  Display logic:                     │
│  {error && <Alert>{error}</Alert>}  │
│                                     │
│  setSuccess() called in useEffect   │
│  after isSuccess + !isPending       │
└─────────────────────────────────────┘

PROBLEM: DUAL SOURCE OF TRUTH
═════════════════════════════════════════════════════════════

Scenario: Upload fails, user navigates away

T=0ms:    Upload starts
          ├─ Query: isPending = true
          └─ Store: isLoading = true

T=500ms:  Upload fails
          ├─ Query: error = AxiosError
          ├─ Store: error = "Upload failed"
          └─ Alert shows error ✓

T=600ms:  User navigates to Dashboard
          └─ DocumentsCentral unmounts
             └─ Component cleanup runs
                └─ Zustand store state PERSISTS (Redux-like)

T=700ms:  User navigates back to DocumentsCentral
          ├─ Component remounts
          ├─ Zustand store still has: error = "Upload failed"
          ├─ Query state is reset
          │  ├─ isPending = false
          │  ├─ error = null
          │  └─ isSuccess = false
          │
          └─ CONFLICT: Store shows old error, Query shows fresh state

RESULT:
  Alert displays: "Upload failed" (from old store)
  But: No current operation, no clear context
  User: "Why is there an error? Did something break?"


BETTER APPROACH: Single Source of Truth
═════════════════════════════════════════════════════════════

Remove Zustand for server state:
  ✓ Use TanStack Query for: loading, error, success
  ✗ Don't duplicate in Zustand

Keep Zustand for UI-only state:
  ✓ Use Zustand for: form values, UI toggle states, filters
  ✗ Don't put server state in Zustand

Result:
  When component unmounts, Query cache persists (correct)
  When component remounts, Query state is fresh (correct)
  Error only shows during active mutation (correct)
```

---

## Diagram 7: Query Key Change - Data Consistency

```
SCENARIO: User Switches Firms in DocumentsCentral

CURRENT FLOW (PROBLEMATIC):
────────────────────────────────────

T=0s:    Select Firm "F001"
         ├─ selectedFirmId = "F001"
         ├─ Query key = ["tax-clients", "F001"]
         ├─ Cache miss → fetch
         └─ taxClients = (loading)

T=300ms: Response arrives
         ├─ taxClients = [Client A for F001, Client B for F001]
         ├─ Cache: { key: ["tax-clients", "F001"], data: [...] }
         └─ Select displays: [Client A, Client B]

T=500ms: USER CLICKS FIRM "F002"
         ├─ selectedFirmId = "F002"
         ├─ Query key CHANGES: ["tax-clients", "F002"]  ← KEY CHANGE
         ├─ New fetch starts
         │
         │ BUT in state:
         ├─ taxClients = [Client A, Client B]  ← OLD DATA
         ├─ clientsLoading = true  ← NEW LOADING STATE
         │
         └─ Select displays old clients + loading state
            (CORRUPTED STATE)

T=700ms: F002 response arrives
         ├─ taxClients = [Client X for F002, Client Y for F002]
         ├─ clientsLoading = false
         └─ Select updates ✓


BETTER FLOW (FIX #1: Manual Reset):
────────────────────────────────────────

T=500ms: USER CLICKS FIRM "F002"
         ├─ selectedFirmId = "F002"
         ├─ queryClient.removeQueries({  ← CLEAR OLD CACHE
         │    queryKey: ["tax-clients", "F001"]
         │  })
         ├─ taxClients = []  ← RESET TO EMPTY
         ├─ Query key = ["tax-clients", "F002"]
         ├─ New fetch starts
         │
         └─ Select displays: empty + loading state ✓

T=700ms: F002 response arrives
         └─ taxClients = [Client X, Client Y]


BETTER FLOW (FIX #2: Prefetch):
────────────────────────────────────────

T=450ms: User hovers over Firm F002 dropdown
         ├─ queryClient.prefetchQuery({  ← PREFETCH
         │    queryKey: ["tax-clients", "F002"]
         │  })
         └─ Background fetch starts

T=500ms: USER CLICKS FIRM "F002"
         ├─ selectedFirmId = "F002"
         ├─ Query key = ["tax-clients", "F002"]
         ├─ Cache HIT: Data already loading (prefetch)
         └─ taxClients = (from prefetch, likely complete)

T=550ms: Select displays: [Client X, Client Y]  ← INSTANT
```

---

## Diagram 8: Lookup Data Caching (Current vs Recommended)

```
CURRENT IMPLEMENTATION:
═════════════════════════════════════════════════════════════

useLookupData()  ← Called by 5+ components
  │
  └─→ useGetApiV1Lookup()
      ├─ staleTime: 5min (global default)
      ├─ gcTime: 10min (global default)
      └─ Request: ONE time only (query deduplication)
                    ↓
         ┌──────────────────────────────────┐
         │  SHARED CACHE                    │
         │  ├─ firmTypes                    │
         │  ├─ credentialsTypes             │
         │  ├─ leadStatusTypes              │
         │  └─ contactMethodTypes           │
         └──────────────────────────────────┘
                    ↓
         Used by ALL:
         ├─ AddFirmCRM (firm types dropdown)
         ├─ Dashboard (edit dialog dropdowns)
         ├─ TaxPersonClientForm (contact method)
         ├─ Contacts (contact method)
         └─ TaxClients (contact method)

CACHE LIFECYCLE:
T=0s:     First component mounts, data fetches
T=5s:     Response arrives, data cached
T=300s:   STALE (5min passed)
T=360s:   User opens AddFirmCRM
          ├─ Uses lookup data
          ├─ Shows firm types from cache
          ├─ If new firm type added 30s ago, NOT SHOWN
          └─ User: "Why isn't my new firm type available?"

PROBLEM: Dropdown shows admin-added options after 5-minute delay


RECOMMENDED IMPLEMENTATION #1: Static Lookup
═════════════════════════════════════════════════════════════

useLookupData()
  └─→ useGetApiV1Lookup({
       query: {
         staleTime: Infinity,  ← NEVER STALE (cache forever)
         gcTime: Infinity      ← NEVER GARBAGE COLLECT
       }
     })

BENEFIT: One network request, cached for session lifetime
RISK: Admin adds lookup, won't appear until app reload


RECOMMENDED IMPLEMENTATION #2: With Invalidation Hook
═════════════════════════════════════════════════════════════

useInvalidateLookupData()
  └─→ Called by admin panel after adding new lookup
      └─ queryClient.invalidateQueries({
           queryKey: ["lookup"]
         })
         └─ Next call to useLookupData() refetches


RECOMMENDED IMPLEMENTATION #3: Background Refresh
═════════════════════════════════════════════════════════════

useLookupData()
  └─→ useGetApiV1Lookup({
       query: {
         staleTime: 1000 * 60 * 30,  ← Stale after 30min
         refetchInterval: 1000 * 60 * 60  ← Refetch every hour
       }
     })

BENEFIT: Always fresh, but with background refetch
COST: Extra network request every hour per user
```

---

## Diagram 9: Error State Cleanup Missing

```
ERROR LIFECYCLE (CURRENT - PROBLEMATIC):

Document Upload Flow:
┌────────────────────────────────────────┐
│ T=0ms: User clicks "Upload Documents" │
├────────────────────────────────────────┤
│ mutation starts                        │
│ ├─ isPending = true                    │
│ ├─ error = null                        │
│ └─ Store state: loading = true         │
└────────────────────────────────────────┘
                  │
                  ├─ Network: POST /api/documents
                  │
                  ▼
┌────────────────────────────────────────┐
│ T=500ms: Upload fails (network error)  │
├────────────────────────────────────────┤
│ onError called                         │
│ ├─ isPending = false                   │
│ ├─ error = AxiosError                  │
│ ├─ Alert shows: "Upload failed"        │
│ └─ Store: error = "Upload failed"      │
└────────────────────────────────────────┘
                  │
                  │ User navigates away
                  ▼
┌────────────────────────────────────────┐
│ T=600ms: Component unmounts            │
├────────────────────────────────────────┤
│ DocumentsCentral unmounts              │
│ ├─ Query cache persists (correct)      │
│ ├─ Zustand store persists (PROBLEM)    │
│ │  └─ store.error = "Upload failed"    │
│ └─ Component cleanup skips error clear │
└────────────────────────────────────────┘
                  │
                  │ User navigates back
                  ▼
┌────────────────────────────────────────┐
│ T=800ms: Component remounts            │
├────────────────────────────────────────┤
│ useCRMStore() called                   │
│ ├─ error = "Upload failed" (STALE!)    │
│ ├─ No current mutation running         │
│ ├─ Alert displays old error            │
│ └─ User confused (no context)          │
└────────────────────────────────────────┘


BETTER APPROACH: Automatic Cleanup

┌──────────────────────────────────────────────────┐
│ DocumentsCentral Component:                      │
├──────────────────────────────────────────────────┤
│ useEffect(() => {                                │
│   return () => {                                 │
│     // Cleanup on unmount                        │
│     queryClient.removeQueries({                  │
│       queryKey: ["client-documents", "upload"]   │
│     });                                          │
│     // Clear form state                          │
│     reset();                                     │
│   };                                             │
│ }, []);                                          │
└──────────────────────────────────────────────────┘

RESULT:
  ✓ On unmount: error state cleared
  ✓ On remount: fresh state (no old errors)
  ✓ User experience: No stale error messages
```

---

## Diagram 10: Recommended Cache Architecture

```
IDEAL STATE MANAGEMENT ARCHITECTURE:
═════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│                   REACT COMPONENT                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐       ┌──────────────────┐          │
│  │ Server State     │       │ UI State         │          │
│  │ (TanStack Query) │       │ (Zustand)        │          │
│  ├──────────────────┤       ├──────────────────┤          │
│  │ useGetTaxFirms() │       │ selectedFirmId   │          │
│  │ useGetTaxClients │       │ isDialogOpen     │          │
│  │ useMutation()    │       │ formValues       │          │
│  │                  │       │ sortBy           │          │
│  │ State:           │       │ filterText       │          │
│  │ ├─ data         │       │                  │          │
│  │ ├─ isLoading    │       │ Methods:         │          │
│  │ ├─ error        │       │ ├─ setFirmId()   │          │
│  │ ├─ isFetching   │       │ ├─ setSort()     │          │
│  │ └─ isSuccess    │       │ └─ toggleDialog()│          │
│  │                  │       └──────────────────┘          │
│  │ Methods:        │                                      │
│  │ ├─ refetch()    │       NO DIRECT BINDING             │
│  │ └─ invalidate() │       Server ← → UI State            │
│  └──────────────────┘                                      │
│         ↑                                                   │
│         │ Derived/transformed                             │
│         │ (computed values)                               │
│         │                                                  │
│         ▼ Display on screen                               │
│  ┌──────────────────────────┐                             │
│  │ Filtered/sorted results: │                             │
│  │ const displayItems =      │                             │
│  │  taxClients                                             │
│  │   .filter(...)            │                             │
│  │   .sort(...)              │                             │
│  └──────────────────────────┘                             │
└─────────────────────────────────────────────────────────────┘


KEY PRINCIPLES:
═════════════════════════════════════════════════════════════

1. SEPARATION OF CONCERNS
   ├─ Server state (Query) ← Remote data
   └─ UI state (Zustand) ← Component-specific UI

2. SINGLE SOURCE OF TRUTH
   ├─ Server data: TanStack Query cache ONLY
   ├─ Form UI: React Hook Form ONLY
   ├─ Global UI: Zustand ONLY
   └─ Never duplicate in multiple stores

3. UNIDIRECTIONAL DATA FLOW
   ├─ Component mounts
   ├─ Query fetches data
   ├─ Cache stores data
   ├─ Component reads from cache
   └─ Component displays data

   NOT:
   ├─ Copy Query data to Zustand
   ├─ Component reads from Zustand
   ├─ Two sources diverge
   └─ Sync problems occur

4. CACHE INVALIDATION STRATEGY
   ├─ On mutation success:
   │  └─ queryClient.invalidateQueries({ queryKey: [...] })
   ├─ On navigation/unmount:
   │  └─ Clean up dependent cache entries
   └─ On parameter change:
      └─ Clear old cache key, prefetch new

5. ERROR HANDLING
   ├─ Errors stored in Query cache
   ├─ Component reads error from Query
   ├─ Error cleared when:
   │  ├─ Query succeeds
   │  ├─ Component unmounts
   │  └─ Query key changes
   └─ No manual error reset needed
```

---

## Summary: Problem Categories

```
CATEGORY 1: QUERY PARAMETER CHANGE ISSUES
───────────────────────────────────────────
When selectedFirmId changes:
  ✗ Old data still in component state
  ✗ New query key fetches, but renders with old data
  ✗ User sees mixed old/new information
  ✗ Race condition in UI rendering

AFFECTED COMPONENTS:
  • DocumentsCentral (firm → clients)
  • TaxClients (firm → clients)
  • Contacts (firm → contacts)


CATEGORY 2: CACHE INVALIDATION GAPS
──────────────────────────────────────
After mutations (add/edit/delete):
  ✗ Direct child queries invalidated ✓
  ✗ Parent/sibling queries stale ✗
  ✗ Related dashboards show old data ✗

AFFECTED MUTATIONS:
  • useAddTaxClient
  • useAddContact
  • useDeleteTaxClient
  • useDeleteContact


CATEGORY 3: DUAL STATE MANAGEMENT
───────────────────────────────────
Zustand store duplicates Query state:
  ✗ isLoading in both places
  ✗ error in both places
  ✗ success in both places
  ✗ Sync problems when one updates without other

AFFECTED OPERATIONS:
  • useUploadDocuments
  • useAddTaxFirm


CATEGORY 4: STALE DATA DISPLAY
────────────────────────────────
Old data displayed when it shouldn't be:
  ✗ Component unmounts → remounts after 6 minutes
  ✗ Stale window passed (5 minutes)
  ✗ Component renders with 6-minute-old data
  ✗ User doesn't know data is stale

AFFECTED COMPONENTS:
  • TaxClients
  • Contacts
  • DocumentsCentral
  • Dashboard


CATEGORY 5: ERROR STATE PERSISTENCE
─────────────────────────────────────
Errors persist incorrectly:
  ✗ Old query error displays with new query context
  ✗ Error from firm F001 shows while loading F002
  ✗ User confused about error source
  ✗ Error doesn't clear on query key change

AFFECTED COMPONENTS:
  • DocumentsCentral (client selection)
  • TaxClients (any error)
```

---

**All diagrams represent real issues found in the codebase.**  
**See CACHE_ANALYSIS_REPORT.md for detailed explanations and fixes.**
