"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWishlistStore } from "@/lib/wishlist-store";
import ProductCard from "@/components/ProductCard";

type User = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const wishlistItems = useWishlistStore((s) => s.items);
  const syncFromServer = useWishlistStore((s) => s.syncFromServer);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (!response.ok) {
          window.location.href = "/login?redirect=/profile";
          return;
        }

        const data = await response.json();
        setUser(data.user);

        // Sync wishlist from server for logged in user
        syncFromServer();
      } catch {
        window.location.href = "/login?redirect=/profile";
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [syncFromServer]);

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-82px)] bg-ivory px-6 py-20">
        <div className="mx-auto max-w-[900px] text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink/50">
            Loading profile...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-[calc(100vh-82px)] bg-ivory px-6 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1100px]">

        {/* HEADER */}
        <div className="mb-10">
          <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-rani font-medium">
            SakhiVastra
          </p>

          <h1 className="font-serif text-4xl text-ink sm:text-5xl">
            My Profile
          </h1>

          <p className="mt-3 text-sm text-ink/55">
            Manage your account and view your details.
          </p>
        </div>

        {/* PROFILE CARD */}
        <div className="grid overflow-hidden rounded-2xl border border-ink/10 bg-[#f8f4e8] shadow-[0_20px_60px_rgba(38,43,18,0.08)] md:grid-cols-[280px_1fr]">

          {/* LEFT */}
          <div className="flex min-h-[300px] flex-col justify-between bg-[#30371c] p-8 text-ivory sm:p-10">

            <div>
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-zari/50 text-3xl font-serif text-zari">
                {(user.name || user.email)
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <h2 className="font-serif text-2xl">
                {user.name || "Welcome"}
              </h2>

              <p className="mt-2 break-all text-xs text-ivory/55">
                {user.email}
              </p>
            </div>

            <div>
              <div className="mb-4 h-px w-14 bg-zari" />

              <p className="text-[10px] uppercase tracking-[0.25em] text-ivory/50">
                SakhiVastra Member
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="p-8 sm:p-10">

            <div className="mb-8">
              <p className="text-[10px] uppercase tracking-[0.25em] text-rani">
                Account Details
              </p>

              <h2 className="mt-2 font-serif text-2xl text-ink">
                Personal Information
              </h2>
            </div>

            <div className="space-y-6">

              {/* NAME */}
              <div className="border-b border-ink/10 pb-5">
                <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-ink/45">
                  Full Name
                </p>

                <p className="text-sm text-ink">
                  {user.name || "Not added"}
                </p>
              </div>

              {/* EMAIL */}
              <div className="border-b border-ink/10 pb-5">
                <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-ink/45">
                  Email Address
                </p>

                <p className="text-sm text-ink">
                  {user.email}
                </p>
              </div>

              {/* PHONE */}
              <div className="border-b border-ink/10 pb-5">
                <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-ink/45">
                  Phone Number
                </p>

                <p className="text-sm text-ink">
                  {user.phone || "Not added"}
                </p>
              </div>

            </div>

            {/* ACTIONS */}
            <div className="mt-8 flex flex-wrap gap-3">

              <Link
                href="/shop"
                className="rounded-full bg-[#68753a] px-6 py-3 text-[10px] font-medium uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-[#56632f]"
              >
                Continue Shopping
              </Link>

              <Link
                href="/cart"
                className="rounded-full border border-ink/15 px-6 py-3 text-[10px] font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:border-rani/50 hover:text-rani"
              >
                View Cart
              </Link>

            </div>

          </div>
        </div>

        {/* 3 CARDS IN ONE LINE (ORDERS - LIKED PRODUCTS - ADDRESS) */}
        <div className="mt-8 grid gap-5 grid-cols-1 md:grid-cols-3">

          {/* CARD 1: ORDERS */}
          <div className="rounded-2xl border border-ink/10 bg-[#f8f4e8] p-7 transition-all duration-300 hover:shadow-md">
            <p className="text-[10px] uppercase tracking-[0.2em] text-rani font-semibold">
              Orders
            </p>

            <h3 className="mt-2 font-serif text-xl text-ink">
              My Orders
            </h3>

            <p className="mt-2 text-xs sm:text-sm text-ink/50">
              Your order history will appear here.
            </p>
          </div>

          {/* CARD 2: LIKED PRODUCTS (IN BETWEEN) */}
          <a
            href="#liked-products"
            className="group block rounded-2xl border border-rani/25 bg-[#f8f4e8] p-7 transition-all duration-300 hover:shadow-lg hover:border-rani hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.2em] text-rani font-semibold">
                Wishlist
              </p>
              <span className="rounded-full bg-rani/10 px-2.5 py-0.5 text-[10px] font-semibold text-rani">
                {wishlistItems.length} {wishlistItems.length === 1 ? "Piece" : "Pieces"}
              </span>
            </div>

            <h3 className="mt-2 font-serif text-xl text-ink flex items-center gap-1.5 transition-colors group-hover:text-rani">
              <span>Liked Products</span>
            </h3>

            <p className="mt-2 text-xs sm:text-sm text-ink/50">
              {wishlistItems.length > 0
                ? `${wishlistItems.length} saved piece(s) in your wishlist. Click to view ↓`
                : "Your saved & liked kurtis appear here. Click to view ↓"}
            </p>
          </a>

          {/* CARD 3: ADDRESS */}
          <div className="rounded-2xl border border-ink/10 bg-[#f8f4e8] p-7 transition-all duration-300 hover:shadow-md">
            <p className="text-[10px] uppercase tracking-[0.2em] text-rani font-semibold">
              Address
            </p>

            <h3 className="mt-2 font-serif text-xl text-ink">
              Saved Addresses
            </h3>

            <p className="mt-2 text-xs sm:text-sm text-ink/50">
              Your saved delivery addresses will appear here.
            </p>
          </div>

        </div>

        {/* LIKED PRODUCTS SECTION */}
        <section id="liked-products" className="mt-12 pt-8 border-t border-ink/10 scroll-mt-24">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-rani font-semibold">
                Curated Wishlist
              </p>
              <h2 className="mt-1 font-serif text-2xl sm:text-3xl text-ink">
                Your Liked Products
              </h2>
            </div>

            {wishlistItems.length > 0 && (
              <Link
                href="/shop"
                className="text-xs uppercase tracking-wider font-semibold text-rani hover:text-ink transition-colors inline-flex items-center gap-1"
              >
                Explore More <span>→</span>
              </Link>
            )}
          </div>

          {wishlistItems.length === 0 ? (
            <div className="rounded-3xl border border-ink/10 bg-[#f8f4e8] p-10 sm:p-14 text-center max-w-lg mx-auto shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rani/10 text-rani">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61C19.32 3.09 16.88 3.09 15.36 4.61L12 7.97L8.64 4.61C7.12 3.09 4.68 3.09 3.16 4.61C1.64 6.13 1.64 8.57 3.16 10.09L12 18.93L20.84 10.09C22.36 8.57 22.36 6.13 20.84 4.61Z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl text-ink">No Liked Products Yet</h3>
              <p className="mt-2 text-xs sm:text-sm text-ink/60 leading-relaxed">
                Tap the heart icon on any kurti in our collection to save your favorite designs to your profile.
              </p>
              <Link
                href="/shop"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-rani px-6 py-3 text-xs font-semibold uppercase tracking-wider text-ivory transition-all hover:bg-rani-dark hover:shadow-md"
              >
                Explore Collection →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5 sm:gap-x-5 sm:gap-y-10 md:grid-cols-3 lg:grid-cols-4">
              {wishlistItems.map((item) => (
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
          )}
        </section>

      </div>
    </main>
  );
}