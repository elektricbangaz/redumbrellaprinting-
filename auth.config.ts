import type { NextAuthConfig } from "next-auth";

// Edge-safe NextAuth config: no Credentials provider, no bcrypt/Prisma.
// Used directly by middleware.ts so the Edge Function bundle stays small —
// see auth.ts for the full config (providers + DB access) used everywhere
// else (Server Components, Route Handlers), which runs in the Node runtime.
export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ request, auth }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = request.nextUrl.pathname.startsWith("/admin/login");
      if (isLoginPage) return true;
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.sub = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const user = session.user as typeof session.user & {
          role?: string;
        };
        user.role = token.role as string | undefined;
        if (token.sub) user.id = token.sub;
      }
      return session;
    },
  },
};
