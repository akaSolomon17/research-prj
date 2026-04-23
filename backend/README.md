# Backend

NodeJS + Express + TypeScript API with Supabase auth/token verification.

## Setup

1. Copy `.env.example` to `.env`.
2. Fill:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `CORS_ORIGIN` (default `http://localhost:5173`)
3. Install dependencies:

```bash
pnpm install
```

4. Run:

```bash
pnpm dev
```

## API Prefix

`/api/v1` (all routes require `Authorization: Bearer <access_token>`)

## Test

```bash
pnpm test
```
