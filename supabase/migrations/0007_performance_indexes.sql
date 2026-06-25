-- Lonjak: index performa untuk kolom panas pada tabel orders.
-- Tujuan: menjaga query tetap cepat saat tabel orders membesar selama war tiket.
-- Aman dijalankan berulang (IF NOT EXISTS). Tidak mengubah skema/logika.
--
-- Index yang sudah ada dari migrasi sebelumnya:
--   orders_product_id_idx          (product_id)
--   orders_token_product_uidx      (product_id, buyer_token)  -- unik, idempotensi
--   orders_user_idx                (user_id)
--   orders_payment_ref_idx         (payment_ref)

-- Statistik admin sering menghitung order per status (confirmed/pending).
create index if not exists orders_status_idx
  on public.orders(status);

-- Pengurutan terbaru (riwayat, dashboard) berdasarkan waktu dibuat.
create index if not exists orders_created_at_idx
  on public.orders(created_at desc);

-- Riwayat tiket milik user: filter user_id lalu urutkan terbaru.
-- Komposit ini lebih optimal daripada orders_user_idx untuk query getMyOrders.
create index if not exists orders_user_created_idx
  on public.orders(user_id, created_at desc);

-- Catatan: tabel products hanya diakses lewat primary key (id), jadi tidak
-- memerlukan index tambahan. Pengurangan stok tetap atomik (lihat 0001/0003).
