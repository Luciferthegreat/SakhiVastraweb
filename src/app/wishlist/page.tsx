"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useWishlistStore } from "@/lib/wishlist-store";
import ProductCard from "@/components/ProductCard";

export default function WishlistPage() {
  const items = useWishlistStore((s) => s.items);
  const syncFromServer = useWishlistStore((s) => s.syncFromServer);

  useEffect(() => {
    syncFromServer();
  }, [syncFromServer]);

  return (
    <div className="min-h-screen bg-ivory">
      {/* ================= BREADCRUMBS ================= */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
        <div className="flex items-center gap-2 text-[11px] sm:text-xs tracking-wider text-ink/50">
          <Link href="/" className="hover:text-rani transition-colors">
            HOME
          </Link>
          <span>/</span>
          <span className="text-ink">WISHLIST</span>
        </div>
      </nav>

      {/* ================= MAIN CONTENT ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-[10px] sm:text-xs tracking-[0.35em] uppercase text-rani font-semibold mb-2">
            SAVED PIECES
          </p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium text-ink flex items-center justify-center gap-3">
            <span>Liked Products</span>
            <span className="text-rani text-2xl sm:text-3xl">♥</span>
          </h1>

          <div className="my-3 sm:my-4 flex items-center justify-center gap-3">
            <span className="h-px w-8 sm:w-12 bg-zari" />
            <span className="text-xs sm:text-sm text-zari">✦</span>
            <span className="h-px w-8 sm:w-12 bg-zari" />
          </div>

          <p className="mx-auto mt-2 max-w-lg text-xs sm:text-sm leading-5 text-ink/60">
            {items.length > 0
              ? `You have saved ${items.length} ${
                  items.length === 1 ? "piece" : "pieces"
                } to your personal wishlist.`
              : "Discover handcrafted artisan kurtis and tap the heart icon to save your favorites."}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-ink/10 bg-[#f8f4e8] p-10 sm:p-16 text-center max-w-lg mx-auto shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rani/10 text-3xl text-rani">
              ♡
            </div>
            <h2 className="font-display text-2xl font-medium text-ink">
              Your Wishlist is Empty
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-ink/60 leading-relaxed max-w-sm mx-auto">
              You haven&apos;t liked any pieces yet. Explore our handcrafted collection and tap the heart icon to curate your favorites.
            </p>
            <div className="mt-8">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-rani px-8 py-3.5 text-xs font-semibold uppercase tracking-widest text-ivory transition-all hover:bg-rani-dark hover:shadow-lg active:scale-95"
              >
                <span>Explore All Kurtis</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-ink/10">
              <span className="text-xs uppercase tracking-wider font-semibold text-ink/70">
                {items.length} {items.length === 1 ? "Item" : "Items"} Saved
              </span>
              <Link
                href="/shop"
                className="text-xs uppercase tracking-wider font-semibold text-rani hover:text-ink transition-colors inline-flex items-center gap-1"
              >
                Continue Shopping <span>→</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3.5 sm:gap-x-5 sm:gap-y-12 md:grid-cols-4 md:gap-x-8">
              {items.map((item) => (
                <ProductCard
                  key={item.slug}
                  product={{
                    id: item.id,
                    slug: item.slug,
                    name: item.name,
                    images: item.images,
                    basePrice: item.basePrice,
                    originalPrice: item.originalPrice,
                    fabric: item.fabric,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
