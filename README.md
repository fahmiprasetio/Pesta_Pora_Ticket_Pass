# LONJAK

Flash sale / ticket drop untuk tiket konser dan event. Satu produk langka
(100 tiket) yang diserbu ribuan pembeli bersamaan. Yang dijual secara teknis
adalah **ketahanan terhadap lonjakan trafik** dan **anti-overselling**.

Proyek tugas Cloud Computing. Komponen cloud ditonjolkan lewat backend Supabase
(Postgres + RPC + Auth) dan deploy serverless di Vercel.

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Supabase (Postgres + fungsi RPC `purchase_ticket` + Supabase Auth)
- k6 untuk load testing (tool terpisah, bukan paket npm)

## Inti teknis: anti-overselling

Pengurangan stok dilakukan lewat satu pernyataan atomik ber-row-lock di Postgres,
dibungkus dalam fungsi RPC `purchase_ticket(p_product_id, p_buyer_token)`:

```sql
UPDATE products
   SET remaining_stock = remaining_stock - 1
 WHERE id = :id AND remaining_stock > 0
RETURNING remaining_stock;
```

Karena Postgres mengunci baris saat update, ribuan request konkuren diserialisasi
dan stok tidak akan pernah terjual melebihi yang ada (100 tidak bisa jadi 105).
`buyer_token` plus unique index `(product_id, buyer_token)` menjamin idempotensi.

## Fitur

- **Flash sale**: beranda, ruang tunggu virtual, checkout (simulasi bayar), hasil.
- **Autentikasi** (Supabase Auth): daftar, masuk, keluar.
- **Wishlist**: tersedia hanya untuk user yang sudah login, ditampilkan di halaman profil.

## Alur halaman

1. **Beranda** (`/`): hero poster event, sisa stok live, countdown, tombol Beli + Wishlist.
2. **Ruang Tunggu** (`/waiting`): virtual waiting room, posisi antrean menurun.
3. **Checkout** (`/checkout`): ringkasan order, tombol Konfirmasi Pembayaran (Simulasi).
4. **Hasil** (`/result`): Berhasil (order id + sisa stok) atau Sold Out.
5. **Daftar / Masuk** (`/signup`, `/signin`): autentikasi email + password.
6. **Profil** (`/profile`): data akun, tombol keluar, dan daftar wishlist.

Pembayaran hanya disimulasikan. Tidak ada integrasi payment gateway.

## Setup lokal

### 1. Install dependency

```bash
npm install
```

### 2. Buat project Supabase dan jalankan SQL

Di Supabase SQL Editor, jalankan berurutan (paste isi file, lalu Run):

1. `supabase/migrations/0001_init.sql` (tabel products/orders + fungsi RPC + RLS)
2. `supabase/migrations/0002_auth_wishlist.sql` (tabel profiles + wishlists + trigger profil + RLS)
3. `supabase/seed.sql` (1 produk, stok 100)

> Untuk demo lebih mulus, matikan konfirmasi email di Supabase:
> Authentication -> Sign In / Providers -> Email -> nonaktifkan "Confirm email".
> Dengan begitu user bisa langsung login setelah daftar.

### 3. Isi environment

Salin `.env.example` menjadi `.env.local` lalu isi:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 4. Jalankan

```bash
npm run dev
```

Buka http://localhost:3000

## Load testing (bukti elasticity)

Install k6 (https://k6.io), lalu:

```bash
k6 run -e BASE_URL=https://APP-ANDA.vercel.app loadtest/k6-flashsale.js
```

Yang dibuktikan:

- `tickets_confirmed` berhenti tepat di jumlah stok (100).
- Sisa request menghasilkan `tickets_sold_out`.
- Di Supabase, `remaining_stock` akhir = 0 dan tidak pernah minus.

Untuk reset demo: jalankan ulang `supabase/seed.sql` lalu `delete from public.orders;`.

## Deploy ke Vercel

1. Import repo ke Vercel.
2. Tambahkan tiga environment variable yang sama seperti `.env.local`.
3. Deploy. Vercel menangani autoscaling serverless (rapid elasticity).

## Pemetaan karakteristik NIST (untuk narasi video)

| Karakteristik NIST | Wujud di Lonjak |
| --- | --- |
| On-demand self-service | Provisioning Supabase dan deploy Vercel mandiri tanpa interaksi manual penyedia. |
| Broad network access | Web app diakses dari banyak device lewat HTTPS. |
| Resource pooling | Postgres dan fungsi serverless berbagi resource multi-tenant terkelola. |
| Rapid elasticity | Fungsi serverless Vercel menskala otomatis saat lonjakan, lalu mengecil. |
| Measured service | Metrik k6 (req/s, response time) dan dashboard penyedia mengukur konsumsi. |

Konsep dosen lain yang relevan: load balancing dan high availability ditangani
oleh edge network Vercel dan infrastruktur terkelola Supabase.
