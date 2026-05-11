-- Prerequisite:
-- 1) Create Auth users in Supabase Dashboard first:
--    - admin@demo.com
--    - user@demo.com
--    - solomon@demo.com (optional)
-- 2) Set their passwords to the demo values you want to use.
-- 3) Then run this seed script.

update auth.users
set
  raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object(
      'role',
      case
        when email = 'admin@demo.com' then 'admin'
        else 'user'
      end
    ),
  raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object(
      'display_name',
      case
        when email = 'admin@demo.com' then 'Admin Demo'
        when email = 'solomon@demo.com' then 'Solomon Demo'
        else 'User Demo'
      end
    )
where email in ('admin@demo.com', 'user@demo.com', 'solomon@demo.com');

insert into public.people (
  id,
  address,
  email,
  password,
  name,
  city,
  state,
  source,
  birth_date,
  zip
)
select
  u.id,
  case
    when u.email = 'admin@demo.com' then '01 Admin Street'
    when u.email = 'solomon@demo.com' then '88 Solomon Avenue'
    else '23 User Lane'
  end as address,
  u.email,
  case
    when u.email = 'admin@demo.com' then 'secret123'
    when u.email = 'solomon@demo.com' then 'solomon123'
    else 'user12345'
  end as password,
  case
    when u.email = 'admin@demo.com' then 'Admin Demo'
    when u.email = 'solomon@demo.com' then 'Solomon Demo'
    else 'User Demo'
  end as name,
  'Ho Chi Minh City',
  'HCM',
  'supabase-auth',
  date '1995-01-01',
  '700000'
from auth.users u
where u.email in ('admin@demo.com', 'user@demo.com', 'solomon@demo.com')
on conflict (id) do update
set
  address = excluded.address,
  email = excluded.email,
  password = excluded.password,
  name = excluded.name,
  city = excluded.city,
  state = excluded.state,
  source = excluded.source,
  birth_date = excluded.birth_date,
  zip = excluded.zip;

insert into public.products (ean, title, category, vendor, price, rating)
values
  ('EAN-000001', 'Monthly Grocery Pack', 'Grocery', 'Fresh Mart', 120.00, 4.40),
  ('EAN-000002', 'Laptop Accessory Kit', 'Electronics', 'Tech House', 95.00, 4.30),
  ('EAN-000003', 'Running Shoes', 'Fashion', 'Sport Hub', 140.00, 4.10),
  ('EAN-000004', 'Book Combo Set', 'Books', 'Read More', 60.00, 4.60),
  ('EAN-000005', 'Home Utility Bundle', 'Home', 'Cozy Living', 85.00, 4.00),
  ('EAN-000006', 'Wireless Earbuds', 'Electronics', 'Sound Pro', 75.00, 4.20)
on conflict (ean) do update
set
  title = excluded.title,
  category = excluded.category,
  vendor = excluded.vendor,
  price = excluded.price,
  rating = excluded.rating;

with seeded_people as (
  select p.id, p.email
  from public.people p
  where p.email in ('admin@demo.com', 'user@demo.com', 'solomon@demo.com')
),
seeded_products as (
  select
    pr.id,
    pr.title,
    pr.price,
    row_number() over (order by pr.ean) as rn
  from public.products pr
),
order_input as (
  select
    sp.id as product_id,
    sp.title as product_title,
    sp.price as product_price,
    sp.rn,
    pe.id as user_id,
    pe.email,
    gs as seq,
    ((gs % 3) + 1) as quantity
  from seeded_people pe
  cross join generate_series(1, 6) gs
  join seeded_products sp
    on sp.rn = (((gs - 1) % 6) + 1)
)
insert into public.orders (
  user_id,
  product_id,
  subtotal,
  tax,
  discount,
  quantity,
  created_at
)
select
  oi.user_id,
  oi.product_id,
  round((oi.product_price * oi.quantity)::numeric, 2) as subtotal,
  round((oi.product_price * oi.quantity * 0.10)::numeric, 2) as tax,
  case when oi.seq % 2 = 0 then 5 else 0 end as discount,
  oi.quantity,
  timezone('utc'::text, now()) - ((7 - oi.seq) || ' days')::interval
from order_input oi
on conflict do nothing;

insert into public.reviews (product_id, reviewer, rating, body, created_at)
select
  p.id,
  'admin@demo.com',
  5,
  'Stable quality and good value.',
  timezone('utc'::text, now()) - interval '3 days'
from public.products p
where not exists (
  select 1
  from public.reviews r
  where r.product_id = p.id
    and r.reviewer = 'admin@demo.com'
);

insert into public.reviews (product_id, reviewer, rating, body, created_at)
select
  p.id,
  'user@demo.com',
  4,
  'Overall good, delivery was fast.',
  timezone('utc'::text, now()) - interval '2 days'
from public.products p
where not exists (
  select 1
  from public.reviews r
  where r.product_id = p.id
    and r.reviewer = 'user@demo.com'
);
