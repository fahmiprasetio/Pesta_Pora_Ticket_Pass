-- Lonjak: hubungkan order ke akun user + riwayat tiket
-- Menambah kolom user_id pada orders, memperbarui RPC purchase_ticket agar
-- mencatat user pemilik (opsional/aman untuk anon & load test), dan membuka
-- akses baca order milik sendiri lewat RLS.

-- =========================================================
-- KOLOM USER_ID
-- =========================================================
alter table public.orders
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists orders_user_idx on public.orders(user_id);

-- =========================================================
-- RPC purchase_ticket (versi ber-user_id)
-- =========================================================
-- Hapus signature lama (2 argumen) agar tidak ambigu dengan versi baru.
drop function if exists public.purchase_ticket(uuid, text);

create or replace function public.purchase_ticket(
  p_product_id uuid,
  p_buyer_token text,
  p_user_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_remaining integer;
  v_order_id  uuid;
begin
  -- Langkah 1: klaim slot pembeli secara idempoten.
  insert into public.orders (product_id, buyer_token, status, user_id)
  values (p_product_id, p_buyer_token, 'pending', p_user_id)
  on conflict (product_id, buyer_token) do nothing
  returning id into v_order_id;

  if v_order_id is null then
    -- Token sudah pernah dipakai: kembalikan order yang ada (retry idempoten).
    select id into v_order_id
      from public.orders
      where product_id = p_product_id and buyer_token = p_buyer_token;
    -- Lengkapi user_id bila order lama belum terisi (mis. retry setelah login).
    update public.orders
       set user_id = coalesce(user_id, p_user_id)
     where id = v_order_id;
    select remaining_stock into v_remaining
      from public.products where id = p_product_id;
    return jsonb_build_object(
      'success', true,
      'status', 'confirmed',
      'already_purchased', true,
      'order_id', v_order_id,
      'remaining_stock', coalesce(v_remaining, 0),
      'message', 'Tiket sudah diamankan sebelumnya dengan token ini.'
    );
  end if;

  -- Langkah 2: pengurangan stok atomik dengan row lock.
  update public.products
     set remaining_stock = remaining_stock - 1
   where id = p_product_id
     and remaining_stock > 0
  returning remaining_stock into v_remaining;

  if v_remaining is null then
    -- Stok habis (atau produk tidak ada): lepas slot yang tadi diklaim.
    delete from public.orders where id = v_order_id;
    select remaining_stock into v_remaining
      from public.products where id = p_product_id;
    return jsonb_build_object(
      'success', false,
      'status', 'sold_out',
      'order_id', null,
      'remaining_stock', coalesce(v_remaining, 0),
      'message', 'Tiket habis terjual.'
    );
  end if;

  update public.orders set status = 'confirmed' where id = v_order_id;

  return jsonb_build_object(
    'success', true,
    'status', 'confirmed',
    'order_id', v_order_id,
    'remaining_stock', v_remaining,
    'message', 'Tiket berhasil diamankan.'
  );
end;
$$;

grant execute on function public.purchase_ticket(uuid, text, uuid)
  to anon, authenticated, service_role;

-- =========================================================
-- RLS: user boleh membaca order miliknya sendiri (riwayat tiket)
-- =========================================================
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own"
  on public.orders for select
  using (auth.uid() = user_id);

grant select on public.orders to authenticated;
