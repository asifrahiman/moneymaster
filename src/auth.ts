import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { Provider } from "next-auth/providers";
import { authConfig } from "./auth.config";
import { upsertUserOnSignIn } from "./server/users";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

/** Optional allow-list so a public deployment isn't open to every Google account. */
function isAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.length === 0 || list.includes(email.toLowerCase());
}

export const devLoginEnabled =
  process.env.AUTH_DEV_LOGIN === "true" && process.env.NODE_ENV !== "production";

const providers: Provider[] = [Google];

if (devLoginEnabled) {
  // Local-only login so the app can be run without Google credentials.
  providers.push(
    Credentials({
      id: "dev",
      name: "Dev login",
      credentials: { email: { label: "Email", type: "email" } },
      authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        if (!/^\S+@\S+\.\S+$/.test(email)) return null;
        return { email, name: email.split("@")[0] };
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile?.email_verified === false) return false;
      return isAllowed(user.email);
    },
    async jwt({ token, user, trigger }) {
      // Runs with `user` only at sign-in: link the identity to our users row.
      if ((trigger === "signIn" || trigger === "signUp") && user?.email) {
        const dbUser = await upsertUserOnSignIn({
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
        });
        token.uid = dbUser.id;
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.uid === "string") session.user.id = token.uid;
      return session;
    },
  },
});
