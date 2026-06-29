import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/server";

// Next 16's middleware convention is `proxy.ts`. Neon Auth's middleware
// refreshes the session and redirects unauthenticated users to the sign-in page.
const neonMiddleware = auth.middleware({ loginUrl: "/sign-in" });

export default async function proxy(request: NextRequest) {
  // Server Actions are POST requests to the page's own URL. If the auth
  // middleware issues its session-refresh / login redirect (307) on these,
  // the action call can't follow it and fails with "An unexpected response
  // was received from the server". Only gate navigations (GET); let Server
  // Actions and other non-GET requests through to the route handler.
  if (request.method !== "GET") {
    return NextResponse.next();
  }
  return neonMiddleware(request);
}

// Run on everything except the auth API, the auth pages, and static assets.
export const config = {
  matcher: [
    "/((?!api/auth|sign-in|sign-up|_next/static|_next/image|favicon.ico).*)",
  ],
};
