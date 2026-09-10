import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Edge-safe: built from the lightweight config only (no Credentials
// provider, no bcrypt/Prisma) so this Edge Function stays well under
// Vercel's size limit.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/admin/:path*"],
};
