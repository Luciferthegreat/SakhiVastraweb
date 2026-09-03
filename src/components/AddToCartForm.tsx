"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";

interface VariantOption {
  id: string;
  size: string;
  stock: number;
  price: number; // paise, basePrice + priceDelta
  chest?: string | null;
  shoulder?: string | null;
  waist?: string | null;
  length?: string | null;
  hip?: string | null;
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
  const [copied, setCopied] = useState(false);
  const [isScrolledPast, setIsScrolledPast] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();

  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when main button is scrolled above viewport
        setIsScrolledPast(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function handleAddToCart() {
    if (!selected || selected.stock === 0) return;
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
  }

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({
          title: "SakhiVastra Kurti",
          text: "Check out this handcrafted kurti on SakhiVastra",
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.log("Share cancelled");
    }
  }

  if (!selected) {
    return (
      <div className="rounded-xl border border-ink/15 bg-ink/5 p-4 text-center">
        <p className="text-ink/60 text-sm">This piece is currently unavailable.</p>
      </div>
    );
  }

  const isOutOfStock = selected.stock === 0;

  // Determine which measurements are available for this specific Kurti
  const hasChest = variants.some(
    (v) => v.chest && v.chest.trim() !== "" && v.chest.trim() !== "-"
  );
  const hasShoulder = variants.some(
    (v) => v.shoulder && v.shoulder.trim() !== "" && v.shoulder.trim() !== "-"
  );
  const hasWaist = variants.some(
    (v) => v.waist && v.waist.trim() !== "" && v.waist.trim() !== "-"
  );
  const hasLength = variants.some(
    (v) => v.length && v.length.trim() !== "" && v.length.trim() !== "-"
  );
  const hasHip = variants.some(
    (v) => v.hip && v.hip.trim() !== "" && v.hip.trim() !== "-"
  );

  const hasSizeChart =
    hasChest || hasShoulder || hasWaist || hasLength || hasHip;

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
      <div ref={buttonRef} className="pt-2">
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={handleAddToCart}
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

        {/* Quick Share Options */}
        <div className="mt-3.5 flex items-center justify-between pt-1 text-[11px] text-ink/65">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 hover:text-rani transition-colors font-medium tracking-wider uppercase text-[10px]"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <circle cx="18" cy="5" r="2.5" />
              <circle cx="6" cy="12" r="2.5" />
              <circle cx="18" cy="19" r="2.5" />
              <path d="M8.2 10.8L15.8 6.2" />
              <path d="M8.2 13.2L15.8 17.8" />
            </svg>
            <span>{copied ? "Link Copied! ✓" : "Share Design"}</span>
          </button>

          <a
            href={
              typeof window !== "undefined"
                ? `https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Check out this beautiful handcrafted kurti on SakhiVastra: ${window.location.href}`
                  )}`
                : "#"
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-green-700 text-green-800/80 transition-colors font-medium tracking-wider uppercase text-[10px]"
          >
            <span>Share on WhatsApp</span>
            <span className="text-xs">↗</span>
          </a>
        </div>
      </div>

      {/* ================= MOBILE FLOATING STICKY QUICK-BUY BAR ================= */}
      <div
        className={`
          md:hidden fixed bottom-[52px] left-0 right-0 z-30
          bg-[#FAF7EE]/95 backdrop-blur-xl border-t border-ink/10 shadow-[0_-8px_25px_rgba(48,53,31,0.12)]
          px-3.5 py-2.5 transition-all duration-300
          ${
            isScrolledPast
              ? "translate-y-0 opacity-100 pointer-events-auto"
              : "translate-y-full opacity-0 pointer-events-none"
          }
        `}
      >
        <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative h-10 w-8 rounded-lg overflow-hidden flex-shrink-0 border border-ink/10">
              <Image
                src={image}
                alt={productName}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-peacock font-display">
                ₹{(selected.price / 100).toLocaleString("en-IN")}
              </p>
              <button
                type="button"
                onClick={() => {
                  buttonRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                }}
                className="text-[10px] uppercase font-semibold text-rani bg-rani/10 px-2 py-0.5 rounded-full flex items-center"
              >
                <span>Size: {selected.size}</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className={`
              flex-1 max-w-[190px] py-2.5 px-4 rounded-full font-body text-xs font-bold tracking-wider uppercase transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5
              ${
                isOutOfStock
                  ? "bg-ink/20 text-ink/40 cursor-not-allowed"
                  : added
                  ? "bg-peacock text-ivory"
                  : "bg-rani text-ivory hover:bg-rani-dark"
              }
            `}
          >
            {isOutOfStock ? "Out of Stock" : added ? "✓ In Bag" : "Add to Bag →"}
          </button>
        </div>
      </div>

      {/* ================= KURTI-SPECIFIC SIZE CHART ================= */}
      {hasSizeChart && (
        <div className="mt-8 pt-6 border-t border-ink/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-zari" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-ink">
                Size Guide & Garment Measurements
              </h3>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-rani bg-rani/10 px-2.5 py-0.5 rounded-full border border-rani/20">
              Inches (in)
            </span>
          </div>

          <p className="text-[10px] text-ink/45 sm:hidden mb-2">
            Swipe horizontally to see all measurements ↔
          </p>

          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white/70 shadow-sm backdrop-blur-sm">
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-ink/10 bg-ink/5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-ink/70">
                    <th className="py-2.5 px-3 sm:px-4">Size</th>
                    {hasChest && (
                      <th className="py-2.5 px-2.5 sm:px-3 text-center">
                        Bust/Chest
                      </th>
                    )}
                    {hasShoulder && (
                      <th className="py-2.5 px-2.5 sm:px-3 text-center">
                        Shoulder
                      </th>
                    )}
                    {hasWaist && (
                      <th className="py-2.5 px-2.5 sm:px-3 text-center">
                        Waist
                      </th>
                    )}
                    {hasLength && (
                      <th className="py-2.5 px-2.5 sm:px-3 text-center">
                        Length
                      </th>
                    )}
                    {hasHip && (
                      <th className="py-2.5 px-2.5 sm:px-3 text-center">
                        Hip
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5 text-ink/85">
                  {variants.map((v) => {
                    const isCurrent = selected?.id === v.id;
                    return (
                      <tr
                        key={v.id}
                        onClick={() => setSelected(v)}
                        title={`Click to select size ${v.size}`}
                        className={`
                          cursor-pointer transition-colors duration-200
                          ${
                            isCurrent
                              ? "bg-rani/10 font-medium text-rani"
                              : "hover:bg-ink/[0.03]"
                          }
                        `}
                      >
                        <td className="py-2.5 px-3 sm:px-4 font-semibold">
                          <span className="inline-flex items-center gap-1.5">
                            {isCurrent && (
                              <span className="h-1.5 w-1.5 rounded-full bg-rani" />
                            )}
                            <span>{v.size}</span>
                          </span>
                        </td>
                        {hasChest && (
                          <td className="py-2.5 px-2.5 sm:px-3 text-center font-mono text-[11px] sm:text-xs">
                            {v.chest && v.chest.trim() !== "" && v.chest !== "-"
                              ? `${v.chest}"`
                              : "—"}
                          </td>
                        )}
                        {hasShoulder && (
                          <td className="py-2.5 px-2.5 sm:px-3 text-center font-mono text-[11px] sm:text-xs">
                            {v.shoulder &&
                            v.shoulder.trim() !== "" &&
                            v.shoulder !== "-"
                              ? `${v.shoulder}"`
                              : "—"}
                          </td>
                        )}
                        {hasWaist && (
                          <td className="py-2.5 px-2.5 sm:px-3 text-center font-mono text-[11px] sm:text-xs">
                            {v.waist && v.waist.trim() !== "" && v.waist !== "-"
                              ? `${v.waist}"`
                              : "—"}
                          </td>
                        )}
                        {hasLength && (
                          <td className="py-2.5 px-2.5 sm:px-3 text-center font-mono text-[11px] sm:text-xs">
                            {v.length && v.length.trim() !== "" && v.length !== "-"
                              ? `${v.length}"`
                              : "—"}
                          </td>
                        )}
                        {hasHip && (
                          <td className="py-2.5 px-2.5 sm:px-3 text-center font-mono text-[11px] sm:text-xs">
                            {v.hip && v.hip.trim() !== "" && v.hip !== "-"
                              ? `${v.hip}"`
                              : "—"}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-ink/[0.02] px-3.5 py-2.5 border-t border-ink/5 flex items-center justify-between text-[11px] text-ink/60">
              <span className="flex items-center gap-1.5">
                <span className="text-zari text-xs">✦</span>
                <span>Garment measurements in inches. Click any row to select size.</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

