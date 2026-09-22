# API Integration Structure

This directory contains auto-generated API clients and custom hooks for consuming APIs.

## Directory Layout

```
src/lib/api/
├── generated/              # Generated code from Orval (DO NOT EDIT MANUALLY)
│   └── k2-tax-api/        # K2 Tax API endpoints
│       ├── index.ts       # Auto-generated barrel export
│       ├── services/      # Auto-generated service files (one per tag)
│       ├── models/        # Auto-generated TypeScript types
│       └── ...           # Other Orval-generated files
│
├── hooks/                  # Custom React hooks wrapping generated clients
│   └── k2-tax-api/        # Hooks for K2 Tax API
│       ├── useAuth.ts     # Authentication hooks
│       ├── useUsers.ts    # User management hooks
│       └── ...           # Other custom hooks
│
├── core/                   # Shared API utilities
│   ├── interceptors.ts    # Axios interceptors
│   ├── error-handler.ts   # Error handling utilities
│   └── ...               # Other shared utilities
│
└── api-client.ts          # Base Axios client instance (used by Orval)
```

## Workflow

### 1. Generate API Types from Swagger

When the backend API updates its Swagger/OpenAPI spec, regenerate the types:

```bash
# One-time generation
pnpm generate:api

# Watch for changes (useful during development)
pnpm generate:api:watch
```

### 2. Generated Files (Auto-managed by Orval)

- **`services/`** - One file per API tag, contains generated query/mutation hooks
- **`models/`** - TypeScript interfaces for request/response bodies
- **`index.ts`** - Barrel export of all generated hooks

These files should NOT be manually edited. To customize, use wrapper hooks.

### 3. Custom Hooks (src/lib/api/hooks/k2-tax-api/)

Wrap generated hooks to add business logic:

```typescript
// src/lib/api/hooks/k2-tax-api/useAuth.ts
import { useLogin, useLogout } from "@/lib/api/generated/k2-tax-api";
import { useAuthStore } from "@/modules/auth/store/auth.store";

export const useCustomLogin = () => {
  const { mutate, ...rest } = useLogin();

  return {
    login: async (credentials) => {
      mutate(credentials, {
        onSuccess: (data) => {
          // Custom auth store update
          useAuthStore.setState({ user: data.user });
        },
      });
    },
    ...rest,
  };
};
```

### 4. Usage in Components

```typescript
import { useCustomLogin } from '@/lib/api/hooks/k2-tax-api/useAuth';

export const LoginForm = () => {
  const { login, isPending } = useCustomLogin();

  return (
    <button onClick={() => login({ email, password })} disabled={isPending}>
      {isPending ? 'Loading...' : 'Login'}
    </button>
  );
};
```

## Adding a New API

1. Add new Orval project to `orval.config.ts`
2. Run `pnpm generate:api`
3. Create wrapper hooks in `src/lib/api/hooks/{spec-name}/`
4. Export from `src/lib/api/hooks/index.ts`

## Notes

- ✅ **Auto-generated**: Do not edit `/src/lib/api/generated/`
- ✅ **Manual**: Add business logic in `/src/lib/api/hooks/`
- ✅ **Shared**: Put utilities in `/src/lib/api/core/`
- ✅ **Client**: Uses the configured `apiClient` instance with auth interceptors
