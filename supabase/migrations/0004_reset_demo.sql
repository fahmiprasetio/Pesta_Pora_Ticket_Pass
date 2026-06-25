-- Lonjak: reset demo flash sale
-- Mengembalikan stok semua produk ke total_stock dan membersihkan order,
-- supaya drop bisa diulang saat merekam video demo tanpa edit manual.
-- Hanya service_role yang boleh mengeksekusi (dipanggil dari route server
-- yang dilindungi token admin).

create or replace function public.reset_demo()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_total integer;
begin
  delete from public.orders;
  update public.products set remaining_stock = total_stock;
  select coalesce(sum(total_stock), 0) into v_total from public.products;
  return jsonb_build_object(
    'success', true,
    'remaining_stock', v_total,
    'message', 'Stok direset ke penuh dan seluruh order dibersihkan.'
  );
end;
$$;

revoke all on function public.reset_demo() from public, anon, authenticated;
grant execute on function public.reset_demo() to service_role;
