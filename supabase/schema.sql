-- Run in Supabase SQL Editor

create extension if not exists pgcrypto;

-- Keep profiles for current auth/role flow in backend/frontend.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- ERD table: PEOPLE
create table if not exists public.people (
  id uuid primary key,
  address text,
  email text,
  password text,
  name text,
  city text,
  longitude numeric(10, 6),
  state text,
  source text,
  birth_date date,
  zip text,
  latitude numeric(10, 6),
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- ERD table: PRODUCTS
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  ean text not null unique,
  title text not null,
  category text,
  vendor text,
  price numeric(12, 2) not null check (price >= 0),
  rating numeric(3, 2) not null default 0 check (rating >= 0 and rating <= 5),
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- ERD table: ORDERS (keeps compatibility columns used by current app)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  product_id uuid,
  subtotal numeric(12, 2) not null default 0,
  tax numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  discount numeric(12, 2) not null default 0,
  quantity integer not null default 1,
  code text not null unique,
  title text not null,
  amount numeric(12, 2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- Backfill additional ERD columns if orders table was created by older schema.
alter table public.orders add column if not exists product_id uuid;
alter table public.orders add column if not exists subtotal numeric(12, 2) not null default 0;
alter table public.orders add column if not exists tax numeric(12, 2) not null default 0;
alter table public.orders add column if not exists total numeric(12, 2) not null default 0;
alter table public.orders add column if not exists discount numeric(12, 2) not null default 0;
alter table public.orders add column if not exists quantity integer not null default 1;

-- ERD table: REVIEWS
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  reviewer text not null,
  rating integer not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- Ensure people has rows for existing profiles/orders before switching constraints.
insert into public.people (id, email, name, created_at)
select
  p.id,
  u.email,
  p.full_name,
  p.created_at
from public.profiles p
left join auth.users u on u.id = p.id
on conflict (id) do update
set
  email = coalesce(excluded.email, public.people.email),
  name = coalesce(excluded.name, public.people.name);

insert into public.people (id)
select distinct o.user_id
from public.orders o
left join public.people pe on pe.id = o.user_id
where pe.id is null
on conflict (id) do nothing;

do $$
begin
  -- Rebind orders.user_id to PEOPLE for ERD relation.
  if exists (
    select 1
    from pg_constraint c
    where c.conrelid = 'public.orders'::regclass
      and c.conname = 'orders_user_id_fkey'
      and c.confrelid <> 'public.people'::regclass
  ) then
    alter table public.orders drop constraint orders_user_id_fkey;
  end if;

  if not exists (
    select 1
    from pg_constraint c
    where c.conrelid = 'public.orders'::regclass
      and c.conname = 'orders_user_id_fkey'
  ) then
    alter table public.orders
      add constraint orders_user_id_fkey
      foreign key (user_id) references public.people(id) on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint c
    where c.conrelid = 'public.orders'::regclass
      and c.conname = 'orders_product_id_fkey'
  ) then
    alter table public.orders
      add constraint orders_product_id_fkey
      foreign key (product_id) references public.products(id) on delete set null;
  end if;
end $$;

create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_product_id on public.orders(product_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_products_ean on public.products(ean);
create index if not exists idx_reviews_product_id on public.reviews(product_id);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create or replace function public.sync_order_financials()
returns trigger
language plpgsql
as $$
declare
  product_price numeric(12, 2);
  product_title text;
begin
  if new.quantity is null or new.quantity < 1 then
    new.quantity = 1;
  end if;

  if new.product_id is not null then
    select p.price, p.title
      into product_price, product_title
    from public.products p
    where p.id = new.product_id;
  end if;

  if (new.subtotal is null or new.subtotal = 0) and product_price is not null then
    new.subtotal = round((product_price * new.quantity)::numeric, 2);
  end if;

  if new.subtotal is null then
    new.subtotal = coalesce(new.amount, 0);
  end if;

  if new.tax is null then
    new.tax = 0;
  end if;

  if new.discount is null then
    new.discount = 0;
  end if;

  new.total = round(greatest(new.subtotal + new.tax - new.discount, 0)::numeric, 2);

  if new.total <= 0 then
    new.amount = 0.01;
  else
    new.amount = new.total;
  end if;

  if new.title is null or btrim(new.title) = '' then
    new.title = coalesce(product_title, 'Order item');
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.handle_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.handle_updated_at();

drop trigger if exists trg_orders_financials on public.orders;
create trigger trg_orders_financials
before insert or update on public.orders
for each row execute function public.sync_order_financials();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.people enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "profiles_select_policy" on public.profiles;
create policy "profiles_select_policy"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_policy" on public.profiles;
create policy "profiles_update_policy"
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_policy" on public.profiles;
create policy "profiles_insert_policy"
on public.profiles
for insert
to authenticated
with check (id = auth.uid() or public.is_admin());

drop policy if exists "people_select_policy" on public.people;
create policy "people_select_policy"
on public.people
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "people_update_policy" on public.people;
create policy "people_update_policy"
on public.people
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "people_insert_policy" on public.people;
create policy "people_insert_policy"
on public.people
for insert
to authenticated
with check (id = auth.uid() or public.is_admin());

drop policy if exists "products_select_policy" on public.products;
create policy "products_select_policy"
on public.products
for select
to authenticated
using (true);

drop policy if exists "products_insert_policy" on public.products;
create policy "products_insert_policy"
on public.products
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "products_update_policy" on public.products;
create policy "products_update_policy"
on public.products
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "products_delete_policy" on public.products;
create policy "products_delete_policy"
on public.products
for delete
to authenticated
using (public.is_admin());

drop policy if exists "orders_select_policy" on public.orders;
create policy "orders_select_policy"
on public.orders
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "orders_insert_policy" on public.orders;
create policy "orders_insert_policy"
on public.orders
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "orders_update_policy" on public.orders;
create policy "orders_update_policy"
on public.orders
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "orders_delete_policy" on public.orders;
create policy "orders_delete_policy"
on public.orders
for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "reviews_select_policy" on public.reviews;
create policy "reviews_select_policy"
on public.reviews
for select
to authenticated
using (true);

drop policy if exists "reviews_insert_policy" on public.reviews;
create policy "reviews_insert_policy"
on public.reviews
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "reviews_update_policy" on public.reviews;
create policy "reviews_update_policy"
on public.reviews
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "reviews_delete_policy" on public.reviews;
create policy "reviews_delete_policy"
on public.reviews
for delete
to authenticated
using (public.is_admin());
