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
dibungkus dalam fungsi RPC `purchase_ticket(p_product_id, p_buyer_token, p_user_id)`:

```sql
UPDATE products
   SET remaining_stock = remaining_stock - 1
 WHERE id = :id AND remaining_stock > 0
RETURNING remaining_stock;
```

Karena Postgres mengunci baris saat update, ribuan request konkuren diserialisasi
dan stok tidak akan pernah terjual melebihi yang ada (100 tidak bisa jadi 105).
`buyer_token` plus unique index `(product_id, buyer_token)` menjamin idempotensi.
`p_user_id` bersifat opsional: diisi otomatis (dari token sesi yang diverifikasi
server) saat pembeli login, dan `null` untuk pembelian anonim atau load test.

## Fitur

- **Flash sale**: beranda, ruang tunggu virtual, checkout (simulasi bayar), hasil.
- **Autentikasi** (Supabase Auth): daftar, masuk, keluar.
- **Wishlist**: tersedia hanya untuk user yang sudah login, ditampilkan di halaman profil.
- **Riwayat tiket (Tiket Saya)**: order yang sukses tercatat ke akun lewat `user_id`
  terverifikasi, lalu ditampilkan di profil. Dilindungi RLS (user hanya bisa
  melihat order miliknya sendiri).
- **E-tiket**: setiap order sukses punya halaman tiket sendiri (`/ticket/[id]`)
  lengkap dengan barcode, data pemegang, dan order id. Bisa dibuka dari halaman
  hasil maupun dari profil.
- **Lineup**: halaman daftar penampil bergaya poster festival.
- **Panel admin demo** (`/admin`): reset stok ke penuh dan hapus order untuk
  mengulang drop saat merekam video. Dilindungi token (`ADMIN_RESET_TOKEN`) dan
  dieksekusi lewat RPC `reset_demo()` memakai service role.

## Alur halaman

1. **Beranda** (`/`): hero poster event, sisa stok live, countdown, tombol Beli + Wishlist.
2. **Lineup** (`/lineup`): daftar penampil, jadwal panggung.
3. **Ruang Tunggu** (`/waiting`): virtual waiting room, posisi antrean menurun.
4. **Checkout** (`/checkout`): ringkasan order, tombol Konfirmasi Pembayaran (Simulasi).
5. **Hasil** (`/result`): Berhasil (order id + sisa stok + tombol Lihat E-Tiket) atau Sold Out.
6. **E-Tiket** (`/ticket/[id]`): tampilan tiket + barcode untuk order tertentu.
7. **Daftar / Masuk** (`/signup`, `/signin`): autentikasi email + password.
8. **Profil** (`/profile`): data akun, tombol keluar, riwayat Tiket Saya, dan wishlist.
9. **Admin** (`/admin`): reset stok demo (butuh token).

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
3. `supabase/migrations/0003_orders_user.sql` (kolom user_id pada orders + RPC ber-user_id + RLS riwayat tiket)
4. `supabase/migrations/0004_reset_demo.sql` (fungsi reset_demo untuk panel admin)
5. `supabase/seed.sql` (1 produk, stok 100)

> Untuk demo lebih mulus, matikan konfirmasi email di Supabase:
> Authentication -> Sign In / Providers -> Email -> nonaktifkan "Confirm email".
> Dengan begitu user bisa langsung login setelah daftar.

### 3. Isi environment

Salin `.env.example` menjadi `.env.local` lalu isi:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_RESET_TOKEN=token-rahasia-bebas
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

Untuk reset demo: buka `/admin`, masukkan `ADMIN_RESET_TOKEN`, klik reset. Atau
jalankan ulang `supabase/seed.sql` lalu `delete from public.orders;`.

## Deploy ke Vercel

1. Import repo ke Vercel.
2. Tambahkan environment variable yang sama seperti `.env.local` (termasuk `ADMIN_RESET_TOKEN`).
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
