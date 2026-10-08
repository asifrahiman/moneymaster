"use client";

import clsx from "clsx";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { formatMoney } from "@/lib/format";

/*
 * Charts read colours from CSS variables (--series-N), so they follow the
 * light/dark theme and each category keeps its own colour everywhere.
 */

const axisTick = { fill: "var(--muted)", fontSize: 12 };
const seriesColor = (slot: string) => `var(--series-${slot}, var(--series-other))`;

type Series = { key: string; name: string; color: string };

function ChartTooltip({
  active,
  payload,
  label,
  currency,
  sortByValue = false,
}: TooltipContentProps & { currency: string; sortByValue?: boolean }) {
  if (!active || !payload?.length) return null;
  const items = payload.filter((p) => Number(p.value) > 0);
  const total = items.reduce((s, p) => s + Number(p.value), 0);
  return (
    <div className="min-w-44 rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-lg">
      {label !== undefined && <p className="mb-1.5 font-medium text-ink">{String(label)}</p>}
      <ul className="flex flex-col gap-1">
        {(sortByValue ? items.slice().sort((a, b) => Number(b.value) - Number(a.value)) : items.slice().reverse())
          .map((p) => (
            <li key={String(p.dataKey ?? p.name)} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-ink-2">
                <span className="size-2 rounded-full" style={{ background: p.color ?? p.payload?.fill }} />
                {p.name}
              </span>
              <span className="tabular text-ink">{formatMoney(Number(p.value), currency)}</span>
            </li>
          ))}
      </ul>
      {items.length > 1 && (
        <p className="mt-1.5 flex justify-between border-t border-line pt-1.5 font-medium text-ink">
          <span>Total</span>
          <span className="tabular">{formatMoney(total, currency)}</span>
        </p>
      )}
    </div>
  );
}

function LegendRow({ series }: { series: Series[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 px-1 pt-2 text-xs text-ink-2">
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: seriesColor(s.color) }} aria-hidden />
          {s.name}
        </li>
      ))}
    </ul>
  );
}

/**
 * Monthly spending per category as lines. The legend is interactive: click
 * categories to highlight them and only the highlighted lines are drawn (the
 * y-axis rescales to fit). With nothing highlighted, every line is shown.
 */
export function CategoryLinesChart({
  data,
  series,
  currency,
}: {
  data: Record<string, string | number>[];
  series: Series[];
  currency: string;
}) {
  const [highlighted, setHighlighted] = useState<Set<string>>(() => new Set());
  // Drop highlights for series that are no longer listed (e.g. after switching Top 5 ↔ All saved).
  const active = new Set([...highlighted].filter((k) => series.some((s) => s.key === k)));
  const visible = (key: string) => active.size === 0 || active.has(key);
  const toggle = (key: string) =>
    setHighlighted(() => {
      const next = new Set(active);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div>
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: "var(--line-strong)" }} />
            <YAxis
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(v: number) => formatMoney(v, currency, { compact: true })}
            />
            <Tooltip
              cursor={{ stroke: "var(--line-strong)" }}
              content={(p) => <ChartTooltip {...(p as TooltipContentProps)} currency={currency} sortByValue />}
            />
            {series.map((s) => (
              <Line
                key={s.key}
                dataKey={s.key}
                name={s.name}
                type="monotone"
                hide={!visible(s.key)}
                stroke={seriesColor(s.color)}
                strokeWidth={active.has(s.key) ? 2.5 : 2}
                dot={data.length <= 12 ? { r: 2.5, strokeWidth: 0, fill: seriesColor(s.color) } : false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap items-start gap-x-3 gap-y-1 px-1 pt-2">
        <ul className="flex flex-1 flex-wrap gap-1" aria-label="Show categories">
          {series.map((s) => {
            const on = active.has(s.key);
            return (
              <li key={s.key}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(s.key)}
                  className={clsx(
                    "flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs transition-colors",
                    on
                      ? "border-line-strong bg-surface-2 font-medium text-ink"
                      : active.size
                        ? "border-transparent text-muted hover:text-ink-2"
                        : "border-transparent text-ink-2 hover:bg-surface-2",
                  )}
                >
                  <span
                    className={clsx("size-2.5 rounded-full", !visible(s.key) && "opacity-30")}
                    style={{ background: seriesColor(s.color) }}
                    aria-hidden
                  />
                  {s.name}
                </button>
              </li>
            );
          })}
        </ul>
        {active.size > 0 && (
          <button
            type="button"
            onClick={() => setHighlighted(new Set())}
            className="shrink-0 px-1 py-0.5 text-xs font-medium text-accent hover:underline"
          >
            Show all
          </button>
        )}
      </div>
      <p className="px-1 pt-1 text-[11px] text-muted">
        {active.size ? `Showing ${active.size} of ${series.length}` : "Tap categories to show only those"}
      </p>
    </div>
  );
}

/** Income vs spending per month, side by side on one axis. */
export function IncomeVsSpendChart({
  data,
  currency,
}: {
  data: { label: string; income: number; spent: number }[];
  currency: string;
}) {
  const series: Series[] = [
    { key: "income", name: "Income", color: "3" },
    { key: "spent", name: "Spent", color: "1" },
  ];
  return (
    <div>
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barGap={2} barCategoryGap="25%">
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: "var(--line-strong)" }} />
            <YAxis
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(v: number) => formatMoney(v, currency, { compact: true })}
            />
            <Tooltip
              cursor={{ fill: "var(--surface-2)" }}
              content={(p) => <ChartTooltip {...(p as TooltipContentProps)} currency={currency} />}
            />
            <Legend content={() => null} />
            {series.map((s) => (
              <Bar key={s.key} dataKey={s.key} name={s.name} fill={seriesColor(s.color)} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <LegendRow series={series} />
    </div>
  );
}

/** Part-to-whole donut, top categories + Other. */
export function CategoryDonut({
  data,
  currency,
  total,
}: {
  data: { name: string; color: string; total: number }[];
  currency: string;
  total: number;
}) {
  return (
    <div className="relative h-56 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Tooltip content={(p) => <ChartTooltip {...(p as TooltipContentProps)} label={undefined} currency={currency} />} />
          <Pie
            data={data}
            dataKey="total"
            nameKey="name"
            innerRadius="64%"
            outerRadius="95%"
            paddingAngle={1}
            stroke="var(--surface)"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={seriesColor(d.color)} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-muted">Spent</span>
        <span className="tabular text-sm font-semibold tracking-tight text-ink">
          {formatMoney(total, currency)}
        </span>
      </div>
    </div>
  );
}
