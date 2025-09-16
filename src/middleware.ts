import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = ["/platform"];
const PUBLIC_PATHS = ["/"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token");

  const isProtectedRoute = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  const isPublicRoute = PUBLIC_PATHS.includes(pathname);

  if (!token && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (token && isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/platform";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/platform/:path*"],
};