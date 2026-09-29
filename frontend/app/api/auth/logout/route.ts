import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  // Clear the cookie on Next.js server side
  const cookieStore = await cookies();
  cookieStore.delete("csm_token");

  // Also notify backend to clear its session if applicable
  try {
    const backendUrl = process.env.INTERNAL_API_URL || "http://localhost:4000/api";
    await fetch(`${backendUrl}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Gracefully ignore backend errors on logout
  }

  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  // Explicitly clear Set-Cookie headers in the HTTP response
  response.cookies.delete("csm_token");
  response.cookies.set("csm_token", "", {
    path: "/",
    expires: new Date(0),
    maxAge: 0,
    sameSite: "lax",
  });

  return response;
}
