import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

const adminHosts = new Set(["admin.redumbrellaprinting.com", "www.admin.redumbrellaprinting.com"]);
const adminRoutes = [
  "/login", "/forgot-password", "/reset-password", "/dashboard", "/customers", "/quotes", "/design-approvals",
  "/inventory", "/invoices", "/payments", "/receivables", "/catalog", "/templates", "/orders",
  "/work-orders", "/jobs", "/job-queue", "/production", "/floor-board", "/pickup-delivery",
  "/purchase-orders", "/broadcasts", "/staff", "/reports", "/settings",
];
const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const pathname = request.nextUrl.pathname;
  const requestHost = request.headers.get("host")?.split(":")[0].toLowerCase();
  const isPreviewHost = process.env.VERCEL_ENV === "preview" && Boolean(requestHost?.endsWith(".vercel.app"));
  const isAdminHost = requestHost !== undefined && adminHosts.has(requestHost);
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname === "/api/admin" || pathname.startsWith("/api/admin/");
  const isPasswordResetApi = pathname === "/api/admin/password-reset/request" || pathname === "/api/admin/password-reset/confirm";
  const isAuthApi = pathname === "/api/auth" || pathname.startsWith("/api/auth/");
  const isCleanAdminRoute = adminRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"));
  const external = new URL(request.url);
  if (request.headers.get("host")) external.host = request.headers.get("host")!;

  if (isPreviewHost) {
    if (isAuthApi || isAdminApi || isAdminPath) return NextResponse.next();

    if (isCleanAdminRoute) {
      const isPublicAdminRoute = pathname === "/login" || pathname === "/forgot-password" || pathname === "/reset-password" || isPasswordResetApi;
      if (!request.auth?.user && !isPublicAdminRoute) {
        const login = new URL(external); login.pathname = "/login"; login.search = ""; return NextResponse.redirect(login);
      }
      const internal = request.nextUrl.clone();
      internal.pathname = pathname === "/catalog" ? "/admin/products" : "/admin" + pathname;
      return NextResponse.rewrite(internal);
    }

    return NextResponse.next();
  }

  if (!isAdminHost) {
    if (isAdminPath || isAdminApi || isAuthApi || isCleanAdminRoute) return new NextResponse(null, { status: 404 });
    return NextResponse.next();
  }

  if (isAdminPath) {
    const clean = new URL(external);
    clean.pathname = pathname === "/admin/products" ? "/catalog" : pathname.slice("/admin".length) || "/";
    return NextResponse.redirect(clean);
  }

  if (isAuthApi) return NextResponse.next();
  if (pathname !== "/" && !isCleanAdminRoute && !isAdminApi) return new NextResponse(null, { status: 404 });

  const isPublicAdminRoute = pathname === "/login" || pathname === "/forgot-password" || pathname === "/reset-password" || isPasswordResetApi;
  if (!request.auth?.user && !isPublicAdminRoute) {
    const login = new URL(external); login.pathname = "/login"; login.search = ""; return NextResponse.redirect(login);
  }

  if (request.auth?.user && (pathname === "/" || pathname === "/login")) {
    const dashboard = new URL(external); dashboard.pathname = "/dashboard"; dashboard.search = ""; return NextResponse.redirect(dashboard);
  }

  if (isCleanAdminRoute) {
    const internal = request.nextUrl.clone();
    internal.pathname = pathname === "/catalog" ? "/admin/products" : "/admin" + pathname;
    return NextResponse.rewrite(internal);
  }

  return NextResponse.next();
});

export const config = { matcher: ["/((?!_next/|favicon.ico|favicon-|apple-touch-icon|android-chrome-|site.webmanifest).*)"] };
