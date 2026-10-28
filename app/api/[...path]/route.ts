/**
 * Universal API Proxy Route Handler
 *
 * Purpose:
 * - Bridges the domain gap between frontend and backend
 * - Proxies all /api/* requests to the actual .NET backend
 * - Preserves authentication cookies across domains
 * - Handles all HTTP methods (GET, POST, PUT, DELETE, PATCH)
 *
 * How it works:
 * 1. Browser calls: /api/v1/User/Login (same domain - no CORS)
 * 2. This handler catches it
 * 3. Extracts cookie from browser request
 * 4. Forwards to: https://backend.../api/v1/User/Login (server-to-server)
 * 5. Backend responds (may include Set-Cookie)
 * 6. Handler returns response to browser (same domain)
 * 7. Browser stores cookie (no CORS issues)
 * 8. Next request: Browser sends cookie automatically ✅
 *
 * Why this solves the problem:
 * - Backend domain: app-k2summit-api-poc-eastus-...
 * - Frontend domain: app-k2summit-react-east-dev-...
 * - Direct calls would fail (CORS + cookie issues)
 * - Route handler bridges the gap by being SAME domain as browser
 */

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://app-k2summit-api-poc-eastus-d3b5hzbkgaftfab5.eastus-01.azurewebsites.net";
console.log(`[API PROXY INIT] BACKEND_URL: ${BACKEND_URL}`);
if (!BACKEND_URL) {
  console.error(
    "[API PROXY INIT] ERROR: NEXT_PUBLIC_API_URL is not set! Check environment variables.",
  );
}

/**
 * Handle all API requests by forwarding to backend
 *
 * @param method HTTP method (GET, POST, etc)
 * @param request NextRequest with headers and body
 * @param pathArray URL segments (e.g., ['v1', 'User', 'Login'])
 * @returns Response from backend
 */
async function handleRequest(
  method: string,
  request: NextRequest,
  pathArray: string[],
): Promise<NextResponse> {
  // Check if BACKEND_URL is configured
  if (!BACKEND_URL) {
    console.error("[API PROXY] CRITICAL: BACKEND_URL is not configured!");
    return NextResponse.json(
      {
        error: "API configuration error",
        message: "NEXT_PUBLIC_API_URL environment variable is not set",
      },
      { status: 500 },
    );
  }

  // Reconstruct the path from segments
  const path = pathArray.join("/");

  // Build the full URL - ensure proper slash between domain and api
  const normalizedBackendUrl = BACKEND_URL.endsWith("/")
    ? BACKEND_URL
    : `${BACKEND_URL}/`;
  const fullUrl = `${normalizedBackendUrl}api/${path}`;

  // Simple logging to show endpoint being called
  console.log(`[API ROUTE] ${method} ${request.url} → ${fullUrl}`);

  try {
    // Extract request body (only for methods that have bodies)
    let body: BodyInit | null = null;
    if (method !== "GET" && method !== "HEAD") {
      try {
        const contentType = request.headers.get("content-type");

        // For multipart/form-data (file uploads), use the raw body stream
        if (contentType?.includes("multipart/form-data")) {
          body = request.body;
        } else {
          // For JSON and other text-based requests, convert to text
          const text = await request.text();
          if (text && text.length > 0) {
            body = text;
          }
        }
      } catch (bodyError) {
        // Silently continue without body
      }
    }

    // Prepare headers to forward to backend
    const requestHeaders = new Headers();

    // Copy all important headers from the original request
    const headersToCopy = [
      "content-type",
      "accept",
      "accept-language",
      "user-agent",
      "authorization",
      "cookie",
    ];

    headersToCopy.forEach((header) => {
      const value = request.headers.get(header);
      if (value) {
        requestHeaders.set(header, value);
      }
    });

    // Make the actual request to backend (server-to-server)
    const fetchOptions: RequestInit & { duplex?: "half" | "full" } = {
      method,
      headers: requestHeaders,
      body: body || undefined,
      redirect: "manual",
    };

    // For streams (file uploads), we need to specify duplex mode
    if (body && typeof body === "object" && "getReader" in body) {
      fetchOptions.duplex = "half";
    }

    const response = await fetch(fullUrl, fetchOptions);

    // Get the response body
    const responseBody = await response.text();

    // Prepare response headers
    const responseHeaders: Record<string, string> = {
      "content-type":
        response.headers.get("content-type") || "application/json",
      "cache-control": response.headers.get("cache-control") || "no-cache",
    };

    // CRITICAL: Forward Set-Cookie header from backend to browser
    // This is how the authentication cookie gets stored in the browser
    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader) {
      responseHeaders["set-cookie"] = setCookieHeader;
    }

    // Return the response to browser
    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`[API ROUTE ERROR] ${method} ${fullUrl}: ${errorMessage}`);

    return NextResponse.json(
      {
        error: "API request failed",
        message: errorMessage,
        url: fullUrl,
        method: method,
      },
      { status: 500 },
    );
  }
}

/**
 * POST requests
 * Example: Login, Create records
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return handleRequest("POST", request, path);
}

/**
 * GET requests
 * Example: Fetch users, Get details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return handleRequest("GET", request, path);
}

/**
 * PUT requests
 * Example: Update records
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return handleRequest("PUT", request, path);
}

/**
 * DELETE requests
 * Example: Delete records
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return handleRequest("DELETE", request, path);
}

/**
 * PATCH requests
 * Example: Partial updates
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return handleRequest("PATCH", request, path);
}
