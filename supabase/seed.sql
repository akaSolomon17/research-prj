-- Prerequisite:
-- 1) Create Auth users in Supabase Dashboard first:
--    - admin@demo.com
--    - user@demo.com
--    - solomon@demo.com (optional)
-- 2) Then run this seed script.

insert into public.profiles (id, full_name, phone, role)
select
  u.id,
  case
    when u.email = 'admin@demo.com' then 'Admin Demo'
    when u.email = 'solomon@demo.com' then 'Solomon Demo'
    else 'User Demo'
  end as full_name,
  '+8400000000',
  case
    when u.email = 'admin@demo.com' then 'admin'
    else 'user'
  end as role
from auth.users u
where u.email in ('admin@demo.com', 'user@demo.com', 'solomon@demo.com')
on conflict (id) do update
set
  full_name = excluded.full_name,
  phone = excluded.phone,
  role = excluded.role,
  updated_at = timezone('utc'::text, now());

insert into public.people (
  id,
  address,
  email,
  name,
  city,
  longitude,
  state,
  source,
  birth_date,
  zip,
  latitude
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
    when u.email = 'admin@demo.com' then 'Admin Demo'
    when u.email = 'solomon@demo.com' then 'Solomon Demo'
    else 'User Demo'
  end as name,
  'Ho Chi Minh City',
  106.700000,
  'HCM',
  'supabase-auth',
  date '1995-01-01',
  '700000',
  10.770000
from auth.users u
where u.email in ('admin@demo.com', 'user@demo.com', 'solomon@demo.com')
on conflict (id) do update
set
  address = excluded.address,
  email = excluded.email,
  name = excluded.name,
  city = excluded.city,
  longitude = excluded.longitude,
  state = excluded.state,
  source = excluded.source,
  birth_date = excluded.birth_date,
  zip = excluded.zip,
  latitude = excluded.latitude;

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

with seeded_users as (
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
    su.id as user_id,
    su.email,
    gs as seq,
    sp.id as product_id,
    sp.title as product_title,
    sp.price as product_price,
    ((gs % 3) + 1) as quantity
  from seeded_users su
  cross join generate_series(1, 6) gs
  join seeded_products sp
    on sp.rn = (((gs - 1) % 6) + 1)
)
insert into public.orders (
  user_id,
  product_id,
  code,
  title,
  subtotal,
  tax,
  total,
  discount,
  quantity,
  amount,
  status,
  created_at,
  updated_at
)
select
  oi.user_id,
  oi.product_id,
  'ORD-' || substr(md5(oi.email || '-' || oi.seq::text), 1, 8),
  oi.product_title,
  round((oi.product_price * oi.quantity)::numeric, 2) as subtotal,
  round((oi.product_price * oi.quantity * 0.10)::numeric, 2) as tax,
  round(
    (
      oi.product_price * oi.quantity
      + oi.product_price * oi.quantity * 0.10
      - case when oi.seq % 2 = 0 then 5 else 0 end
    )::numeric,
    2
  ) as total,
  case when oi.seq % 2 = 0 then 5 else 0 end as discount,
  oi.quantity,
  round(
    (
      oi.product_price * oi.quantity
      + oi.product_price * oi.quantity * 0.10
      - case when oi.seq % 2 = 0 then 5 else 0 end
    )::numeric,
    2
  ) as amount,
  case
    when oi.seq % 3 = 0 then 'completed'
    when oi.seq % 3 = 1 then 'pending'
    else 'cancelled'
  end as status,
  timezone('utc'::text, now()) - ((7 - oi.seq) || ' days')::interval,
  timezone('utc'::text, now()) - ((7 - oi.seq) || ' days')::interval
from order_input oi
on conflict (code) do update
set
  user_id = excluded.user_id,
  product_id = excluded.product_id,
  title = excluded.title,
  subtotal = excluded.subtotal,
  tax = excluded.tax,
  total = excluded.total,
  discount = excluded.discount,
  quantity = excluded.quantity,
  amount = excluded.amount,
  status = excluded.status,
  updated_at = timezone('utc'::text, now());

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
