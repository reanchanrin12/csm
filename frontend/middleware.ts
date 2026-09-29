import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface JwtPayload {
  id: string;
  username: string;
  role: string;
  exp?: number;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const cleanToken = decodeURIComponent(token.trim());
    const parts = cleanToken.split(".");
    if (parts.length !== 3) return null;
    const payloadBase64 = parts[1];
    if (!payloadBase64) return null;

    // Standardize base64url to base64 with padding
    let base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }

    let jsonStr: string;
    if (typeof atob === "function") {
      const binary = atob(base64);
      const bytes = Uint8Array.from(binary, (m) => m.charCodeAt(0));
      jsonStr = new TextDecoder().decode(bytes);
    } else {
      jsonStr = Buffer.from(base64, "base64").toString("utf8");
    }

    const parsed = JSON.parse(jsonStr);

    // Check expiration
    if (parsed.exp && parsed.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return parsed as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Role-based access rules for protected route prefixes.
 * SUPER_ADMIN has unrestricted access to all routes.
 */
const roleAccessRules: { prefix: string; allowedRoles: string[] }[] = [
  { prefix: "/settings", allowedRoles: ["SUPER_ADMIN", "ADMIN"] },
  { prefix: "/users", allowedRoles: ["SUPER_ADMIN", "ADMIN"] },
  { prefix: "/employees", allowedRoles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"] },
  { prefix: "/finance", allowedRoles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"] },
  { prefix: "/logistics", allowedRoles: ["SUPER_ADMIN", "ADMIN", "STOCK_CONTROLLER"] },
  { prefix: "/transfers", allowedRoles: ["SUPER_ADMIN", "ADMIN", "STOCK_CONTROLLER"] },
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets, Next.js system routes, and API endpoints
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("csm_token")?.value;
  const user = token ? decodeJwtPayload(token) : null;

  // 2. Handle /login page
  if (pathname === "/login") {
    if (user) {
      // Already authenticated -> Redirect to Dashboard
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // 3. Protected Dashboard Pages: Redirect unauthenticated requests to /login
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    const response = NextResponse.redirect(loginUrl);
    // Clear stale or expired cookie if it was present
    if (token) {
      response.cookies.delete("csm_token");
    }
    return response;
  }

  // 4. Server-side RBAC Permission check
  const normalizedRole = user.role?.toUpperCase() || "";
  if (normalizedRole !== "SUPER_ADMIN") {
    for (const rule of roleAccessRules) {
      if (pathname.startsWith(rule.prefix) && !rule.allowedRoles.includes(normalizedRole)) {
        // Unauthorized access -> Redirect back to Dashboard
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
