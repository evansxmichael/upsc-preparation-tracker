import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isPublicAsset = pathname.startsWith("/_next") || pathname.startsWith("/api/auth") || pathname.includes(".");

  if (isPublicAsset) {
    return NextResponse.next();
  }

  // If user is not signed in and tries to access protected pages
  if (!token && !isAuthPage) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // If user is already signed in and visits /login or /register
  if (token && isAuthPage) {
    const dashboardUrl = new URL("/dashboard", req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api/auth (auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, icons
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};