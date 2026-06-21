-- Satu produk langka: 100 tiket.
insert into public.products (
  id, name, artist, venue, event_date, tier, price, total_stock, remaining_stock, image_url
)
values (
  '00000000-0000-0000-0000-000000000001',
  'GELORA NUSANTARA FEST 2026',
  'Various Artists',
  'Stadion Utama GBK, Jakarta',
  '2026-09-12T19:00:00+07:00',
  'FESTIVAL GA / DAY 1',
  750000,
  100,
  100,
  null
)
on conflict (id) do update set
  total_stock     = excluded.total_stock,
  remaining_stock = excluded.remaining_stock,
  price           = excluded.price;

-- Untuk mereset stok saat demo ulang, jalankan lagi seed ini
-- (remaining_stock akan kembali ke 100) lalu: delete from public.orders;
