-- Kerviqo Event Rental SaaS schema
-- Run this in Supabase SQL Editor.

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Optional for future AI search:
-- create extension if not exists vector;

create type public.app_role as enum ('owner', 'admin', 'employee', 'saas_owner');
create type public.subscription_status as enum ('trial', 'active', 'expired', 'blocked');
create type public.booking_status as enum ('pending', 'confirmed', 'delivered', 'returned', 'cancelled');
create type public.payment_method as enum ('cash', 'bank_transfer', 'check', 'other');
create type public.material_condition as enum ('excellent', 'good', 'damaged', 'maintenance');
create type public.event_type as enum ('wedding', 'engagement', 'birthday', 'corporate', 'party', 'other');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  city text,
  logo_url text,
  subscription_status public.subscription_status not null default 'trial',
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price_monthly numeric(12,2) not null default 0,
  users_limit integer not null default 1,
  storage_limit_mb integer not null default 512,
  bookings_limit integer not null default 100,
  products_limit integer not null default 100,
  features jsonb not null default '{}',
  created_at timestamptz not null default now()
);

insert into public.plans (name, price_monthly, users_limit, storage_limit_mb, bookings_limit, products_limit, features)
values
('Free', 0, 1, 100, 25, 25, '{"reports": false, "owner_admin": false}'),
('Basic', 199, 3, 2048, 500, 500, '{"reports": true, "owner_admin": false}'),
('Pro', 399, 10, 5120, 5000, 5000, '{"reports": true, "owner_admin": false, "advanced_analytics": true}')
on conflict (name) do nothing;

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  status public.subscription_status not null default 'trial',
  trial_ends_at timestamptz,
  current_period_ends_at timestamptz,
  provider text default 'manual',
  provider_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'employee',
  phone text,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  category text not null,
  quantity_total integer not null default 0 check (quantity_total >= 0),
  quantity_available integer not null default 0 check (quantity_available >= 0),
  quantity_reserved integer not null default 0 check (quantity_reserved >= 0),
  rental_price numeric(12,2) not null default 0,
  image_url text,
  condition_status public.material_condition not null default 'good',
  notes text,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null,
  phone text not null,
  whatsapp text,
  email text,
  cin_number text,
  address text,
  notes text,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  event_type public.event_type not null,
  event_date date not null,
  delivery_date date not null,
  return_date date not null,
  location_address text not null,
  status public.booking_status not null default 'pending',
  total_amount numeric(12,2) not null default 0,
  avance_paid numeric(12,2) not null default 0,
  reste_amount numeric(12,2) not null default 0,
  notes text,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_booking_dates check (return_date >= delivery_date and event_date >= delivery_date)
);

create table public.booking_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.booking_services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  name text not null,
  price numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  method public.payment_method not null default 'cash',
  payment_date date not null default current_date,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  invoice_number text not null,
  issue_date date not null default current_date,
  total_amount numeric(12,2) not null default 0,
  pdf_path text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (organization_id, invoice_number)
);

create table public.files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_type text not null,
  owner_id uuid not null,
  module text not null,
  original_name text not null,
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  actor_id uuid default auth.uid(),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.error_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  actor_id uuid default auth.uid(),
  source text not null,
  message text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_profiles_org on public.profiles(organization_id);
create index idx_materials_org on public.materials(organization_id);
create index idx_clients_org on public.clients(organization_id);
create index idx_bookings_org_dates on public.bookings(organization_id, event_date, delivery_date, return_date);
create index idx_booking_items_org_material on public.booking_items(organization_id, material_id);
create index idx_payments_org_date on public.payments(organization_id, payment_date);
create index idx_files_org on public.files(organization_id);
create index idx_audit_org_created on public.audit_logs(organization_id, created_at desc);
create index idx_error_org_created on public.error_logs(organization_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_set_updated_at before update on public.organizations
for each row execute function public.set_updated_at();

create trigger subscriptions_set_updated_at before update on public.subscriptions
for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create trigger materials_set_updated_at before update on public.materials
for each row execute function public.set_updated_at();

create trigger clients_set_updated_at before update on public.clients
for each row execute function public.set_updated_at();

create trigger bookings_set_updated_at before update on public.bookings
for each row execute function public.set_updated_at();

create or replace function public.current_organization_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select p.organization_id
  from public.profiles p
  join public.organizations o on o.id = p.organization_id
  where p.id = auth.uid()
    and p.is_blocked = false
    and o.is_blocked = false
    and o.subscription_status in ('trial', 'active')
  limit 1;
$$;

create or replace function public.current_app_role()
returns public.app_role
language sql
security definer
set search_path = public
stable
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and is_blocked = false
  limit 1;
$$;

create or replace function public.is_saas_owner()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'saas_owner'
      and is_blocked = false
  );
