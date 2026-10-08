"use client";

import { Loader2 } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { saveSettings, type ActionState } from "@/server/actions";
import { CURRENCIES } from "@/lib/format";
import { toast } from "./toast";
import { Button, Field, Select } from "./ui";

export function SettingsForm({ currency, timezone }: { currency: string; timezone: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, form) => {
    const res = await saveSettings(prev, form);
    toast(res.message ?? (res.ok ? "Saved" : "Please fix the errors"), res.ok ? "success" : "error");
    return res;
  }, { ok: false });
  const [cur, setCur] = useState(currency);
  const [tz, setTz] = useState(timezone);
  const zones = useMemo(() => {
    const all = Intl.supportedValuesOf("timeZone");
    return all.includes(timezone) ? all : [timezone, ...all];
  }, [timezone]);

  const err = state.ok ? undefined : state.fieldErrors;

  return (
    <form action={action} className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
      <Field label="Currency" htmlFor="currency" error={err?.currency}>
        <Select id="currency" name="currency" value={cur} onChange={(e) => setCur(e.target.value)}>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Time zone" htmlFor="timezone" error={err?.timezone} hint="Decides what “today” and “this month” mean.">
        <Select id="timezone" name="timezone" value={tz} onChange={(e) => setTz(e.target.value)}>
          {zones.map((z) => (
            <option key={z} value={z}>
              {z.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" variant="primary" disabled={pending || (cur === currency && tz === timezone)}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Save preferences
        </Button>
      </div>
    </form>
  );
}
