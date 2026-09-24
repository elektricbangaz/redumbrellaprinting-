import type { NextAuthConfig } from "next-auth";

// Edge-safe configuration. The admin subdomain gate lives in middleware.ts.
export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized() {
      // middleware.ts makes the host and route decisions before any rewrite.
      return true;
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
        const user = session.user as typeof session.user & { role?: string };
        user.role = token.role as string | undefined;
        if (token.sub) user.id = token.sub;
      }
      return session;
    },
  },
};
