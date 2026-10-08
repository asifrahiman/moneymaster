import { Wallet } from "lucide-react";
import { Suspense } from "react";
import { BottomNav, SideNav } from "@/components/nav";
import { ThemeToggle } from "@/components/theme";
import { Skeleton } from "@/components/ui";
import { UserMenu } from "@/components/user-menu";
import { BookSwitcher } from "@/components/book-switcher";
import { requireUser } from "@/server/dal";

/**
 * A plain <a>, not <Link>: clicking the logo does a full reload of the home page
 * (fresh data, the book's default filters). The active book is stored on the
 * server, so it doesn't change.
 */
function Logo({ iconOnly = false }: { iconOnly?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages -- a full reload is the point
    <a href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight text-ink" aria-label="MoneyMaster home">
      <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-ink">
        <Wallet className="size-4" aria-hidden />
      </span>
      {!iconOnly && "MoneyMaster"}
    </a>
  );
}

async function Books({ compact = false }: { compact?: boolean }) {
  const user = await requireUser();
  return <BookSwitcher books={user.books} active={user.book} compact={compact} />;
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[1400px]">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r border-line px-4 py-5 md:flex">
        <Logo />
        <Suspense fallback={<Skeleton className="h-12 w-full" />}>
          <Books />
        </Suspense>
        <SideNav />
        <div className="mt-auto flex items-center justify-between gap-2">
          <Suspense fallback={<Skeleton className="h-9 w-36" />}>
            <UserMenu />
          </Suspense>
          <ThemeToggle />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-line bg-page/90 px-4 py-3 backdrop-blur md:hidden">
          <Logo iconOnly />
          <div className="min-w-0 flex-1">
            <Suspense fallback={<Skeleton className="h-9 w-40" />}>
              <Books compact />
            </Suspense>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle />
            <Suspense fallback={<Skeleton className="size-8 rounded-full" />}>
              <UserMenu compact />
            </Suspense>
          </div>
        </header>
        <main className="flex-1 px-4 pt-6 pb-28 md:px-8 md:pt-8 md:pb-12">{children}</main>
      </div>

      <BottomNav />
    </div>
  );
}
