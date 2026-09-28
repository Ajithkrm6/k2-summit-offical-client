<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

## Authentication & Protected Routing Architecture

K2 uses a custom authentication architecture with the .NET backend as the
source of truth for authentication, authorization, RBAC, and multi-tenancy.

### Authentication Authority

- The .NET backend is the authoritative authentication and authorization layer.
- Do NOT introduce NextAuth/Auth.js unless the architecture is explicitly changed.
- Authentication is based on the HttpOnly `K2Tax.Authentication` cookie.
- The frontend must never store authentication tokens in:
  - localStorage
  - sessionStorage
  - JavaScript-accessible cookies
- The frontend may use authentication information for UI behavior, but the
  backend must always enforce actual authorization.

### API Request Architecture

Browser API requests must use the Next.js same-origin `/api/*` path.

Do NOT make browser requests directly to the Azure .NET API URL.

Current flow:

    Browser
      ↓
    /api/*
      ↓
    Next.js rewrite
      ↓
    .NET API

`next.config.ts` contains the rewrite:

```ts
async rewrites() {
  return [
    {
      source: "/api/:path*",
      destination: `${process.env.NEXT_PUBLIC_API_URL}api/:path*`,
    },
  ];
}

<!-- END:nextjs-agent-rules -->
```
