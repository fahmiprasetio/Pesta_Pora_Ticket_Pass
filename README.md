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

## Ketahanan terhadap lonjakan (hardening)

Web yang "asal jadi" biasanya tumbang saat ramai karena tiga hal: race condition
(baca-cek-tulis di kode aplikasi), koneksi database habis, dan state disimpan di
memori server. Lonjak menghindari ketiganya:

- **Anti-overselling di database, bukan di JavaScript.** Pengurangan stok adalah
  satu UPDATE atomik ber-row-lock (lihat `purchase_ticket`/`reserve_ticket`).
  Postgres menserialkan ribuan request pada baris stok yang sama, jadi 100 tidak
  pernah bisa jadi 101.
- **Idempotensi.** Unique index `(product_id, buyer_token)` membuat klik/retry
  berulang tetap menghasilkan satu order, bukan order ganda.
- **Tanpa koneksi Postgres langsung.** Akses DB lewat Supabase REST (PostgREST)
  via HTTPS, jadi fungsi serverless tidak membuka koneksi Postgres per request
  dan tidak menghabiskan pool koneksi saat lonjakan. PostgREST yang mengelola
  pool di sisi Supabase. (Bila suatu saat memakai koneksi langsung seperti
  Prisma/`pg`, wajib pakai pooler Supabase: host `...pooler.supabase.com`,
  port `6543`, transaction mode.)
- **Stateless.** Semua kebenaran ada di Postgres, tidak ada counter di memori
  instance, jadi aman saat Vercel menskala ke banyak instance.
- **Index pada kolom panas.** Migrasi `0007_performance_indexes.sql` menambah
  index pada `orders(status)`, `orders(created_at)`, dan
  `orders(user_id, created_at)` agar statistik admin dan riwayat tiket tetap
  cepat saat tabel membesar.
- **Read path ringan.** Sisa stok di-push lewat Realtime, bukan di-polling, jadi
  ribuan penonton tidak menghantam DB hanya untuk melihat angka stok.

Sebelum demo: pastikan `NEXT_PUBLIC_PAYMENT_MODE=simulasi` untuk load test dan
jalankan migrasi `0007` agar index aktif.

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
- **E-tiket** (`/ticket/[id]`): QR verifikasi + barcode + data pemegang, bisa diunduh/cetak ke PDF.
- **Verifikasi gerbang** (`/verify/[id]`): halaman publik untuk petugas men-scan QR e-tiket. Menampilkan VALID/INVALID + data event tanpa membocorkan identitas pembeli.
- **Lineup**: daftar penampil bergaya poster festival.
- **Dashboard admin** (`/admin`): statistik live (sisa stok, terjual, order, pembayaran) + reset stok lewat RPC `reset_demo()`.

## Alur halaman

1. **Beranda** (`/`): hero poster, sisa stok live, countdown, Beli + Wishlist.
2. **Lineup** (`/lineup`): daftar penampil, jadwal panggung.
3. **Ruang Tunggu** (`/waiting`): virtual waiting room.
4. **Checkout** (`/checkout`): ringkasan order, bayar (Midtrans atau simulasi).
5. **Hasil** (`/result`): Berhasil (+ Lihat E-Tiket) atau Sold Out.
6. **E-Tiket** (`/ticket/[id]`): tiket + QR verifikasi + barcode, tombol unduh/cetak PDF.
7. **Verifikasi** (`/verify/[id]`): halaman publik untuk petugas men-scan QR di gerbang.
8. **Daftar / Masuk** (`/signup`, `/signin`).
9. **Profil** (`/profile`): akun, Tiket Saya, wishlist.
10. **Admin** (`/admin`): dashboard statistik live + reset stok demo (butuh token).

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
7. `supabase/migrations/0007_performance_indexes.sql`
8. `supabase/seed.sql`

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

Pastikan `NEXT_PUBLIC_PAYMENT_MODE=simulasi`, lalu (sesuaikan STOCK dengan stok
seed, default 100):

```bash
k6 run -e BASE_URL=https://APP-ANDA.vercel.app -e STOCK=100 loadtest/k6-flashsale.js
```

Di akhir test, skrip mencetak ringkasan vonis (LULUS/GAGAL overselling) berisi
jumlah tiket confirmed, sold_out, duplikat, error, gagal HTTP, dan p95 latency,
lalu menyimpannya ke `loadtest/summary.json` sebagai bukti untuk video.

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
