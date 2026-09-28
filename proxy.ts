/**
 * Request-time route protection using Next.js Proxy
 *
 * This intercepts ALL application requests at the edge and validates
 * authentication status based on the K2Tax.Authentication cookie.
 *
 * Architecture:
 * - K2Tax.Authentication (HttpOnly cookie from backend)
 *   └─→ proxy.ts validates presence
 *       └─→ Route access decision
 *           ├─→ Public routes: ALLOW
 *           ├─→ Auth routes: Check auth status
 *           │   ├─→ Authenticated: redirect to /dashboard
 *           │   └─→ Not authenticated: ALLOW (for login/signup)
 *           └─→ Protected routes: Check auth status
 *               ├─→ Authenticated: ALLOW
 *               └─→ Not authenticated: redirect to /login?returnTo={path}
 *
 * IMPORTANT: This is UX-level protection. Backend MUST validate
 * the cookie on all API requests. Never trust client-side checks alone.
 */
import { NextRequest, NextResponse } from "next/server";

import {
  AUTH_COOKIE_NAME,
  AUTH_ROUTES,
  PUBLIC_ROUTES,
} from "./src/config/auth.constants";

function isAuthenticated(request: NextRequest): boolean {
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME);

  return !!authCookie?.value;
}

function pathMatches(pathname: string, pattern: string): boolean {
  // Exact match
  if (pathname === pattern) {
    return true;
  }

  // Wildcard match
  if (pattern.endsWith("/*")) {
    const basePattern = pattern.slice(0, -2);

    return pathname === basePattern || pathname.startsWith(basePattern + "/");
  }

  return false;
}

function isRouteIn(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathMatches(pathname, route));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authenticated = isAuthenticated(request);

  console.log("[AUTH PROXY]", pathname, "authenticated:", authenticated);

  // ------------------------------------------------------------
  // PUBLIC ROUTES
  // ------------------------------------------------------------

  if (isRouteIn(pathname, PUBLIC_ROUTES)) {
    return NextResponse.next();
  }

  // ------------------------------------------------------------
  // AUTH ROUTES
  // ------------------------------------------------------------

  if (isRouteIn(pathname, AUTH_ROUTES)) {
    // Logged-in user should not see login/signup/reset pages.
    if (authenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Logged-out user can access login/signup/reset pages.
    return NextResponse.next();
  }

  // ------------------------------------------------------------
  // EVERYTHING ELSE IS PROTECTED
  // ------------------------------------------------------------

  if (!authenticated) {
    const loginUrl = new URL("/login", request.url);

    loginUrl.searchParams.set("returnTo", pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
