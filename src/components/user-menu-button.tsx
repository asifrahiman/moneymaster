"use client";

import clsx from "clsx";
import { ChevronsUpDown, Download, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { canInstall, promptInstall, subscribeInstall } from "@/lib/pwa";
import { signOutAction } from "@/server/actions";

function Avatar({ name, image }: { name: string; image: string | null }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element -- remote Google avatar, tiny
    return <img src={image} alt="" className="size-8 shrink-0 rounded-full" referrerPolicy="no-referrer" />;
  }
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function UserMenuButton({
  name,
  email,
  image,
  compact,
}: {
  name: string;
  email: string;
  image: string | null;
  /** Phone header: avatar only, menu opens downwards. Sidebar: avatar + name, menu opens upwards. */
  compact: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // "Install app" appears only when Chrome says the app can be installed (not when already installed).
  const installable = useSyncExternalStore(subscribeInstall, canInstall, () => false);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-2 hover:bg-surface-2 hover:text-ink";

  return (
    <div ref={ref} className={clsx("relative", !compact && "min-w-0 flex-1")}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={compact ? `Account menu for ${name}` : undefined}
        className={clsx(
          "flex items-center gap-2 rounded-full text-left hover:bg-surface-2",
          compact ? "p-0.5" : "w-full rounded-lg p-1 pr-2",
        )}
      >
        <Avatar name={name} image={image} />
        {!compact && (
          <>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{name}</span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-muted" aria-hidden />
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={clsx(
            "absolute z-50 w-56 rounded-xl border border-line bg-surface py-1 shadow-lg",
            compact ? "top-full right-0 mt-1" : "bottom-full left-0 mb-1",
          )}
        >
          <div className="border-b border-line px-3 pt-1.5 pb-2">
            <p className="truncate text-sm font-medium text-ink">{name}</p>
            {email !== name && <p className="truncate text-xs text-muted">{email}</p>}
          </div>
          <Link href="/settings" role="menuitem" onClick={() => setOpen(false)} className={clsx(item, "mt-1")}>
            <Settings className="size-4" aria-hidden /> Settings
          </Link>
          {installable && (
            <button
              type="button"
              role="menuitem"
              className={item}
              onClick={() => {
                setOpen(false);
                void promptInstall();
              }}
            >
              <Download className="size-4" aria-hidden /> Install app
            </button>
          )}
          <form action={signOutAction}>
            <button type="submit" role="menuitem" className={item}>
              <LogOut className="size-4" aria-hidden /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
