# Kerviqo Event Rental / Wedding Rental SaaS

Professional multi-tenant SaaS for Moroccan event/wedding rental businesses.

## Fixed in this version

- Replaced placeholder dashboard modules with working server-side pages.
- Added add/list/delete flows for materials, clients, bookings, payments, invoices, and documents.
- Added calendar and reports pages using live Supabase data.
- Fixed the broken `/bookings/new` link by sending users to the working bookings page.
- Added SaaS owner admin panel with organization/user suspend and unblock actions.
- Added blocked account page and stronger auth checks so suspended users/companies are pushed out of protected pages immediately on navigation/API refresh.
- Added private file download route using signed Supabase Storage URLs.
- Added tenant checks to API routes and upload routes.
- Added optional Upstash rate-limit checks for write APIs.
- Improved RLS helper to stop blocked/expired organizations from resolving as active tenants.

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase RLS
- Optional Upstash Redis rate limiting
- Vercel deployment

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Required environment variables

Fill `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Optional rate limiting:

```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Supabase setup

1. Create a Supabase project.
2. Open Supabase SQL Editor.
3. Run `supabase/schema.sql`.
4. The SQL creates a private Storage bucket named `tenant-files` when Supabase allows it. If your project blocks bucket creation by SQL, create the private bucket manually in Supabase Storage with the same name.
5. Add `.env.local` values.
6. Start the app with `npm run dev`.

## Important admin note

To use `/owner-admin`, the profile role must be `saas_owner`. You can manually update one profile in Supabase SQL after registering:

```sql
update public.profiles
set role = 'saas_owner'
where id = 'USER_UUID_HERE';
```

## Production notes

- Run the SQL schema again on a fresh Supabase project for these RLS changes.
- Keep `SUPABASE_SERVICE_ROLE_KEY` only on the server/Vercel environment, never in browser code.
- For true real-time forced logout without waiting for navigation/API refresh, add a small realtime subscription in the client shell. This version blocks protected pages and API access immediately after refresh/navigation.
