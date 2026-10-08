import { LogOut } from "lucide-react";
import { requireUser } from "@/server/dal";
import { signOutAction } from "@/server/actions";

function Avatar({ name, image }: { name: string; image: string | null }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element -- remote Google avatar, tiny
    return <img src={image} alt="" className="size-8 rounded-full" referrerPolicy="no-referrer" />;
  }
  return (
    <span className="flex size-8 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export async function UserMenu({ compact = false }: { compact?: boolean }) {
  const user = await requireUser();
  const name = user.name || user.email;

  return (
    <form action={signOutAction} className="flex min-w-0 items-center gap-2">
      <Avatar name={name} image={user.image} />
      {!compact && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{name}</p>
          <button type="submit" className="flex items-center gap-1 text-xs text-muted hover:text-ink">
            <LogOut className="size-3" aria-hidden /> Sign out
          </button>
        </div>
      )}
      {compact && (
        <button type="submit" aria-label="Sign out" className="rounded-lg p-2 text-ink-2 hover:bg-surface-2">
          <LogOut className="size-4" />
        </button>
      )}
    </form>
  );
}
