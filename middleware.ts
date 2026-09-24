import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

const adminHosts = new Set(["admin.redumbrellaprinting.com", "www.admin.redumbrellaprinting.com"]);
const adminRoutes = ["/login", "/orders", "/work-orders", "/purchase-orders", "/broadcasts"];
const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const pathname = request.nextUrl.pathname;
  const requestHost = request.headers.get("host")?.split(":")[0].toLowerCase();
  const isAdminHost = requestHost !== undefined && adminHosts.has(requestHost);
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname === "/api/admin" || pathname.startsWith("/api/admin/");
  const isAuthApi = pathname === "/api/auth" || pathname.startsWith("/api/auth/");
  const isCleanAdminRoute = adminRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"));
  const external = new URL(request.url);
  if (request.headers.get("host")) external.host = request.headers.get("host")!;

  if (!isAdminHost) {
    if (isAdminPath || isAdminApi || isAuthApi || isCleanAdminRoute) {
      return new NextResponse(null, { status: 404 });
    }
    return NextResponse.next();
  }

  if (isAdminPath) {
    const clean = new URL(external);
    clean.pathname = pathname.slice("/admin".length) || "/";
    return NextResponse.redirect(clean);
  }

  if (isAuthApi) return NextResponse.next();
  if (pathname !== "/" && !isCleanAdminRoute && !isAdminApi) {
    return new NextResponse(null, { status: 404 });
  }

  if (!request.auth?.user && pathname !== "/login") {
    const login = new URL(external);
    login.pathname = "/login";
    login.search = "";
    return NextResponse.redirect(login);
  }

  if (request.auth?.user && (pathname === "/" || pathname === "/login")) {
    const orders = new URL(external);
    orders.pathname = "/orders";
    orders.search = "";
    return NextResponse.redirect(orders);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/|favicon.ico|favicon-|apple-touch-icon|android-chrome-|site.webmanifest).*)"],
};
