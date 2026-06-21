-- Lonjak: skema inti flash sale tiket
-- Tabel products + orders dan fungsi atomik purchase_ticket (anti-overselling).

create extension if not exists "pgcrypto";

-- =========================================================
-- TABEL
-- =========================================================
create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  artist          text,
  venue           text,
  event_date      timestamptz,
  tier            text,
  price           integer not null default 0,
  total_stock     integer not null default 0,
  remaining_stock integer not null default 0,
  image_url       text,
  created_at      timestamptz not null default now()
);

create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  buyer_token text not null,
  status      text not null default 'confirmed',
  created_at  timestamptz not null default now()
);

create index if not exists orders_product_id_idx on public.orders(product_id);

-- Satu buyer_token hanya boleh memegang satu order per produk.
-- Ini sekaligus jadi kunci idempotensi saat request diulang.
create unique index if not exists orders_token_product_uidx
  on public.orders(product_id, buyer_token);

-- =========================================================
-- FUNGSI ATOMIK: purchase_ticket
-- =========================================================
-- Inti nilai proyek. Pengurangan stok dilakukan lewat UPDATE ber-row-lock
-- sehingga ribuan request konkuren tidak bisa menjual stok melebihi yang ada.
create or replace function public.purchase_ticket(
  p_product_id uuid,
  p_buyer_token text
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
  insert into public.orders (product_id, buyer_token, status)
  values (p_product_id, p_buyer_token, 'pending')
  on conflict (product_id, buyer_token) do nothing
  returning id into v_order_id;

  if v_order_id is null then
    -- Token sudah pernah dipakai: kembalikan order yang ada (retry idempoten).
    select id into v_order_id
      from public.orders
      where product_id = p_product_id and buyer_token = p_buyer_token;
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
  -- Hanya berhasil bila stok masih tersedia.
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

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table public.products enable row level security;
alter table public.orders   enable row level security;

-- Produk boleh dibaca publik (untuk menampilkan sisa stok).
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"
  on public.products for select
  using (true);

-- orders tidak punya policy select untuk anon: hanya service role / fungsi
-- security definer yang boleh menyentuhnya.

grant execute on function public.purchase_ticket(uuid, text)
  to anon, authenticated, service_role;
