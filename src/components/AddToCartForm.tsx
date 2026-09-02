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
    return (
      <div className="rounded-xl border border-ink/15 bg-ink/5 p-4 text-center">
        <p className="text-ink/60 text-sm">This piece is currently unavailable.</p>
      </div>
    );
  }

  const isOutOfStock = selected.stock === 0;

  return (
    <div className="space-y-6">
      {/* ================= SIZE SELECTION ================= */}
      <fieldset>
        <div className="flex items-center justify-between mb-3">
          <legend className="text-xs uppercase tracking-[0.2em] font-semibold text-ink/70">
            Select Size
          </legend>
          {selected.stock > 0 && selected.stock <= 3 && (
            <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              Only {selected.stock} left
            </span>
          )}
        </div>

        <div className="flex gap-2.5 flex-wrap" role="radiogroup" aria-label="Select size">
          {variants.map((v) => {
            const isSelected = selected.id === v.id;
            const disabled = v.stock === 0;

            return (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={disabled}
                onClick={() => setSelected(v)}
                className={`
                  relative min-w-[50px] h-[48px] px-3 rounded-2xl border text-sm font-medium transition-all duration-200 flex items-center justify-center
                  ${
                    isSelected
                      ? "border-rani bg-rani text-ivory shadow-md scale-105"
                      : "border-ink/20 text-ink bg-white/60 hover:border-rani/50 hover:bg-white"
                  }
                  ${disabled ? "opacity-30 cursor-not-allowed line-through bg-ink/5 border-ink/10" : "cursor-pointer active:scale-95"}
                `}
              >
                {v.size}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* ================= ACTIONS ================= */}
      <div className="pt-2">
        <button
          type="button"
          disabled={isOutOfStock}
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
            setTimeout(() => setAdded(false), 2500);
          }}
          className={`
            w-full py-4 px-8 rounded-full font-body text-sm font-medium tracking-widest uppercase transition-all duration-300 shadow-md flex items-center justify-center gap-2
            ${
              isOutOfStock
                ? "bg-ink/20 text-ink/40 cursor-not-allowed shadow-none"
                : added
                ? "bg-peacock text-ivory shadow-lg scale-[1.01]"
                : "bg-rani text-ivory hover:bg-rani-dark hover:shadow-xl active:scale-[0.98]"
            }
          `}
        >
          {isOutOfStock ? (
            "Out of Stock"
          ) : added ? (
            <>
              <span>✓ Added to Cart</span>
            </>
          ) : (
            <>
              <span>Add to Cart</span>
              <span>—</span>
              <span>₹{(selected.price / 100).toLocaleString("en-IN")}</span>
            </>
          )}
        </button>

        {added && (
          <div className="mt-3 flex items-center justify-between bg-rani/10 border border-rani/20 rounded-2xl p-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="text-xs font-medium text-ink">
              1 item added to your bag
            </span>
            <button
              type="button"
              onClick={() => router.push("/cart")}
              className="text-xs font-semibold text-rani underline hover:text-ink transition-colors"
            >
              View Cart →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

