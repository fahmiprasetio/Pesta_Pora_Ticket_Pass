# Pestapora 2026 — Ticket Drop

A high-demand ticket drop for Pestapora 2026. A limited batch of tickets goes on
sale at a single moment to thousands of fans at once. The platform is built to
stay fast under heavy traffic and to never oversell.

Live: https://pesta-pora.vercel.app

## Highlights

- Limited-stock flash drop with a virtual waiting room
- No-oversell checkout backed by atomic, row-locked stock updates
- Live remaining-stock updates with no page refresh
- Instant QR e-tickets with public gate verification
- Online payments via Midtrans Snap
- Accounts, ticket history, and wishlist
- Admin dashboard with live stats

## Tech stack

- Next.js (App Router), React, TypeScript
- Tailwind CSS
- Supabase (Postgres, Auth, Realtime, RPC functions)
- Midtrans Snap for payments

## How overselling is prevented

Stock is never decremented in application code. Instead it is reduced inside a
single atomic, row-locked statement in Postgres:

```sql
UPDATE products
   SET remaining_stock = remaining_stock - 1
 WHERE id = :id AND remaining_stock > 0
RETURNING remaining_stock;
```

Postgres serializes concurrent updates on the same row, so thousands of
simultaneous requests can never push stock below zero. A unique index on
`(product_id, buyer_token)` keeps repeated clicks and retries idempotent, so a
buyer ends up with exactly one order.

## Payment flow

1. Checkout reserves a stock slot atomically and creates a pending order.
2. The server opens a Midtrans Snap transaction and returns a token.
3. The browser completes payment through the Snap popup.
4. A webhook (with verified signature) confirms paid orders, or releases the
   slot back to stock if a payment fails or expires.

## Getting started

```bash
npm install
```

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

In your Supabase project, run the SQL files in `supabase/migrations` (in order),
then `supabase/seed.sql`. Start the app:

```bash
npm run dev
```

Open http://localhost:3000.

## Environment variables

Supabase and Midtrans credentials are read from `.env.local`. See
`.env.example` for the full list.

## Deployment

Deploy on Vercel and add the same environment variables in the project settings.
When payments are enabled, set the Midtrans payment notification URL to:

```
https://your-app.vercel.app/api/payment/webhook
```

## Containers

A `Dockerfile`, `docker-compose.yml`, and Kubernetes manifests under `k8s/` are
included for container-based deployment with horizontal autoscaling.

## Scripts

- `npm run dev` — start the development server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — lint the codebase
