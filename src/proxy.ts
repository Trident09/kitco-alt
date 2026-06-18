import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected routes require the shelfie-auth cookie (set client-side on login).
// This is a UX guard — Firestore security rules are the real enforcement layer.
export function proxy(request: NextRequest) {
  const authed = request.cookies.has("shelfie-auth");
  const { pathname } = request.nextUrl;

  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/lists");

  if (isProtected && !authed) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/lists/:path*"],
};
