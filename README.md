# OASLOC Concern Tracker

A government case management web application for tracking OFW (Overseas Filipino Worker) concerns.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase (Auth, Postgres, Storage) · Vercel

---

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- (Optional) [Vercel](https://vercel.com) account for deployment

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Both values are found in your Supabase project under **Settings → API**.

---

## Supabase Setup

### 1. Run the database migration

In the Supabase dashboard, go to **SQL Editor** and run the contents of:

```
supabase/migrations/001_initial.sql
```

This creates:
- `cases` table with all required columns and RLS policies
- `case_documents` table with RLS policies
- The `case-documents` storage bucket with RLS policies

> **Note:** The `insert into storage.buckets` line in the migration creates the bucket automatically. If you prefer, you can create it manually in **Storage → New bucket** (name: `case-documents`, Public: off) and skip that line.

### 2. Create users

No self-registration is provided. Create users manually in the Supabase dashboard under **Authentication → Users → Add user**.

---

## Running Locally

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to `/login`.

---

## Deploying to Vercel

1. Push this repository to GitHub.
2. In Vercel, click **Add New Project** and import the repository.
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**.

No additional build configuration is needed — Next.js is auto-detected.

---

## Application Structure

```
app/
  page.tsx                  — Dashboard (case list)
  login/
    page.tsx                — Login page
    actions.ts              — login / logout server actions
  cases/
    new/page.tsx            — New case form
    [id]/edit/page.tsx      — Edit case form
    actions.ts              — save / document server actions

components/
  Header.tsx                — App header with logout
  LoginForm.tsx             — Login form (client)
  DashboardClient.tsx       — Interactive table (client)
  CaseForm.tsx              — Case form (client)
  DocumentSection.tsx       — File upload/list (client)
  StatusBadge.tsx           — Colored status pill
  DateInput.tsx             — mm/dd/yyyy text input
  Toast.tsx                 — Toast notification system

lib/
  constants.ts              — All configurable list values
  types.ts                  — TypeScript types
  utils.ts                  — Formatting helpers
  supabase/
    client.ts               — Browser Supabase client
    server.ts               — Server Supabase client (cookie-based)

middleware.ts               — Auth guard (redirects unauthenticated users)
supabase/migrations/
  001_initial.sql           — Full schema + RLS + storage
```

---

## Extending List Values

All dropdown/checkbox options live in `lib/constants.ts`. To add a new option (e.g., a new source of concern), simply append to the relevant array:

```ts
export const SOURCE_OF_CONCERN_OPTIONS = ['Walk-in', 'Email', 'Others', 'Phone']
```

No other changes are needed.

---

## Notes

- **Aging** is always computed on the fly (`today − entry_date`) and is never stored.
- **Date inputs** accept and display `mm/dd/yyyy` but store ISO `YYYY-MM-DD` in Postgres.
- **Documents** are stored in Supabase Storage at `{case_id}/{uuid}.{ext}`. Signed URLs (valid 120 s) are used for downloads.
- **Row-level security** is enabled on all tables. Authenticated users can read and write all rows.
