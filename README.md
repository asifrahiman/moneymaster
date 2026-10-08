# MoneyMaster

A personal expense tracker covering spending, income and savings. It is a rewrite of the original PHP + AngularJS app
in **Next.js 16 (App Router) + TypeScript + Postgres**, with Google sign-in. It works on phones and on desktop, and
has light and dark themes.

| | |
|---|---|
| **Framework** | Next.js 16 (React 19, Server Components, Server Actions) |
| **Language** | TypeScript (strict) |
| **Database** | PostgreSQL via [Drizzle ORM](https://orm.drizzle.team) with SQL migrations in `drizzle/` |
| **Auth** | [Auth.js v5](https://authjs.dev) with Google, JWT sessions, optional allow-list |
| **UI** | Tailwind CSS v4, Recharts, lucide icons |
| **Tests** | Vitest unit tests (`npm test`) |

## Features

- **Dashboard.** Shows this month's spent, income, saved and net. It compares your spending with the same point
  last month, has a quick-add form, a by-category breakdown and your recent transactions.
- **Transactions.** Filters (date range, category, type, card only, search) are kept in the URL. Paging and totals
  are done on the server. Tap any row to edit or delete it. You can export the current view as CSV.
- **Amount formulas.** Type `120+80*2` or `=1500/3` in the amount field. You see a live preview, and the server
  re-checks the result. Only `+ - * / ( )` are allowed, and nothing gets `eval`-ed.
- **Reports.** Totals and share by category for any period, a spending-mix donut, CSV export, and links through
  to the matching transactions.
- **Trends.** Monthly spending by category over 6, 12 or 24 months (top 5 categories plus "Other"), income vs
  spending, and a table of the monthly figures.
- **Categories.** Each user has their own categories. A category has a type (expense, income or savings) and a
  colour. You can rename it, and you can merge it into another category when you delete it.
- **Settings.** Currency and time zone. The time zone decides what "today" and "this month" mean.

## Run locally

```bash
cp .env.example .env              # fill in DATABASE_URL and AUTH_SECRET at minimum
npm install
npm run db:migrate                # creates the tables
npm run dev                       # http://localhost:3000
```

You can try it without setting up Google: set `AUTH_DEV_LOGIN=true` in `.env` and a "Sign in without Google"
form appears on the login page. It only works in development.

Useful scripts:

| Script | What it does |
|---|---|
| `npm test` / `npm run typecheck` / `npm run lint` | Quality checks |
| `npm run db:generate` | Create a new migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Browse the database in your browser |
| `npm run import:legacy` | Import data from the old MySQL app (see below) |

## Deploy for free (no server to maintain)

**Vercel (Hobby)** hosts the app and **Neon (Free)** hosts Postgres. Both are fully managed: there's nothing to
patch or restart, and each `git push` deploys automatically.

| | Free tier (as of Oct 2026) | Enough for this app? |
|---|---|---|
| Vercel Hobby | 1M function invocations, 4 h active CPU and 100 GB transfer per month; personal, non-commercial use only | Yes, by a wide margin for a personal or family tracker |
| Neon Free | 100 compute-hours per project per month, 1 GB storage per project, scales to zero after 5 min idle, no card needed | Yes. 1 GB holds millions of transactions |

> These limits change from time to time. Check [vercel.com/pricing](https://vercel.com/pricing) and
> [neon.com/pricing](https://neon.com/pricing). Because Neon scales to zero, the first request after a quiet
> spell takes about a second longer.

### 1. Put the code on GitHub

```bash
git init && git add -A && git commit -m "MoneyMaster v2"
gh repo create moneymaster --private --source=. --push      # or create the repo on github.com
```

### 2. Create the project on Vercel and add Neon

1. Go to [vercel.com/new](https://vercel.com/new), import the GitHub repo, and keep the defaults.
2. In the project, open **Storage → Create Database → Neon (Postgres)** and pick the free plan in a region near
   you, for example *Singapore* or *Mumbai*. This sets `DATABASE_URL` and `DATABASE_URL_UNPOOLED` for you.
3. Every deploy runs `npm run vercel-build`, which applies the migrations and then builds the app.

### 3. Create Google sign-in credentials

1. In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create a project.
2. Configure the **OAuth consent screen**: choose External and add your email as a test user, or publish it.
3. Go to **Create credentials → OAuth client ID → Web application** and set:
   - Authorised JavaScript origins: `https://<your-app>.vercel.app`
   - Authorised redirect URI: `https://<your-app>.vercel.app/api/auth/callback/google`
   - For local development, also add `http://localhost:3000` and `http://localhost:3000/api/auth/callback/google`.
4. Copy the client ID and secret.

### 4. Set the environment variables on Vercel

In **Project → Settings → Environment Variables**:

| Name | Value |
|---|---|
| `AUTH_SECRET` | output of `npx auth secret` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | from step 3 |
| `ALLOWED_EMAILS` | e.g. `you@gmail.com,partner@gmail.com` (**recommended**, otherwise any Google account can sign up) |

Redeploy, and you're live.

## Importing data from the old app

1. In phpMyAdmin on the old host, select the database and choose **Export → Quick → SQL**. This downloads a
   `.sql` file containing `expenses`, `type` and `users`.
2. Do a dry run. Old users had a display name and no email, so map each one you want to the Google account
   that should own the data:

   ```bash
   DATABASE_URL="<Neon unpooled url>" npm run import:legacy -- \
     --sql moneymaster.sql --map "Asif=you@gmail.com" --fix-typos --prune-unused --dry-run
   ```

   The dry run lists the categories it will create and any rows it will skip.
3. Run the same command again without `--dry-run`, then sign in with that Google account.

How old data maps to the new app:

| Old app | New app |
|---|---|
| Saved types (the `type` table) | Categories. `Credit` becomes income, `Savings` becomes savings |
| Free-text "Others" types | The **Others** category, with the old label kept as the note (searchable) |
| `isCredit = 1` | Paid by card |
| Rows with amount ≤ 0 | Skipped and listed in the report |

Useful options:

- `--fix-typos` merges known variants, for example Intrest → Interest and CarryForward → Carry forward.
- `--prune-unused` removes the starter categories that are created on first sign-in, if they're still unused.
- `--categories all` turns every distinct label into its own category instead of using Others.

Running the import again is safe: rows that were already imported are skipped. You can also import from a
CSV with `--csv expenses.csv`, or read a live MySQL database with `--mysql <url>`.

### One-time entries

Use **Category → "One-time (don't save as a category)…"** for one-off spends. The entry goes into **Others**,
and what you type becomes its label, so your category list doesn't grow. If a label keeps recurring, create a
proper category for it in Settings.

## Project layout

```
src/
  app/                 routes: (app)/ dashboard, transactions, reports, trends, settings; login; api/
  components/          UI (forms, list, charts, filter bar, modal, toast)
  db/schema.ts         tables: users, categories, transactions
  lib/                 pure helpers: amount parser, dates, filters, formatting, palette (unit-tested)
  server/
    dal.ts             requireUser(): checks the session, used by every page and action
    queries.ts         reads (always scoped to the user)
    actions.ts         Server Actions for writes (validated, scoped to the user)
  auth.ts, proxy.ts    Auth.js config and route protection
drizzle/               SQL migrations
scripts/import-legacy.ts
tests/
```

## Security model

- Every read and write goes through `requireUser()`, and every query includes `user_id = <session user>`.
  Changing an id in the URL or in a request can't reach another person's data.
- All SQL is parameterised by Drizzle. Inputs are validated on the server with zod and the date and amount parsers.
- Secrets live only in environment variables, and `.env*` is git-ignored.
- The CSV export guards against spreadsheet formula injection.
