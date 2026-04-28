# Architecture

## Product

Event Rental / Wedding Rental SaaS for Morocco.

## Main users

- SaaS owner: owns the platform.
- Organization owner: event rental business owner.
- Admin: manager inside one organization.
- Employee: daily user with limited permissions.

## Tenant model

Every business is an `organization`. Every important row has `organization_id`.

Never query business data without organization scoping. Supabase RLS protects this even if an API mistake happens.

## App structure

- `/` landing page
- `/login`
- `/register`
- `/dashboard`
- `/materials`
- `/bookings`
- `/clients`
- `/payments`
- `/invoices`
- `/documents`
- `/calendar`
- `/reports`
- `/owner-admin`

## API routes

- `POST /api/auth/register`
- `GET/POST /api/materials`
- `GET/POST /api/clients`
- `GET/POST /api/bookings`
- `GET/POST /api/payments`
- `POST /api/files/upload`

## Stock protection

When creating a booking, the backend calls `check_material_availability`.
The function checks overlapping bookings between delivery date and return date.

## Storage protection

Files go to:

```txt
tenant-files/{organization_id}/{module}/{uuid}-{filename}
```

Supabase Storage policies only allow access to the authenticated user's organization folder.

## Subscription protection

Organizations have `subscription_status`.
RLS and API routes block important insert/upload actions when organization is `expired` or `blocked`.

## Redis

Redis is optional at first. Add Upstash when you need rate limiting, API protection, caching, queues, or email/document jobs.

## Vector DB

Vector search is optional. Add Supabase pgvector later only for smart document search, AI assistant, FAQ, or recommendations.
Do not replace PostgreSQL business tables with vector tables.
