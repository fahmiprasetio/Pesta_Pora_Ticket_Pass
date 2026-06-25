-- Lonjak: aktifkan Supabase Realtime untuk stok produk
-- Beranda berlangganan perubahan baris products supaya sisa stok turun
-- otomatis tanpa refresh saat drop / load test berjalan.

-- replica identity full agar payload perubahan lengkap (termasuk nilai lama).
alter table public.products replica identity full;

-- Tambahkan tabel ke publication realtime bawaan Supabase.
-- Robust: abaikan bila sudah terdaftar, buat publication bila belum ada.
do $$
begin
  begin
    alter publication supabase_realtime add table public.products;
  exception
    when duplicate_object then null;
    when undefined_object then
      create publication supabase_realtime for table public.products;
  end;
end $$;
