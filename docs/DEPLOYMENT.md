# Deployment

## 1. Supabase

Create project, then run:

```txt
supabase/schema.sql
```

Create storage bucket:

```txt
tenant-files
```

Keep it private.

## 2. Local environment

Create `.env.local`:

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Optional:

```txt
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

## 3. Run locally

```bash
npm install
npm run dev
```

## 4. Vercel

- Push to GitHub.
- Import in Vercel.
- Add environment variables.
- Deploy.

## 5. Custom domain

In Vercel:
- Project Settings
- Domains
- Add your domain
- Follow DNS instructions shown by Vercel.

Typical DNS:
- A record for root domain
- CNAME for `www`

Vercel automatically provisions SSL after DNS propagation.

## 6. Before production

- Use a real email domain.
- Add monitoring.
- Add proper backup.
- Add legal pages.
- Add billing flow.
- Add role permission matrix.
- Test RLS with multiple organizations.
