import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

// Optimistic check only: redirects signed-out visitors to /login before rendering.
// Every page and server action still verifies the session itself (src/server/dal.ts).
export default auth;

export const config = {
  matcher: ["/((?!api/auth|login|_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
