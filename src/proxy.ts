import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

// Coarse login gate against direct URL visits. Every user has full access to the
// whole system, so no role/permission checks are needed here — an authenticated
// session is sufficient.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/products/:path*",
    "/customers/:path*",
    "/quotations/:path*",
    "/masters/:path*",
    "/settings/:path*",
    "/profile/:path*",
  ],
};