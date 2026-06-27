# Lonjak

Platform flash sale tiket konser. Ribuan pembeli bisa berebut tiket secara bersamaan — stok tidak pernah minus.

## Tech Stack

- **Next.js 16** — App Router, Server Components
- **Supabase** — Postgres + Auth + Realtime
- **Midtrans** — Payment gateway
- **Tailwind CSS v4**

## Fitur Utama

- Flash sale dengan anti-overselling atomik (Postgres row lock)
- Realtime countdown stok tanpa refresh
- Antrian virtual saat lonjakan traffic
- Payment flow: reserve → bayar → konfirmasi via webhook
- QR code tiket digital

## Cara Jalankan

```bash
npm install
cp .env.example .env.local  # isi env vars
npm run dev
```

## Environment Variables

Lihat `.env.example` untuk daftar lengkap.

| Variabel | Keterangan |
|----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only) |
| `MIDTRANS_SERVER_KEY` | Server key Midtrans |
| `NEXT_PUBLIC_PAYMENT_MODE` | `midtrans` atau `simulasi` |
| `ADMIN_RESET_TOKEN` | Token untuk endpoint reset demo |
