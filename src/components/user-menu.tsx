import { requireUser } from "@/server/dal";
import { UserMenuButton } from "./user-menu-button";

/** Profile picture / name; opens a menu with Settings and Sign out. */
export async function UserMenu({ compact = false }: { compact?: boolean }) {
  const user = await requireUser();
  return <UserMenuButton name={user.name || user.email} email={user.email} image={user.image} compact={compact} />;
}