$$;

create or replace function public.has_active_org()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organizations o
    left join public.subscriptions s on s.organization_id = o.id
    where o.id = public.current_organization_id()
      and o.is_blocked = false
      and (
        o.subscription_status in ('trial', 'active')
        or s.status in ('trial', 'active')
      )
  );
$$;

create or replace function public.check_material_availability(
  p_organization_id uuid,
  p_material_id uuid,
  p_start_date date,
  p_end_date date
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  total_qty integer;
  reserved_qty integer;
begin
  if p_organization_id <> public.current_organization_id() then
    raise exception 'Not allowed';
  end if;

  select quantity_total into total_qty
  from public.materials
  where id = p_material_id
    and organization_id = p_organization_id;

  if total_qty is null then
    return 0;
  end if;

  select coalesce(sum(bi.quantity), 0) into reserved_qty
  from public.booking_items bi
  join public.bookings b on b.id = bi.booking_id
  where bi.organization_id = p_organization_id
    and bi.material_id = p_material_id
    and b.status in ('pending', 'confirmed', 'delivered')
    and daterange(b.delivery_date, b.return_date, '[]') && daterange(p_start_date, p_end_date, '[]');

  return greatest(total_qty - reserved_qty, 0);
end;
$$;

alter table public.organizations enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.profiles enable row level security;
alter table public.materials enable row level security;
alter table public.clients enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_items enable row level security;
alter table public.booking_services enable row level security;
alter table public.payments enable row level security;
alter table public.invoices enable row level security;
alter table public.files enable row level security;
alter table public.audit_logs enable row level security;
alter table public.error_logs enable row level security;

-- Plans are readable by authenticated users.
create policy "plans_read_authenticated" on public.plans
for select to authenticated
using (true);

-- SaaS owner can view all organizations. Regular users can view only their organization.
create policy "organizations_select_own_or_saas" on public.organizations
for select to authenticated
using (id = public.current_organization_id() or public.is_saas_owner());

create policy "organizations_update_owner_or_saas" on public.organizations
for update to authenticated
using ((id = public.current_organization_id() and public.current_app_role() in ('owner','admin')) or public.is_saas_owner())
with check ((id = public.current_organization_id() and public.current_app_role() in ('owner','admin')) or public.is_saas_owner());

create policy "subscriptions_select_own_or_saas" on public.subscriptions
for select to authenticated
using (organization_id = public.current_organization_id() or public.is_saas_owner());

create policy "subscriptions_admin_saas_only" on public.subscriptions
for all to authenticated
using (public.is_saas_owner())
with check (public.is_saas_owner());

create policy "profiles_select_own_org_or_saas" on public.profiles
for select to authenticated
using (organization_id = public.current_organization_id() or public.is_saas_owner() or id = auth.uid());

create policy "profiles_update_owner_admin" on public.profiles
for update to authenticated
using (
  (organization_id = public.current_organization_id() and public.current_app_role() in ('owner','admin'))
  or id = auth.uid()
  or public.is_saas_owner()
)
with check (
  (organization_id = public.current_organization_id() and public.current_app_role() in ('owner','admin'))
  or id = auth.uid()
  or public.is_saas_owner()
);

-- Generic tenant policies.
create policy "materials_tenant_select" on public.materials
for select to authenticated
using (organization_id = public.current_organization_id() or public.is_saas_owner());

create policy "materials_tenant_insert" on public.materials
for insert to authenticated
with check (organization_id = public.current_organization_id() and public.has_active_org());

create policy "materials_tenant_update" on public.materials
for update to authenticated
using (organization_id = public.current_organization_id() and public.current_app_role() in ('owner','admin'))
with check (organization_id = public.current_organization_id());

create policy "materials_tenant_delete" on public.materials
for delete to authenticated
using (organization_id = public.current_organization_id() and public.current_app_role() in ('owner','admin'));

create policy "clients_tenant_select" on public.clients
for select to authenticated
using (organization_id = public.current_organization_id() or public.is_saas_owner());

create policy "clients_tenant_insert" on public.clients
for insert to authenticated
with check (organization_id = public.current_organization_id() and public.has_active_org());

create policy "clients_tenant_update" on public.clients
for update to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "clients_tenant_delete" on public.clients
for delete to authenticated
using (organization_id = public.current_organization_id() and public.current_app_role() in ('owner','admin'));

create policy "bookings_tenant_select" on public.bookings
for select to authenticated
using (organization_id = public.current_organization_id() or public.is_saas_owner());

create policy "bookings_tenant_insert" on public.bookings
for insert to authenticated
with check (organization_id = public.current_organization_id() and public.has_active_org());

create policy "bookings_tenant_update" on public.bookings
for update to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "bookings_tenant_delete" on public.bookings
for delete to authenticated
using (organization_id = public.current_organization_id() and public.current_app_role() in ('owner','admin'));

create policy "booking_items_tenant_all" on public.booking_items
for all to authenticated
using (organization_id = public.current_organization_id() or public.is_saas_owner())
with check (organization_id = public.current_organization_id());

create policy "booking_services_tenant_all" on public.booking_services
for all to authenticated
using (organization_id = public.current_organization_id() or public.is_saas_owner())
with check (organization_id = public.current_organization_id());

create policy "payments_tenant_select" on public.payments
for select to authenticated
using (organization_id = public.current_organization_id() or public.is_saas_owner());

create policy "payments_tenant_insert" on public.payments
for insert to authenticated
with check (organization_id = public.current_organization_id() and public.has_active_org());

create policy "payments_tenant_update_delete_admin" on public.payments
for all to authenticated
using (organization_id = public.current_organization_id() and public.current_app_role() in ('owner','admin'))
with check (organization_id = public.current_organization_id());

create policy "invoices_tenant_all" on public.invoices
for all to authenticated
using (organization_id = public.current_organization_id() or public.is_saas_owner())
with check (organization_id = public.current_organization_id());

create policy "files_tenant_all" on public.files
for all to authenticated
using (organization_id = public.current_organization_id() or public.is_saas_owner())
with check (organization_id = public.current_organization_id());

create policy "audit_logs_select" on public.audit_logs
for select to authenticated
using (organization_id = public.current_organization_id() or public.is_saas_owner());

create policy "audit_logs_insert" on public.audit_logs
for insert to authenticated
with check (organization_id = public.current_organization_id() or public.is_saas_owner());

create policy "error_logs_select" on public.error_logs
for select to authenticated
using (organization_id = public.current_organization_id() or public.is_saas_owner());

create policy "error_logs_insert" on public.error_logs
for insert to authenticated
with check (organization_id = public.current_organization_id() or public.is_saas_owner() or organization_id is null);

-- Supabase Storage policies for a private bucket called tenant-files.
-- Create bucket in dashboard first, or via SQL if available in your project.
insert into storage.buckets (id, name, public)
values ('tenant-files', 'tenant-files', false)
on conflict (id) do nothing;

create policy "tenant_files_select_own_folder" on storage.objects
for select to authenticated
using (
  bucket_id = 'tenant-files'
  and (
    (storage.foldername(name))[1] = public.current_organization_id()::text
    or public.is_saas_owner()
  )
);

create policy "tenant_files_insert_own_folder" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'tenant-files'
  and (storage.foldername(name))[1] = public.current_organization_id()::text
  and public.has_active_org()
);

create policy "tenant_files_update_own_folder" on storage.objects
for update to authenticated
using (
  bucket_id = 'tenant-files'
  and (storage.foldername(name))[1] = public.current_organization_id()::text
)
with check (
  bucket_id = 'tenant-files'
  and (storage.foldername(name))[1] = public.current_organization_id()::text
);

create policy "tenant_files_delete_own_folder" on storage.objects
for delete to authenticated
using (
  bucket_id = 'tenant-files'
  and (
    (storage.foldername(name))[1] = public.current_organization_id()::text
    or public.is_saas_owner()
  )
);
