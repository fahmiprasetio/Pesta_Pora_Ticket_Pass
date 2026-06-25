"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Grain from "@/components/Grain";
import NavBar from "@/components/NavBar";
import MagneticButton from "@/components/MagneticButton";
import StockBadge from "@/components/StockBadge";
import { useAuth } from "@/components/AuthProvider";
import { getProfile, type Profile } from "@/lib/auth";
import {
  getWishlist,
  removeFromWishlist,
  type WishlistItem,
} from "@/lib/wishlist";
import { getMyOrders, type OrderItem } from "@/lib/orders";
import { rememberProductId, resetBuyerToken } from "@/lib/api";
import { formatRupiah } from "@/lib/format";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/signin");
    }
  }, [authLoading, user, router]);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [prof, items, myOrders] = await Promise.all([
        getProfile(),
        getWishlist(),
        getMyOrders(),
      ]);
      setProfile(prof);
      setWishlist(items);
      setOrders(myOrders);
    } catch {
      setWishlist([]);
      setOrders([]);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  async function handleRemove(productId: string) {
    setRemoving(productId);
    try {
      await removeFromWishlist(productId);
      setWishlist((prev) => prev.filter((i) => i.product.id !== productId));
    } catch {
      // abaikan
    } finally {
      setRemoving(null);
    }
  }

  function handleBuy(productId: string) {
    resetBuyerToken();
    rememberProductId(productId);
    router.push("/waiting");
  }

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  if (authLoading || !user) {
    return <main className="min-h-[100dvh] bg-ink" />;
  }

  const metaName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "";
  const displayName = profile?.full_name || metaName || "Penggemar Lonjak";
  const memberSince = profile?.created_at ? formatDate(profile.created_at) : null;

  return (
    <main className="relative min-h-[100dvh] overflow-clip">
      <Grain />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-15%] top-0 h-[34rem] w-[34rem] rounded-full bg-acid/10 blur-[140px] drift"
      />

      <NavBar />

      <section className="relative z-10 mx-auto max-w-[1100px] px-6 py-10">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-acid">
          Akun kamu
        </p>
        <h1 className="mt-2 font-display text-6xl uppercase leading-none md:text-7xl">
          Profil
        </h1>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="h-fit rounded-2xl border border-ink-line bg-ink-soft p-7">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-acid font-display text-3xl uppercase text-ink">
                {displayName.charAt(0)}
              </div>
              <div>
                <p className="font-display text-2xl uppercase leading-none">
                  {displayName}
                </p>
                <p className="mt-1 font-mono text-xs lowercase tracking-wide text-haze">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-ink-line bg-ink p-4">
                <p className="font-display text-3xl leading-none text-acid">
                  {orders.length}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-haze">
                  Tiket
                </p>
              </div>
              <div className="rounded-xl border border-ink-line bg-ink p-4">
                <p className="font-display text-3xl leading-none text-paper">
                  {wishlist.length}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-haze">
                  Wishlist
                </p>
              </div>
            </div>

            {memberSince && (
              <div className="mt-6 border-t border-ink-line pt-4">
                <p className="font-mono text-[11px] uppercase tracking-widest text-haze">
                  Bergabung sejak
                </p>
                <p className="mt-1 font-display text-lg uppercase">{memberSince}</p>
              </div>
            )}

            <MagneticButton
              onClick={handleSignOut}
              className="mt-7 w-full rounded-full border border-flame px-8 py-3 font-mono text-xs uppercase tracking-widest text-flame transition-colors hover:bg-flame hover:text-ink"
            >
              Keluar
            </MagneticButton>
          </div>

          <div className="space-y-12">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-3xl uppercase leading-none">
                  Tiket Saya
                </h2>
                <span className="font-mono text-xs uppercase tracking-widest text-haze">
                  {orders.length} tiket
                </span>
              </div>

              {loadingData ? (
                <div className="mt-6 h-28 w-full animate-pulse rounded-2xl border border-ink-line bg-ink-soft" />
              ) : orders.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-ink-line bg-ink-soft/50 p-8 text-center">
                  <p className="font-display text-xl uppercase text-haze">
                    Belum ada tiket
                  </p>
                  <p className="mx-auto mt-2 max-w-[40ch] text-sm text-haze">
                    Tiket yang berhasil kamu amankan saat drop akan muncul di
                    sini secara otomatis.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-acid/30 bg-ink-soft p-5"
                    >
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-acid">
                          {order.product.tier ?? "Festival Pass"}
                        </p>
                        <p className="mt-1 font-display text-2xl uppercase leading-tight">
                          {order.product.name}
                        </p>
                        <p className="mt-1 font-mono text-xs uppercase tracking-widest text-haze">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-haze">
                          Order
                        </p>
                        <p className="font-display text-lg uppercase text-acid">
                          {order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <span className="mt-2 inline-block rounded-full border border-acid px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-acid">
                          Confirmed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-3xl uppercase leading-none">
                  Wishlist
                </h2>
                <span className="font-mono text-xs uppercase tracking-widest text-haze">
                  {wishlist.length} item
                </span>
              </div>

              {loadingData ? (
                <div className="mt-6 h-40 w-full animate-pulse rounded-2xl border border-ink-line bg-ink-soft" />
              ) : wishlist.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-ink-line bg-ink-soft/50 p-10 text-center">
                  <p className="font-display text-2xl uppercase text-haze">
                    Wishlist masih kosong
                  </p>
                  <p className="mx-auto mt-3 max-w-[36ch] text-sm text-haze">
                    Simpan event favoritmu supaya gampang ditemukan saat drop
                    berikutnya dibuka.
                  </p>
                  <Link
                    href="/"
                    className="mt-6 inline-block rounded-full bg-acid px-6 py-3 font-mono text-xs uppercase tracking-widest text-ink transition-colors hover:bg-acid-deep"
                  >
                    Jelajahi event
                  </Link>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {wishlist.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-4 rounded-2xl border border-ink-line bg-ink-soft p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-acid">
                          {item.product.tier ?? "Festival Pass"}
                        </p>
                        <p className="mt-1 font-display text-2xl uppercase leading-tight">
                          {item.product.name}
                        </p>
                        <p className="mt-1 font-mono text-xs uppercase tracking-widest text-haze">
                          {item.product.venue ?? ""}
                        </p>
                        <div className="mt-3 flex items-center gap-4">
                          <span className="font-display text-xl text-acid">
                            {formatRupiah(item.product.price)}
                          </span>
                          <StockBadge
                            remaining={item.product.remaining_stock}
                            total={item.product.total_stock}
                          />
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-3">
                        <button
                          type="button"
                          onClick={() => handleBuy(item.product.id)}
                          className="rounded-full bg-acid px-5 py-3 font-mono text-xs uppercase tracking-widest text-ink transition-colors hover:bg-acid-deep"
                        >
                          Beli
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.product.id)}
                          disabled={removing === item.product.id}
                          className="rounded-full border border-ink-line px-5 py-3 font-mono text-xs uppercase tracking-widest text-haze transition-colors hover:border-flame hover:text-flame disabled:opacity-50"
                        >
                          {removing === item.product.id ? "..." : "Hapus"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
