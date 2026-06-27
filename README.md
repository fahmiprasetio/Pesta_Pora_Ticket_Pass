# Lonjak

High-concurrency concert ticket flash sale platform built to handle thousands of simultaneous buyers without overselling.

## Stack

- **Next.js 16** — App Router, Server Components, API Routes
- **Supabase** — Managed Postgres, Auth, Realtime subscriptions
- **Midtrans** — Payment gateway integration
- **Tailwind CSS v4** — Utility-first styling

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Environment Variables

See `.env.example` for the full reference.

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — server-side only |
| `MIDTRANS_SERVER_KEY` | Midtrans server key |
| `NEXT_PUBLIC_PAYMENT_MODE` | `midtrans` or `simulasi` |
| `ADMIN_RESET_TOKEN` | Bearer token for the demo reset endpoint |
