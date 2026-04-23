# Basic Codebase Report - Order Management Admin Dashboard

## 1) Tong quan
- Monorepo gom 3 phan:
  - `frontend/` (React + TypeScript + Vite + Tailwind)
  - `backend/` (Node.js + Express + TypeScript)
  - `supabase/` (schema + seed SQL)
- Muc tieu he thong: Login, Dashboard, Management (CRUD orders), Profile.

## 2) Frontend Codebase

### 2.1 Cau truc thu muc FE
```text
frontend/src
|-- app
|   |-- layouts
|   |   `-- DashboardLayout.tsx
|   |-- routes
|   |   `-- ProtectedRoute.tsx
|   `-- router.tsx
|-- features
|   |-- Auth
|   |   |-- api.ts
|   |   |-- auth-context.tsx
|   |   |-- utils.ts
|   |   `-- pages/LoginPage.tsx
|   |-- Dashboard
|   |   |-- api.ts
|   |   `-- pages/HomeDashboardPage.tsx
|   |-- Orders
|   |   |-- api.ts
|   |   |-- utils.ts
|   |   `-- pages/OrdersPage.tsx
|   `-- Profile
|       |-- api.ts
|       `-- pages/ProfilePage.tsx
`-- shared
    |-- api
    |   |-- http.ts
    |   `-- mock-server.ts
    |-- supabase
    |   `-- client.ts
    `-- types
        `-- models.ts
```

### 2.2 Phan chia component / module chinh
- `app/router.tsx`: dinh nghia routes `/login`, `/dashboard`, `/orders`, `/profile`.
- `app/routes/ProtectedRoute.tsx`: chan truy cap neu chua co session.
- `app/layouts/DashboardLayout.tsx`: layout + sidebar + logout.
- `features/Auth/auth-context.tsx`: quan ly session, profile, signIn, signOut.
- `shared/api/http.ts`: lop request chung, gan bearer token.
- `shared/supabase/client.ts`: khoi tao Supabase client theo env.

### 2.3 Core FE components (thuc te)
- Login page: `features/Auth/pages/LoginPage.tsx`
- Dashboard chart/stat cards: `features/Dashboard/pages/HomeDashboardPage.tsx`
- Orders CRUD + table + filter/search/pagination: `features/Orders/pages/OrdersPage.tsx`
- Profile edit + summary: `features/Profile/pages/ProfilePage.tsx`

## 3) Backend Codebase

### 3.1 Cau truc thu muc BE
```text
backend/src
|-- app.ts
|-- server.ts
|-- vercel.ts
|-- config
|   `-- env.ts
|-- lib
|   `-- supabase.ts
|-- middleware
|   `-- auth.ts
|-- routes
|   |-- index.ts
|   |-- auth.routes.ts
|   |-- orders.routes.ts
|   |-- profile.routes.ts
|   `-- stats.routes.ts
|-- types
|   |-- database.ts
|   `-- express.d.ts
`-- utils
    |-- http.ts
    `-- overview.ts
```

### 3.2 Phan chia API va middleware
- `app.ts`:
  - `GET /health`
  - mount `/api/v1` qua `requireAuth`
- `middleware/auth.ts`:
  - doc bearer token
  - verify user qua Supabase Auth
  - lay role tu bang `profiles`
  - gan `req.auth`
- `routes`:
  - `GET /api/v1/auth/me`
  - `GET/POST/PATCH/DELETE /api/v1/orders`
  - `GET/PATCH /api/v1/profile`
  - `GET /api/v1/stats/overview`

## 4) DB + Auth + Cloud Setup (no deploy)

### 4.1 Database (Supabase Postgres)
- SQL schema: `supabase/schema.sql`
- Seed demo: `supabase/seed.sql`
- Co bat RLS cho `profiles`, `people`, `products`, `orders`, `reviews`.
- Policies phan quyen theo `auth.uid()` + `is_admin()`.

### 4.2 Authentication
- FE login bang `supabase.auth.signInWithPassword(...)`.
- FE gui `Authorization: Bearer <access_token>` sang BE.
- BE verify token qua Supabase, lay role user tu `profiles`.
- Khong hardcode key auth trong code chay that:
  - FE dung `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
  - BE dung `SUPABASE_URL`, `SUPABASE_ANON_KEY`.

### 4.3 Bien moi truong
- `frontend/.env.example`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_API_BASE_URL`
  - `VITE_E2E_FAKE_AUTH`
- `backend/.env.example`
  - `PORT`
  - `CORS_ORIGIN`
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`

### 4.4 Cloud-ready config
- FE co `frontend/vercel.json` (SPA rewrite).
- BE co `backend/vercel.json` + `src/vercel.ts` (serverless entry).

## 5) Schema bang du lieu hien tai

### 5.1 `profiles`
- `id` (PK, FK -> `auth.users.id`)
- `full_name`
- `phone`
- `avatar_url`
- `role` (`admin` | `user`)
- `created_at`
- `updated_at`

### 5.2 `people`
- `id` (PK)
- `address`
- `email`
- `password` (chi de map ERD, auth that duoc xu ly boi Supabase Auth)
- `name`
- `city`
- `longitude`
- `state`
- `source`
- `birth_date`
- `zip`
- `latitude`
- `created_at`

### 5.3 `products`
- `id` (PK)
- `ean` (unique)
- `title`
- `category`
- `vendor`
- `price`
- `rating`
- `created_at`

### 5.4 `reviews`
- `id` (PK)
- `product_id` (FK -> `products.id`)
- `reviewer`
- `rating`
- `body`
- `created_at`

### 5.5 `orders`
- `id` (PK)
- `user_id` (FK -> `people.id`)
- `product_id` (FK -> `products.id`)
- `subtotal`
- `tax`
- `total`
- `discount`
- `quantity`
- `code` (unique)
- `title`
- `amount`
- `status` (`pending` | `completed` | `cancelled`)
- `created_at`
- `updated_at`

### 5.6 Quan he
- `products (1) -> (n) reviews` qua `reviews.product_id`.
- `people (1) -> (n) orders` qua `orders.user_id`.
- `products (1) -> (n) orders` qua `orders.product_id`.
- `auth.users (1) -> (1) profiles` qua `profiles.id` (de auth/role cho app hien tai).

## 6) Tinh trang chay duoc (da verify)
- Backend health OK: `GET /health` tra `{ "ok": true }`.
- Test BE pass: 2/2.
- Test FE pass: 10/10.
- Cypress login spec pass: 1/1 (`cypress/e2e/login.cy.ts`).

## 7) Ghi chu cho bao cao
- Repo ho tro 2 mode:
  - Quick demo mode: `VITE_E2E_FAKE_AUTH=true` (khong can Supabase that).
  - Real mode: Supabase that + schema/seed + users Auth (`admin@demo.com`, `user@demo.com`).
- Neu nop theo tieu chi "auth khong hardcode", nen nhan manh luong real mode.
