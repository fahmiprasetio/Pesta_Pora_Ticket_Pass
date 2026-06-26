-- Satu produk langka: 100 tiket (PESTAPORA 2026, 3 Day Pass).
insert into public.products (
  id, name, artist, venue, event_date, tier, price, total_stock, remaining_stock, image_url
)
values (
  '00000000-0000-0000-0000-000000000001',
  'PESTAPORA 2026',
  'Various Artists',
  'Gambir Expo & Hall D2, JIExpo Kemayoran, Jakarta',
  '2026-09-25T14:00:00+07:00',
  '3 DAY PASS',
  650000,
  100,
  100,
  null
)
on conflict (id) do update set
  name            = excluded.name,
  artist          = excluded.artist,
  venue           = excluded.venue,
  event_date      = excluded.event_date,
  tier            = excluded.tier,
  price           = excluded.price,
  total_stock     = excluded.total_stock,
  remaining_stock = excluded.remaining_stock;

-- Untuk mereset stok saat demo ulang, jalankan lagi seed ini
-- (remaining_stock akan kembali ke 100) lalu: delete from public.orders;
