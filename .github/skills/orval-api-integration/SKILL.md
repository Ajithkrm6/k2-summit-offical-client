---
name: orval-api-integration
description: Integrate newly generated Orval API endpoints with typed custom hooks and only the client state stores that are actually needed.
---

# Orval API integration

Use this skill after Orval generates or updates API files, or when asked to wire an API endpoint into the application.

## Workflow

1. Inspect the generated endpoint function, React Query hook, request/response types, and the existing hooks and stores for the relevant feature.
2. Treat `src/lib/api/generated/` as generated output. Never hand-edit it; change the OpenAPI source or Orval configuration when generation needs correction.
3. Prefer the generated React Query hook for queries and mutations. Use its typed arguments and options, and inspect whether the generated function returns an `AxiosResponse` before choosing what data to expose.
4. Add a custom hook under `src/lib/api/hooks/k2-tax-api/` only when the application needs a useful abstraction or behavior, such as response shaping, cache invalidation, notifications, or feature-specific mutation callbacks. Otherwise, use the generated hook directly.
5. Keep request lifecycle and remote API data in TanStack Query. Do not mirror `isLoading`, `isPending`, `error`, `success`, or cached response data into Zustand by default.
6. Add or update a feature store only for client-side state that must be shared across components or screens and is not server state (for example, a multi-step draft or shared selection). Reuse the existing feature store when appropriate; do not create one store per endpoint.
7. For multipart/file endpoints, verify whether Orval already constructs `FormData` and appends every field. Reuse that implementation instead of duplicating the request or form-data conversion in a custom hook.
8. Use same-origin `/api/*` routes for browser requests. Preserve the application's .NET cookie-auth architecture; never add browser token storage or direct browser calls to the Azure API.
9. Export new custom hooks from the feature barrel and, if needed, the top-level hooks barrel. Follow existing naming, formatting, error, and notification patterns.
10. Update directly related API documentation if the integration changes documented usage. Run the narrowest relevant lint, type-check, or test command available.

## State ownership

- **TanStack Query:** remote data, cache, refetching, and per-request pending/error/success state.
- **Zustand:** shared client/UI or workflow state that must outlive an individual component's local state.
- **Custom hook:** an optional feature-facing interface over generated hooks; it should not introduce a second source of truth for mutation state.

If requirements genuinely call for globally observable request status, keep one authoritative source where possible. Do not add Zustand status fields just because an API is a mutation.

## Completion

After integrating an endpoint, summarize:

- which generated endpoint hook is used;
- whether a custom wrapper was warranted and why;
- whether a store was warranted and why (or why not);
- files changed and validation performed.
