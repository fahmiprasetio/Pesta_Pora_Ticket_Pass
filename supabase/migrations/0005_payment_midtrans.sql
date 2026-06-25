-- Lonjak: integrasi pembayaran Midtrans Snap
-- Pola flash sale yang benar: stok dikunci dulu (reserve -> pending), lalu
-- dibayar, dan webhook Midtrans yang menentukan confirmed/release.
-- Anti-overselling tetap di Postgres (pengurangan stok atomik saat reserve).

alter table public.orders
  add column if not exists payment_status text not null default 'unpaid';
alter table public.orders
  add column if not exists payment_provider text;
alter table public.orders
  add column if not exists payment_ref text;

create index if not exists orders_payment_ref_idx on public.orders(payment_ref);

-- =========================================================
-- reserve_ticket: kunci slot stok (atomik) tapi biarkan status pending/unpaid
-- =========================================================
create or replace function public.reserve_ticket(
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
  v_status    text;
begin
  insert into public.orders
    (product_id, buyer_token, status, user_id, payment_status, payment_provider)
  values
    (p_product_id, p_buyer_token, 'pending', p_user_id, 'unpaid', 'midtrans')
  on conflict (product_id, buyer_token) do nothing
  returning id into v_order_id;

  if v_order_id is null then
    -- Token sudah dipakai: kembalikan order yang ada (idempoten).
    select id, status into v_order_id, v_status
      from public.orders
      where product_id = p_product_id and buyer_token = p_buyer_token;
    update public.orders
       set user_id = coalesce(user_id, p_user_id)
     where id = v_order_id;
    select remaining_stock into v_remaining
      from public.products where id = p_product_id;
    return jsonb_build_object(
      'success', true,
      'status', v_status,
      'already_reserved', true,
      'order_id', v_order_id,
      'remaining_stock', coalesce(v_remaining, 0),
      'message', 'Order sudah ada untuk token ini.'
    );
  end if;

  -- Pengurangan stok atomik (anti-overselling).
  update public.products
     set remaining_stock = remaining_stock - 1
   where id = p_product_id and remaining_stock > 0
  returning remaining_stock into v_remaining;

  if v_remaining is null then
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

  return jsonb_build_object(
    'success', true,
    'status', 'pending',
    'order_id', v_order_id,
    'remaining_stock', v_remaining,
    'message', 'Slot tiket diamankan, menunggu pembayaran.'
  );
end;
$$;

grant execute on function public.reserve_ticket(uuid, text, uuid)
  to anon, authenticated, service_role;

-- =========================================================
-- set_payment_ref: simpan order_id Midtrans pada order internal
-- =========================================================
create or replace function public.set_payment_ref(
  p_order_id uuid,
  p_payment_ref text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.orders set payment_ref = p_payment_ref where id = p_order_id;
end;
$$;

revoke all on function public.set_payment_ref(uuid, text) from public, anon, authenticated;
grant execute on function public.set_payment_ref(uuid, text) to service_role;

-- =========================================================
-- confirm_paid_order: dipanggil webhook saat pembayaran lunas
-- =========================================================
create or replace function public.confirm_paid_order(p_payment_ref text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order_id uuid;
begin
  update public.orders
     set status = 'confirmed', payment_status = 'paid'
   where payment_ref = p_payment_ref
  returning id into v_order_id;
  return jsonb_build_object('success', v_order_id is not null, 'order_id', v_order_id);
end;
$$;

revoke all on function public.confirm_paid_order(text) from public, anon, authenticated;
grant execute on function public.confirm_paid_order(text) to service_role;

-- =========================================================
-- release_order: pembayaran gagal/expire -> kembalikan stok, hapus reservasi
-- =========================================================
create or replace function public.release_order(p_payment_ref text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order_id uuid;
  v_product  uuid;
  v_payment  text;
begin
  select id, product_id, payment_status
    into v_order_id, v_product, v_payment
    from public.orders where payment_ref = p_payment_ref;

  if v_order_id is null then
    return jsonb_build_object('success', false, 'message', 'Order tidak ditemukan.');
  end if;
  if v_payment = 'paid' then
    return jsonb_build_object('success', false, 'message', 'Order sudah dibayar.');
  end if;

  -- Kembalikan stok (tidak melebihi total) lalu lepas reservasi.
  update public.products
     set remaining_stock = least(remaining_stock + 1, total_stock)
   where id = v_product;
  delete from public.orders where id = v_order_id;

  return jsonb_build_object('success', true, 'order_id', v_order_id);
end;
$$;

revoke all on function public.release_order(text) from public, anon, authenticated;
grant execute on function public.release_order(text) to service_role;
