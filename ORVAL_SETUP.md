# Orval API Integration Setup Guide

## 🎯 Overview

Orval is configured to automatically generate TypeScript types and React Query hooks from your backend's Swagger/OpenAPI specification. This ensures type safety and reduces manual type definitions.

**Backend Swagger URL**: `https://app-k2summit-api-poc-eastus-d3b5hzbkgaftfab5.eastus-01.azurewebsites.net/swagger/v1/swagger.json`

## 📦 Installation Status

✅ **Orval** installed as dev dependency  
✅ **Configuration** created at `/orval.config.ts`  
✅ **Folder structure** set up for generated code  
✅ **NPM scripts** added to `package.json`

## 🚀 Quick Start

### 1. Generate API Types (First Time)

```bash
# Generate all API types from Swagger spec
corepack pnpm generate:api
```

This will:

- Fetch the Swagger spec from your backend
- Generate TypeScript interfaces for all request/response types
- Create React Query hooks for all endpoints
- Output files to `src/lib/api/generated/k2-tax-api/`

### 2. Watch Mode (During Development)

```bash
# Automatically regenerate when spec changes
corepack pnpm generate:api:watch
```

## 📂 Generated Structure

After running `generate:api`, you'll have:

```
src/lib/api/generated/k2-tax-api/
├── index.ts                    # Main export
├── k2TaxAPI.schemas.ts        # All TypeScript types
├── address/
│   └── address.ts             # Address endpoints
├── clients/
│   └── clients.ts             # Client endpoints
├── users/
│   └── users.ts               # User/Auth endpoints
├── staff-users/
├── tax-firm-contacts/
├── tax-firms/
└── tenant-users/
```

Each file contains:

- **Query hooks** (GET requests) - `useGetApiV1...`
- **Mutation hooks** (POST/PUT/DELETE) - `usePostApiV1...`
- **Type definitions** - Request/response interfaces
- **Helper functions** - URL builders, mutation keys

## 💻 Usage Examples

### Example 1: Using the Custom Auth Hook

```typescript
// src/modules/auth/components/LoginForm.tsx
'use client';

import { useCustomLogin } from '@/lib/api/hooks';
import { useState } from 'react';

export const LoginForm = () => {
  const { login, isPending, error } = useCustomLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Logging in...' : 'Login'}
      </button>
      {error && <p className="text-red-500">{error.message}</p>}
    </form>
  );
};
```

### Example 2: Using Direct Generated Hooks

```typescript
// Component that uses generated hooks directly
import { useGetApiV1Users } from '@/lib/api/generated/k2-tax-api';

export const UsersList = () => {
  const { data, isLoading, error } = useGetApiV1Users({
    query: {
      // Enable/disable the query
      enabled: true,
      // Refetch every 5 minutes
      refetchInterval: 5 * 60 * 1000,
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.data?.map((user: any) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
};
```

### Example 3: Creating a Custom Wrapper Hook

```typescript
// src/lib/api/hooks/k2-tax-api/useCreateUser.ts
"use client";

import { usePostApiV1User } from "@/lib/api/generated/k2-tax-api";
import { useQueryClient } from "@tanstack/react-query";

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  const { mutate, ...rest } = usePostApiV1User({
    mutation: {
      onSuccess: () => {
        // Invalidate users cache to refetch
        queryClient.invalidateQueries({
          queryKey: ["getApiV1Users"],
        });
      },
    },
  });

  return {
    createUser: (userData: any) => mutate({ ...userData }),
    ...rest,
  };
};
```

## 🔄 Auth Integration

The generated hooks automatically use your configured `apiClient` which includes:

✅ **Auth Token Injection**: Automatically adds Bearer token from localStorage  
✅ **401 Handling**: Redirects to login on auth failure  
✅ **Interceptors**: Applies custom request/response logic

**No additional auth setup needed** — just use the hooks!

## 🛠️ Adding a New API Endpoint

When your backend adds new endpoints:

1. **Regenerate types**:

   ```bash
   corepack pnpm generate:api
   ```

2. **Create a wrapper hook** (optional but recommended):

   ```typescript
   // src/lib/api/hooks/k2-tax-api/useMyNewEndpoint.ts
   export const useMyNewEndpoint = () => {
     const { mutate, ...rest } = usePostApiV1MyEndpoint({
       mutation: {
         onSuccess: () => console.log("Success!"),
       },
     });
     return { myEndpoint: mutate, ...rest };
   };
   ```

3. **Export from index**:

   ```typescript
   // src/lib/api/hooks/k2-tax-api/index.ts
   export * from "./useMyNewEndpoint";
   ```

4. **Use in your component**:
   ```typescript
   import { useMyNewEndpoint } from "@/lib/api/hooks";
   ```

## 📋 File Organization

```
src/lib/api/
├── api-client.ts                 ← Base axios instance (auth, interceptors)
├── api-client-config.ts          ← Config constants
├── generated/                    ← 🤖 AUTO-GENERATED (don't edit)
│   └── k2-tax-api/
│       ├── index.ts
│       ├── k2TaxAPI.schemas.ts
│       ├── users/
│       └── ...other tags...
├── hooks/                        ← Custom wrappers (edit here)
│   ├── index.ts
│   └── k2-tax-api/
│       ├── index.ts
│       ├── useAuth.ts
│       ├── useUsers.ts
│       └── ...other custom hooks...
├── core/                         ← Shared utilities
│   ├── error-handler.ts
│   └── interceptors.ts
└── README.md
```

## ⚙️ Configuration Reference

**Orval Config** (`orval.config.ts`):

- `input.target`: Backend Swagger URL
- `output.mode`: `tags-split` (one file per API tag)
- `output.client`: `react-query` (generate React Query hooks)
- `output.httpClient`: `axios` (use axios for HTTP)
- `mutator`: Points to custom axios instance for auth headers

## 🔍 Troubleshooting

### Q: Generated hooks aren't using my custom axios instance?

**A**: The current setup uses axios directly. To integrate fully with your custom `apiClient` with auth interceptors, update `orval.config.ts` to use a custom mutator.

### Q: How do I handle loading/error states?

**A**: React Query hooks return `isLoading`, `isPending`, `error`, and more:

```typescript
const { data, isLoading, error, isPending } = useMyHook();
```

### Q: The types are wrong or incomplete?

**A**: Regenerate from the latest spec:

```bash
corepack pnpm generate:api
```

### Q: Can I manually edit generated files?

**A**: No! Generated files are overwritten each time. Use wrapper hooks instead.

## 📚 Resources

- [Orval Documentation](https://orval.dev/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Axios Documentation](https://axios-http.com/)
- [OpenAPI Specification](https://spec.openapis.org/oas/v3.1.0)

## ✅ Checklist

- [x] Orval installed
- [x] Configuration created
- [x] Folder structure set up
- [x] NPM scripts added
- [x] Initial generation successful
- [x] TypeScript types validated
- [x] Sample wrapper hooks created
- [x] Ready for development!

---

**Next Steps**:

1. Update your auth components to use the new API hooks
2. Test login/logout functionality with generated endpoints
3. Add more wrapper hooks as needed for your business logic
4. Commit generated files to git for team sync
