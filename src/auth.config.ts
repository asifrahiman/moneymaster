import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe part of the Auth.js config (no database imports), shared by the
 * proxy and the full config in auth.ts.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth }) {
      // Used by proxy.ts: any signed-in user may reach app routes.
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
