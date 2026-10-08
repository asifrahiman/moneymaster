import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryManager } from "@/components/category-manager";
import { SettingsForm } from "@/components/settings-form";
import { Card, CardHeader, PageHeader, Skeleton } from "@/components/ui";
import { requireUser } from "@/server/dal";
import { listCategories } from "@/server/queries";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <Suspense
        fallback={
          <div className="flex max-w-3xl flex-col gap-6" aria-busy>
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        }
      >
        <Settings />
      </Suspense>
    </>
  );
}

async function Settings() {
  const user = await requireUser();
  const categories = await listCategories(user.id);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Card>
        <CardHeader title="Preferences" subtitle={`Signed in as ${user.email}`} />
        <SettingsForm currency={user.currency} timezone={user.timezone} />
      </Card>
      <Card className="overflow-hidden">
        <CardHeader title="Categories" subtitle="Saved categories appear in the picker. One-time labels can be saved from the list below." />
        <CategoryManager categories={categories} />
      </Card>
    </div>
  );
}
