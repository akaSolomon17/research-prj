# Frontend

React 19 + Vite 6 + TypeScript + Tailwind admin dashboard client.

## Setup

1. Copy `.env.example` to `.env`.
2. Fill:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_BASE_URL` (default backend: `http://localhost:8787`)
3. Install dependencies:

```bash
pnpm install
```

4. Run:

```bash
pnpm dev
```

## Test

```bash
pnpm test
```

## Cypress smoke

For local smoke testing with fake auth:

```bash
VITE_E2E_FAKE_AUTH=true pnpm dev
pnpm cypress:run
```
