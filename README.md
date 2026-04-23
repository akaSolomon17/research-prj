# Order Management Admin Dashboard

Dashboard quản lý đơn hàng với 4 màn hình chính:
- Login
- Home Dashboard (thống kê + chart)
- Orders Management (list/filter/create/update/delete)
- Profile (chỉnh sửa hồ sơ + tổng quan đơn)

## 1. Tech Stack

- Frontend: React 19 + TypeScript + Vite + TailwindCSS
- Backend: Node.js + Express + TypeScript
- Database/Auth: Supabase (Postgres + Auth + RLS)
- Package manager: PNPM workspace
- Testing: Vitest + Testing Library, Cypress

## 2. Cấu Trúc Repo

```text
research-prj/
|- frontend/                # UI app (feature-based)
|- backend/                 # REST API
|- supabase/
|  |- schema.sql            # schema + RLS policies + trigger/function
|  |- seed.sql              # seed demo data theo Auth users
|- CODEBASE_BASIC_REPORT.md # báo cáo tổng quan codebase
|- README.md
```

## 3. Prerequisites

- Node.js >= 20
- PNPM >= 9

```bash
npm install -g pnpm
```

## 4. Cài Đặt

```bash
pnpm install
```

## 5. Chạy Nhanh (Demo Mode, không cần Supabase thật)

Mục tiêu: clone xong chạy UI ngay để xem flow.

1. Tạo file `frontend/.env`:

```env
VITE_SUPABASE_URL=https://demo-project.supabase.co
VITE_SUPABASE_ANON_KEY=demo_anon_key
VITE_API_BASE_URL=http://localhost:8787
VITE_E2E_FAKE_AUTH=true
```

2. Chạy frontend:

```bash
pnpm dev:frontend
```

3. Mở `http://localhost:5173`, đăng nhập:
- Email: `admin@demo.com`
- Password: bất kỳ >= 6 ký tự, ví dụ `secret123`

Lưu ý:
- Ở Demo Mode, frontend dùng mock API nội bộ, không gọi backend thật.
- Backend không bắt buộc chạy trong mode này.

## 6. Chạy Với Supabase Thật (Khuyến nghị cho review đầy đủ)

### 6.1 Tạo project và apply schema

1. Tạo project trên Supabase.
2. Vào `SQL Editor`, chạy toàn bộ file `supabase/schema.sql`.

### 6.2 Tạo Auth users trước khi seed

Vào `Authentication > Users`, tạo các tài khoản:
- `admin@demo.com` (role admin sẽ được gán qua `seed.sql`)
- `user@demo.com`
- `solomon@demo.com` (optional)

Mỗi tài khoản cần đặt password (ví dụ `solomon123`, `secret123`).

### 6.3 Seed dữ liệu

Trong `SQL Editor`, chạy file `supabase/seed.sql`.

Seed sẽ tạo/cập nhật dữ liệu ở:
- `profiles`
- `people`
- `products`
- `orders`
- `reviews`

### 6.4 Cấu hình biến môi trường

Tạo `frontend/.env`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:8787
VITE_E2E_FAKE_AUTH=false
```

Tạo `backend/.env`:

```env
PORT=8787
CORS_ORIGIN=http://localhost:5173
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 6.5 Chạy app

Terminal 1:

```bash
pnpm dev:backend
```

Terminal 2:

```bash
pnpm dev:frontend
```

Kiểm tra:
- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:8787/health`

## 7. API Chính

Tất cả API business đi qua `/api/v1/*` và yêu cầu `Authorization: Bearer <access_token>`.

- `GET /api/v1/auth/me`
- `GET /api/v1/stats/overview`
- `GET /api/v1/orders`
- `POST /api/v1/orders`
- `PATCH /api/v1/orders/:id`
- `DELETE /api/v1/orders/:id`
- `GET /api/v1/profile`
- `PATCH /api/v1/profile`

## 8. Scripts Hay Dùng

```bash
pnpm dev:frontend
pnpm dev:backend
pnpm test:frontend
pnpm test:backend
pnpm build:frontend
pnpm build:backend
```

## 9. Test

Unit/Integration:

```bash
pnpm test:frontend
pnpm test:backend
```

Cypress E2E:

```bash
pnpm --dir frontend cypress:run
```

Nếu thiếu Cypress binary:

```bash
pnpm --dir frontend exec cypress install
```

Khuyến nghị chạy Cypress với `VITE_E2E_FAKE_AUTH=true` để tránh phụ thuộc Supabase login thật.

## 10. Troubleshooting

1. Lỗi `Profile not found for this account`:
- Tài khoản có trong `auth.users` nhưng chưa có dòng trong `profiles`.
- Chạy lại `supabase/seed.sql`.

2. Lỗi login thất bại:
- Kiểm tra đúng `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
- Kiểm tra user đã tạo trong Supabase Auth.
- Password tối thiểu 6 ký tự.

3. Lỗi `401 Missing access token` từ backend:
- Frontend chưa đăng nhập thành công hoặc token hết hạn.
- Đăng xuất và đăng nhập lại.

4. Lỗi CORS:
- `backend/.env` phải có `CORS_ORIGIN=http://localhost:5173` (hoặc đúng origin frontend hiện tại).

5. Sai schema/table:
- Bắt buộc chạy `supabase/schema.sql` trước `supabase/seed.sql`.

## 11. Tài Liệu Bổ Sung

- Báo cáo codebase: `CODEBASE_BASIC_REPORT.md`
