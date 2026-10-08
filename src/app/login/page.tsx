import { Wallet } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { devLoginEnabled, signIn } from "@/auth";
import { Button, Input } from "@/components/ui";

export const metadata: Metadata = { title: "Sign in" };

async function googleSignIn() {
  "use server";
  await signIn("google", { redirectTo: "/" });
}

async function devSignIn(form: FormData) {
  "use server";
  await signIn("dev", { email: form.get("email"), redirectTo: "/" });
}

const ERRORS: Record<string, string> = {
  AccessDenied: "This account isn't allowed to use this app.",
  Configuration: "Sign-in isn't configured correctly. Check the server's auth settings.",
};

async function ErrorMessage({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { error } = await searchParams;
  if (!error) return null;
  const message = ERRORS[String(error)] ?? "Sign-in failed. Please try again.";
  return (
    <p role="alert" className="rounded-lg bg-negative-soft px-3 py-2 text-sm text-negative">
      {message}
    </p>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z" />
    </svg>
  );
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-ink">
            <Wallet className="size-6" aria-hidden />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">MoneyMaster</h1>
          <p className="mt-1 text-sm text-ink-2">Track spending, income and savings.</p>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6">
          <Suspense>
            <ErrorMessage searchParams={searchParams} />
          </Suspense>
          <form action={googleSignIn}>
            <Button type="submit" variant="secondary" className="h-11 w-full">
              <GoogleIcon /> Continue with Google
            </Button>
          </form>

          {devLoginEnabled && (
            <form action={devSignIn} className="flex flex-col gap-2 border-t border-line pt-4">
              <p className="text-xs text-muted">Development login (AUTH_DEV_LOGIN=true)</p>
              <Input name="email" type="email" required placeholder="you@example.com" aria-label="Email" />
              <Button type="submit" variant="primary">
                Sign in without Google
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
