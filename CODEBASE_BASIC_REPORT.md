# Báo Cáo Codebase Cơ Bản - Order Management Admin Dashboard

## 1) Tổng quan
- Monorepo gồm 3 phần:
  - `frontend/` (React + TypeScript + Vite + Tailwind)
  - `backend/` (Node.js + Express + TypeScript)
  - `supabase/` (schema + seed SQL)
- Mục tiêu hệ thống: Login, Dashboard, Management (CRUD orders), Profile.

## 2) Frontend Codebase

### 2.1 Cấu trúc thư mục FE
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

### 2.2 Phân chia component/module chính
- `app/router.tsx`: định nghĩa routes `/login`, `/dashboard`, `/orders`, `/profile`.
- `app/routes/ProtectedRoute.tsx`: chặn truy cập nếu chưa có session.
- `app/layouts/DashboardLayout.tsx`: layout chung + sidebar + logout.
- `features/Auth/auth-context.tsx`: quản lý session, profile, signIn, signOut.
- `shared/api/http.ts`: lớp request chung, gắn bearer token.
- `shared/supabase/client.ts`: khởi tạo Supabase client theo env.

### 2.3 Core FE components (thực tế)
- Login page: `features/Auth/pages/LoginPage.tsx`
- Dashboard chart/stat cards: `features/Dashboard/pages/HomeDashboardPage.tsx`
- Orders CRUD + table + filter/search/pagination: `features/Orders/pages/OrdersPage.tsx`
- Profile edit + summary: `features/Profile/pages/ProfilePage.tsx`

## 3) Backend Codebase

### 3.1 Cấu trúc thư mục BE
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

### 3.2 Phân chia API và middleware
- `app.ts`:
  - `GET /health`
  - mount `/api/v1` qua `requireAuth`
- `middleware/auth.ts`:
  - đọc bearer token
  - verify user qua Supabase Auth
  - lấy role từ bảng `profiles`
  - gán `req.auth`
- `routes`:
  - `GET /api/v1/auth/me`
  - `GET/POST/PATCH/DELETE /api/v1/orders`
  - `GET/PATCH /api/v1/profile`
  - `GET /api/v1/stats/overview`

## 4) DB + Auth + Cloud Setup (chưa deploy)

### 4.1 Database (Supabase Postgres)
- SQL schema: `supabase/schema.sql`
- Seed demo: `supabase/seed.sql`
- Có bật RLS cho `profiles`, `people`, `products`, `orders`, `reviews`.
- Policies phân quyền theo `auth.uid()` + `is_admin()`.

### 4.2 Authentication
- FE login bằng `supabase.auth.signInWithPassword(...)`.
- FE gửi `Authorization: Bearer <access_token>` sang BE.
- BE verify token qua Supabase, lấy role user từ `profiles`.
- Không hardcode key auth trong code chạy thật:
  - FE dùng `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
  - BE dùng `SUPABASE_URL`, `SUPABASE_ANON_KEY`.

### 4.3 Biến môi trường
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
- FE có `frontend/vercel.json` (SPA rewrite).
- BE có `backend/vercel.json` + `src/vercel.ts` (serverless entry).

## 5) Schema bảng dữ liệu hiện tại

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
- `password` (chỉ để map ERD, auth thật được xử lý bởi Supabase Auth)
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

### 5.6 Quan hệ
- `products (1) -> (n) reviews` qua `reviews.product_id`.
- `people (1) -> (n) orders` qua `orders.user_id`.
- `products (1) -> (n) orders` qua `orders.product_id`.
- `auth.users (1) -> (1) profiles` qua `profiles.id` (để auth/role cho app hiện tại).

## 6) Tình trạng chạy được (đã verify)
- Backend health OK: `GET /health` trả `{ "ok": true }`.
- Test BE pass.
- Test FE pass.
- Cypress login spec pass (`cypress/e2e/login.cy.ts`).

## 7) Ghi chú cho báo cáo
- Repo hỗ trợ 2 mode:
  - Quick demo mode: `VITE_E2E_FAKE_AUTH=true` (không cần Supabase thật).
  - Real mode: Supabase thật + schema/seed + users Auth (`admin@demo.com`, `user@demo.com`).
- Nếu nộp theo tiêu chí "auth không hardcode", nên nhấn mạnh luồng real mode.
