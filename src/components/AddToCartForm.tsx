"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";

interface VariantOption {
  id: string;
  size: string;
  stock: number;
  price: number; // paise, basePrice + priceDelta
}

export default function AddToCartForm({
  productName,
  slug,
  image,
  variants,
}: {
  productName: string;
  slug: string;
  image: string;
  variants: VariantOption[];
}) {
  const [selected, setSelected] = useState<VariantOption | null>(
    variants.find((v) => v.stock > 0) ?? variants[0] ?? null
  );
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();

  if (!selected) {
    return <p className="text-ink/60 text-sm">This piece is currently unavailable.</p>;
  }

  return (
    <div>
      <fieldset>
        <legend className="text-sm uppercase tracking-widest text-ink/60 mb-3">Size</legend>
        <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Select size">
          {variants.map((v) => (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={selected.id === v.id}
              disabled={v.stock === 0}
              onClick={() => setSelected(v)}
              className={`w-12 h-12 rounded-full border text-sm font-medium transition-colors
                ${selected.id === v.id ? "border-rani bg-rani text-ivory" : "border-ink/20 text-ink"}
                ${v.stock === 0 ? "opacity-30 cursor-not-allowed" : "hover:border-rani"}
              `}
            >
              {v.size}
            </button>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        disabled={selected.stock === 0}
        onClick={() => {
          addItem({
            variantId: selected.id,
            productName,
            slug,
            size: selected.size,
            image,
            unitPrice: selected.price,
            quantity: 1,
          });
          setAdded(true);
          setTimeout(() => setAdded(false), 2000);
        }}
        className="mt-8 w-full md:w-auto font-body text-sm tracking-widest px-10 py-4 bg-rani text-ivory rounded-full hover:bg-rani-dark transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {selected.stock === 0 ? "Out of stock" : added ? "Added ✓" : "Add to Cart"}
      </button>

      {added && (
        <button
          type="button"
          onClick={() => router.push("/cart")}
          className="mt-3 block text-sm text-rani underline"
        >
          View cart →
        </button>
      )}
    </div>
  );
}
