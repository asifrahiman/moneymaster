import { Wallet } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { BottomNav, SideNav } from "@/components/nav";
import { ThemeToggle } from "@/components/theme";
import { Skeleton } from "@/components/ui";
import { UserMenu } from "@/components/user-menu";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-ink">
      <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-ink">
        <Wallet className="size-4" aria-hidden />
      </span>
      MoneyMaster
    </Link>
  );
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[1400px]">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r border-line px-4 py-5 md:flex">
        <Logo />
        <SideNav />
        <div className="mt-auto flex items-center justify-between gap-2">
          <Suspense fallback={<Skeleton className="h-9 w-36" />}>
            <UserMenu />
          </Suspense>
          <ThemeToggle />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-page/90 px-4 py-3 backdrop-blur md:hidden">
          <Logo />
          <div className="flex items-center gap-1">
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
