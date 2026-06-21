# Lonjak - Flash Sale / Ticket Drop App

Aplikasi web flash sale / ticket drop terukur dan berkinerja tinggi yang dibangun untuk tugas Cloud Computing. Proyek ini mendemonstrasikan karakteristik cloud utama:
- **Rapid Elasticity**: Pengelolaan lonjakan lalu lintas pengguna secara elastis.
- **Concurrency Control (Anti-Overselling)**: Kontrol konkurensi tingkat tinggi dengan PostgreSQL atomic transaksi untuk mencegah penjualan tiket melebihi stok.
- **Measured Service**: Layanan yang terukur untuk mencatat performa dan kuota.

## Stack Teknologi
- **Frontend/Backend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Database/Backend Service**: Supabase (Postgres)
- **Load Testing**: k6

## Struktur Folder

```text
app/
  layout.tsx                -> Root layout & globals.css import
  page.tsx                  -> Beranda: kartu produk + sisa stok + tombol "Beli Sekarang"
  globals.css               -> Styling global (Tailwind)
  waiting/page.tsx          -> Ruang tunggu virtual (antrean menurun)
  checkout/page.tsx         -> Halaman checkout + simulasi konfirmasi pembayaran
  result/page.tsx           -> Hasil transaksi: Berhasil / Sold out
  api/product/route.ts      -> GET info produk + sisa stok dari Supabase
  api/purchase/route.ts     -> POST proses beli, panggil RPC atomik purchase_ticket
components/
  ProductCard.tsx           -> Komponen kartu produk
  QueueStatus.tsx           -> Komponen status antrian
  StockBadge.tsx            -> Badge sisa stok
lib/
  supabaseClient.ts         -> Supabase client browser (anon key)
  supabaseServer.ts         -> Supabase client server (service role key)
  types.ts                  -> Tipe TypeScript (Product, Order, PurchaseResult)
supabase/
  migrations/0001_init.sql  -> Tabel products, orders + fungsi atomik purchase_ticket
  seed.sql                  -> Insert 1 produk contoh (stok 100)
loadtest/
  k6-flashsale.js           -> Skrip k6 untuk simulasi ribuan pembeli bersamaan
```
