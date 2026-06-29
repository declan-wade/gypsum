import { auth } from "@/lib/auth/server";

// Next 16's middleware convention is `proxy.ts`. Neon Auth's middleware
// refreshes the session and redirects unauthenticated users to the sign-in page.
export default auth.middleware({ loginUrl: "/sign-in" });

// Run on everything except the auth API, the auth pages, and static assets.
export const config = {
  matcher: [
    "/((?!api/auth|sign-in|sign-up|_next/static|_next/image|favicon.ico).*)",
  ],
};
