import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

// Optimistic check only: redirects signed-out visitors to /login before rendering.
// Every page and server action still verifies the session itself (src/server/dal.ts).
export default auth;

// Public files the browser fetches without a session (icons, the install manifest,
// the service worker and its offline page) are excluded.
export const config = {
  matcher: ["/((?!api/auth|login|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest.webmanifest|sw.js|offline.html|icons/).*)"],
};
