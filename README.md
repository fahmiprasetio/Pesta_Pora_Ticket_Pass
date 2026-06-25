# LONJAK

Flash sale / ticket drop untuk tiket konser dan event. Satu produk langka
(100 tiket) yang diserbu ribuan pembeli bersamaan. Yang dijual secara teknis
adalah **ketahanan terhadap lonjakan trafik** dan **anti-overselling**.

Proyek tugas Cloud Computing. Komponen cloud ditonjolkan lewat backend Supabase
(Postgres + RPC + Auth + Realtime) dan deploy serverless di Vercel.

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Supabase (Postgres + fungsi RPC + Supabase Auth + Realtime)
- Midtrans Snap (pembayaran, mode sandbox) lewat REST API
- k6 untuk load testing (tool terpisah, bukan paket npm)

## Inti teknis: anti-overselling

Pengurangan stok dilakukan lewat satu pernyataan atomik ber-row-lock di Postgres:

```sql
UPDATE products
   SET remaining_stock = remaining_stock - 1
 WHERE id = :id AND remaining_stock > 0
RETURNING remaining_stock;
```

Karena Postgres mengunci baris saat update, ribuan request konkuren diserialisasi
dan stok tidak akan pernah terjual melebihi yang ada (100 tidak bisa jadi 105).
`buyer_token` plus unique index `(product_id, buyer_token)` menjamin idempotensi.

Ada dua jalur transaksi yang memakai logika atomik yang sama:

- **Simulasi** (`purchase_ticket`): langsung `confirmed`. Dipakai mode simulasi
  dan load test (tidak mungkin load test pakai pembayaran asli).
- **Midtrans** (`reserve_ticket`): kunci slot jadi `pending`, bayar lewat Snap,
  lalu webhook men-`confirmed` (atau `release_order` mengembalikan stok bila
  gagal/expire).

## Stok realtime

Beranda berlangganan perubahan baris `products` lewat Supabase Realtime, jadi
sisa stok turun otomatis tanpa refresh saat drop atau load test berjalan
(indikator "Stok live" muncul saat langganan aktif). Diaktifkan lewat migrasi
`0006_realtime_products.sql` yang mendaftarkan tabel ke publication realtime.

## Pembayaran (Midtrans Snap)

Pola yang dipakai aman untuk flash sale:

1. Checkout memanggil `/api/payment/create` -> `reserve_ticket` mengunci slot
   stok (atomik) dan order jadi `pending`.
2. Server membuat transaksi Snap via REST API Midtrans dan mengembalikan token.
3. Browser membuka popup Snap (`window.snap.pay`). User bayar di sandbox.
4. `/api/payment/webhook` menerima notifikasi Midtrans (signature diverifikasi
   sha512), lalu `confirm_paid_order` (lunas) atau `release_order` (gagal/expire).

Ganti mode lewat env `NEXT_PUBLIC_PAYMENT_MODE`:

- `simulasi` (default): tombol checkout langsung confirm. Wajib untuk load test.
- `midtrans`: checkout membuka Snap. Butuh server key + client key sandbox.

Catatan: webhook butuh URL publik (HTTPS), jadi pengujian end-to-end pembayaran
paling mudah dilakukan setelah deploy ke Vercel. Daftarkan URL
`https://APP-ANDA.vercel.app/api/payment/webhook` di Dashboard Midtrans
(Settings -> Configuration -> Payment Notification URL).

## Fitur

- **Flash sale**: beranda, ruang tunggu virtual, checkout, hasil.
- **Stok realtime**: sisa stok di beranda turun otomatis lewat Supabase Realtime.
- **Pembayaran Midtrans Snap** (sandbox) dengan reserve-pay-confirm + webhook.
- **Autentikasi** (Supabase Auth): daftar, masuk, keluar.
- **Wishlist**: untuk user login, ditampilkan di profil.
- **Riwayat tiket (Tiket Saya)**: order sukses tercatat ke akun (RLS milik sendiri).
- **E-tiket** (`/ticket/[id]`): barcode + data pemegang + order id.
- **Lineup**: daftar penampil bergaya poster festival.
- **Panel admin demo** (`/admin`): reset stok + hapus order lewat RPC `reset_demo()`.

## Alur halaman

1. **Beranda** (`/`): hero poster, sisa stok live, countdown, Beli + Wishlist.
2. **Lineup** (`/lineup`): daftar penampil, jadwal panggung.
3. **Ruang Tunggu** (`/waiting`): virtual waiting room.
4. **Checkout** (`/checkout`): ringkasan order, bayar (Midtrans atau simulasi).
5. **Hasil** (`/result`): Berhasil (+ Lihat E-Tiket) atau Sold Out.
6. **E-Tiket** (`/ticket/[id]`): tiket + barcode.
7. **Daftar / Masuk** (`/signup`, `/signin`).
8. **Profil** (`/profile`): akun, Tiket Saya, wishlist.
9. **Admin** (`/admin`): reset stok demo (butuh token).

## Setup lokal

### 1. Install dependency

```bash
npm install
```

### 2. Buat project Supabase dan jalankan SQL

Di Supabase SQL Editor, jalankan berurutan:

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_auth_wishlist.sql`
3. `supabase/migrations/0003_orders_user.sql`
4. `supabase/migrations/0004_reset_demo.sql`
5. `supabase/migrations/0005_payment_midtrans.sql`
6. `supabase/migrations/0006_realtime_products.sql`
7. `supabase/seed.sql`

> Untuk demo lebih mulus, matikan konfirmasi email di Supabase:
> Authentication -> Sign In / Providers -> Email -> nonaktifkan "Confirm email".

### 3. Isi environment

Salin `.env.example` menjadi `.env.local` lalu isi nilainya (Supabase, admin
token, dan Midtrans bila ingin mengaktifkan pembayaran).

### 4. Jalankan

```bash
npm run dev
```

Buka http://localhost:3000

## Load testing (bukti elasticity)

Pastikan `NEXT_PUBLIC_PAYMENT_MODE=simulasi`, lalu:

```bash
k6 run -e BASE_URL=https://APP-ANDA.vercel.app loadtest/k6-flashsale.js
```

Yang dibuktikan:

- `tickets_confirmed` berhenti tepat di jumlah stok (100).
- Sisa request menghasilkan `tickets_sold_out`.
- Di Supabase, `remaining_stock` akhir = 0 dan tidak pernah minus.
- Buka beranda di tab lain: sisa stok turun live tanpa refresh saat test jalan.

Reset demo: buka `/admin`, masukkan `ADMIN_RESET_TOKEN`, klik reset.

## Deploy ke Vercel

1. Import repo ke Vercel.
2. Tambahkan semua environment variable seperti `.env.local`.
3. Deploy. Daftarkan Payment Notification URL di Midtrans bila pakai pembayaran.

## Pemetaan karakteristik NIST (untuk narasi video)

| Karakteristik NIST | Wujud di Lonjak |
| --- | --- |
| On-demand self-service | Provisioning Supabase dan deploy Vercel mandiri tanpa interaksi manual penyedia. |
| Broad network access | Web app diakses dari banyak device lewat HTTPS. |
| Resource pooling | Postgres dan fungsi serverless berbagi resource multi-tenant terkelola. |
| Rapid elasticity | Fungsi serverless Vercel menskala otomatis saat lonjakan, lalu mengecil. |
| Measured service | Metrik k6 dan dashboard penyedia mengukur konsumsi. |

Konsep dosen lain yang relevan: load balancing dan high availability ditangani
oleh edge network Vercel dan infrastruktur terkelola Supabase.
