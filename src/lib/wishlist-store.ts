"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WishlistProduct {
  id?: string;
  slug: string;
  name: string;
  images: string[];
  basePrice: number;
  originalPrice?: number | null;
  fabric?: string | null;
}

interface WishlistState {
  items: WishlistProduct[];
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  isWishlisted: (slug: string) => boolean;
  toggleWishlist: (product: WishlistProduct) => Promise<boolean>;
  removeItem: (slug: string) => Promise<void>;
  syncFromServer: () => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,
      setHasHydrated: (state) => set({ hasHydrated: state }),

      isWishlisted: (slug: string) => {
        return get().items.some((item) => item.slug === slug);
      },

      toggleWishlist: async (product: WishlistProduct) => {
        const currentItems = get().items;
        const exists = currentItems.some((item) => item.slug === product.slug);

        let newItems: WishlistProduct[];
        let nowWishlisted: boolean;

        if (exists) {
          newItems = currentItems.filter((item) => item.slug !== product.slug);
          nowWishlisted = false;
        } else {
          newItems = [product, ...currentItems];
          nowWishlisted = true;
        }

        // Optimistically update local state
        set({ items: newItems });

        // Sync with server if logged in
        try {
          await fetch("/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug: product.slug, productId: product.id }),
          });
        } catch (error) {
          console.error("Failed to sync wishlist with server:", error);
        }

        return nowWishlisted;
      },

      removeItem: async (slug: string) => {
        const currentItems = get().items;
        const itemToRemove = currentItems.find((i) => i.slug === slug);
        set({ items: currentItems.filter((i) => i.slug !== slug) });

        if (itemToRemove) {
          try {
            await fetch("/api/wishlist", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slug: itemToRemove.slug }),
            });
          } catch (error) {
            console.error("Failed to remove from server wishlist:", error);
          }
        }
      },

      syncFromServer: async () => {
        try {
          const res = await fetch("/api/wishlist", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            if (data.loggedIn && Array.isArray(data.items)) {
              // Merge server items with local items
              const serverItems: WishlistProduct[] = data.items;
              const localItems = get().items;

              const map = new Map<string, WishlistProduct>();
              serverItems.forEach((i) => map.set(i.slug, i));
              localItems.forEach((i) => {
                if (!map.has(i.slug)) map.set(i.slug, i);
              });

              set({ items: Array.from(map.values()) });
            }
          }
        } catch (error) {
          console.error("Error syncing wishlist:", error);
        }
      },
    }),
    {
      name: "sakhivastra-wishlist",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
