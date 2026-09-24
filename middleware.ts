import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

const adminHosts = new Set(["admin.redumbrellaprinting.com", "www.admin.redumbrellaprinting.com"]);
const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const url = request.nextUrl;
  const pathname = url.pathname;
  const isAdminHost = adminHosts.has(url.hostname.toLowerCase());
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname === "/api/admin" || pathname.startsWith("/api/admin/");
  const isAuthApi = pathname === "/api/auth" || pathname.startsWith("/api/auth/");

  // A public hostname must never serve the internal admin tree or its APIs.
  if (!isAdminHost) {
    if (isAdminPath || isAdminApi || isAuthApi) {
      return new NextResponse(null, { status: 404 });
    }
    return NextResponse.next();
  }

  // Keep the admin tree internal even when an old /admin URL is requested.
  if (isAdminPath) {
    const clean = url.clone();
    clean.pathname = pathname.slice("/admin".length) || "/";
    return NextResponse.redirect(clean);
  }

  if (isAuthApi) return NextResponse.next();

  const isLogin = pathname === "/login";
  if (!request.auth?.user && !isLogin) {
    const login = url.clone();
    login.pathname = "/login";
    login.search = "";
    return NextResponse.redirect(login);
  }
  if (request.auth?.user && isLogin) {
    const orders = url.clone();
    orders.pathname = "/orders";
    orders.search = "";
    return NextResponse.redirect(orders);
  }

  if (isAdminApi) return NextResponse.next();

  const internal = url.clone();
  internal.pathname = "/admin" + (pathname === "/" ? "" : pathname);
  return NextResponse.rewrite(internal);
});

export const config = {
  matcher: ["/((?!_next/|favicon.ico|favicon-|apple-touch-icon|android-chrome-|site.webmanifest).*)"],
};
