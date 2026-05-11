-- Reset script for a Supabase project that already has stale/old tables.
-- Run this in Supabase SQL Editor when you need the database to match the ERD exactly.

drop table if exists public.reviews cascade;
drop table if exists public.profiles cascade;
drop table if exists public.orders cascade;
drop table if exists public.people cascade;
drop table if exists public.products cascade;

drop function if exists public.sync_order_totals();
drop function if exists public.is_admin() cascade;

create extension if not exists pgcrypto;

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  reviewer text not null,
  rating integer not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  ean text not null unique,
  title text not null,
  category text,
  vendor text,
  price numeric(12, 2) not null check (price >= 0),
  rating numeric(3, 2) not null default 0 check (rating >= 0 and rating <= 5),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table public.people (
  id uuid primary key,
  address text,
  email text,
  password text,
  name text,
  city text,
  state text,
  source text,
  birth_date date,
  zip text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  product_id uuid not null,
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  tax numeric(12, 2) not null default 0 check (tax >= 0),
  total numeric(12, 2) not null default 0 check (total >= 0),
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  created_at timestamptz not null default timezone('utc'::text, now()),
  quantity integer not null default 1 check (quantity >= 1)
);

create index idx_reviews_product_id on public.reviews(product_id);
create index idx_products_ean on public.products(ean);
create index idx_people_email on public.people(email);
create index idx_orders_user_id on public.orders(user_id);
create index idx_orders_product_id on public.orders(product_id);
create index idx_orders_created_at on public.orders(created_at desc);

alter table public.reviews
  add constraint reviews_product_id_fkey
  foreign key (product_id) references public.products(id) on delete cascade;

alter table public.orders
  add constraint orders_user_id_fkey
  foreign key (user_id) references public.people(id) on delete cascade;

alter table public.orders
  add constraint orders_product_id_fkey
  foreign key (product_id) references public.products(id) on delete cascade;

create or replace function public.sync_order_totals()
returns trigger
language plpgsql
as $$
declare
  product_price numeric(12, 2);
begin
  if new.quantity is null or new.quantity < 1 then
    new.quantity = 1;
  end if;

  if new.product_id is not null then
    select p.price into product_price
    from public.products p
    where p.id = new.product_id;
  end if;

  if new.subtotal is null or new.subtotal = 0 then
    if product_price is not null then
      new.subtotal = round((product_price * new.quantity)::numeric, 2);
    else
      new.subtotal = 0;
    end if;
  end if;

  if new.tax is null then
    new.tax = round((new.subtotal * 0.1)::numeric, 2);
  end if;

  if new.discount is null then
    new.discount = 0;
  end if;

  new.total = round(greatest(new.subtotal + new.tax - new.discount, 0)::numeric, 2);
  return new;
end;
$$;

drop trigger if exists trg_orders_totals on public.orders;
create trigger trg_orders_totals
before insert or update on public.orders
for each row execute function public.sync_order_totals();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'user') = 'admin';
$$;

alter table public.reviews enable row level security;
alter table public.products enable row level security;
alter table public.people enable row level security;
alter table public.orders enable row level security;

create policy "reviews_select_policy"
on public.reviews
for select
to authenticated
using (true);

create policy "reviews_manage_policy"
on public.reviews
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "products_select_policy"
on public.products
for select
to authenticated
using (true);

create policy "products_manage_policy"
on public.products
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "people_select_policy"
on public.people
for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "people_update_policy"
on public.people
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy "people_insert_policy"
on public.people
for insert
to authenticated
with check (id = auth.uid() or public.is_admin());

create policy "people_delete_policy"
on public.people
for delete
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "orders_select_policy"
on public.orders
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy "orders_insert_policy"
on public.orders
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

create policy "orders_update_policy"
on public.orders
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy "orders_delete_policy"
on public.orders
for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());
