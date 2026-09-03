"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useWishlistStore, WishlistProduct } from "@/lib/wishlist-store";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  discountBadge?: string | null;
  product?: WishlistProduct;
}

export default function ProductGallery({
  images: rawImages,
  productName,
  discountBadge,
  product,
}: ProductGalleryProps) {
  const images =
    rawImages && rawImages.length > 0
      ? rawImages
      : ["/products/placeholder.jpg"];

  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [wishlistToast, setWishlistToast] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);

  const isLiked = useWishlistStore((s) =>
    product ? s.isWishlisted(product.slug) : false
  );
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);

  async function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    const url = typeof window !== "undefined" ? window.location.href : "";

    try {
      if (navigator.share) {
        await navigator.share({
          title: productName,
          text: `Check out ${productName} on SakhiVastra`,
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      setShareToast("Link copied to clipboard ✓");
      setTimeout(() => setShareToast(null), 2500);
    } catch {
      console.log("Share cancelled");
    }
  }

  // Mobile Touch Swipe State
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // Keyboard navigation for lightbox & gallery
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      } else if (e.key === "ArrowRight") {
        setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      } else if (e.key === "Escape" && isLightboxOpen) {
        setIsLightboxOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length, isLightboxOpen]);

  function handleTouchStart(e: React.TouchEvent) {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  }

  function handleTouchMove(e: React.TouchEvent) {
    setTouchEndX(e.targetTouches[0].clientX);
  }

  function handleTouchEnd() {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 35;

    if (distance > minSwipeDistance) {
      // Swiped left -> next image
      setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> prev image
      setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
  }

  const activeImage = images[activeIndex] || images[0];

  return (
    <>
      <div className="flex flex-col-reverse md:flex-row gap-3.5 sm:gap-4 lg:gap-6">
        {/* ================= THUMBNAILS (VERTICAL ON MD+, HORIZONTAL ON MOBILE) ================= */}
        {images.length > 1 && (
          <div className="flex md:flex-col gap-2 sm:gap-2.5 overflow-x-auto md:overflow-y-auto md:max-h-[620px] pb-1.5 md:pb-0 scrollbar-none flex-shrink-0">
            {images.map((img, idx) => {
              const isSelected = activeIndex === idx;
              return (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`View ${productName} image ${idx + 1}`}
                  className={`
                    relative w-14 h-16 sm:w-16 sm:h-20 md:w-20 md:h-24 flex-shrink-0 overflow-hidden rounded-lg sm:rounded-xl border-2 transition-all duration-300
                    ${
                      isSelected
                        ? "border-rani shadow-md ring-2 ring-rani/20 scale-[1.03] opacity-100"
                        : "border-ink/10 opacity-60 hover:opacity-100 hover:border-ink/30"
                    }
                  `}
                >
                  <Image
                    src={img}
                    alt={`${productName} thumbnail ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* ================= MAIN IMAGE CONTAINER ================= */}
        <div
          className="relative flex-1 aspect-[3/4] rounded-2xl sm:rounded-3xl overflow-hidden bg-ink/5 border border-ink/10 shadow-sm group select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Main images stack with smooth fade */}
          {images.map((img, idx) => (
            <div
              key={`${img}-${idx}`}
              className={`
                absolute inset-0 transition-opacity duration-500 ease-in-out cursor-zoom-in
                ${activeIndex === idx ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}
              `}
              onClick={() => setIsLightboxOpen(true)}
            >
              <Image
                src={img}
                alt={`${productName} view ${idx + 1}`}
                fill
                priority={idx === 0}
                className="object-cover transition-transform duration-700 md:group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ))}

          {/* Discount Badge */}
          {discountBadge && (
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 rounded-full border border-rani/20 bg-ivory/95 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[9px] sm:text-[10px] font-semibold tracking-wider text-rani shadow-sm backdrop-blur-md">
              {discountBadge}
            </div>
          )}

          {/* Top Right Action Icons: Wishlist, Share & Zoom */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 sm:gap-2">
            {product && (
              <button
                type="button"
                aria-label={isLiked ? "Remove from wishlist" : "Add to wishlist"}
                title={isLiked ? "Saved in Liked Products" : "Add to Liked Products"}
                onClick={async (e) => {
                  e.stopPropagation();
                  const nowLiked = await toggleWishlist(product);
                  setWishlistToast(
                    nowLiked
                      ? "Saved to Liked Products ♥"
                      : "Removed from Liked Products"
                  );
                  setTimeout(() => setWishlistToast(null), 2000);
                }}
                className={`
                  flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border shadow-sm backdrop-blur-md transition-all duration-300 hover:scale-110
                  ${
                    isLiked
                      ? "border-rani bg-rani text-ivory shadow-md scale-105"
                      : "border-ivory/60 bg-ivory/90 text-ink/70 hover:bg-ivory hover:text-rani"
                  }
                `}
              >
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                  viewBox="0 0 24 24"
                  fill={isLiked ? "currentColor" : "none"}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20.84 4.61C19.32 3.09 16.88 3.09 15.36 4.61L12 7.97L8.64 4.61C7.12 3.09 4.68 3.09 3.16 4.61C1.64 6.13 1.64 8.57 3.16 10.09L12 18.93L20.84 10.09C22.36 8.57 22.36 6.13 20.84 4.61Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}

            {/* Share button */}
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share product"
              title="Share this Kurti"
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-ivory/60 bg-ivory/90 text-ink/70 shadow-sm backdrop-blur-md transition-all duration-300 hover:bg-ivory hover:text-rani hover:scale-105"
            >
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="18"
                  cy="5"
                  r="2.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <circle
                  cx="6"
                  cy="12"
                  r="2.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <circle
                  cx="18"
                  cy="19"
                  r="2.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M8.2 10.8L15.8 6.2"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M8.2 13.2L15.8 17.8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
              </svg>
            </button>

            {/* Zoom hint overlay icon */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxOpen(true);
              }}
              aria-label="Open zoom view"
              title="Click to zoom images"
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-ivory/60 bg-ivory/90 text-ink/70 shadow-sm backdrop-blur-md transition-all duration-300 hover:bg-ivory hover:text-ink hover:scale-105"
            >
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                />
              </svg>
            </button>
          </div>

          {/* Toast popup on gallery */}
          {(wishlistToast || shareToast) && (
            <div className="absolute top-14 right-3 sm:right-4 z-30 whitespace-nowrap rounded-full bg-ink px-3.5 py-1.5 text-[10px] font-medium text-ivory shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
              {wishlistToast || shareToast}
            </div>
          )}

          {/* Image Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((prev) =>
                    prev === 0 ? images.length - 1 : prev - 1
                  );
                }}
                aria-label="Previous image"
                className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-ivory/85 text-ink/80 shadow-md backdrop-blur-md transition-all duration-300 hover:bg-ivory hover:text-ink hover:scale-110 opacity-80 hover:opacity-100"
              >
                <svg
                  className="w-5 h-5 -translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((prev) =>
                    prev === images.length - 1 ? 0 : prev + 1
                  );
                }}
                aria-label="Next image"
                className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-ivory/85 text-ink/80 shadow-md backdrop-blur-md transition-all duration-300 hover:bg-ivory hover:text-ink hover:scale-110 opacity-80 hover:opacity-100"
              >
                <svg
                  className="w-5 h-5 translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}

          {/* Bottom Counter & Dots */}
          {images.length > 1 && (
            <div className="absolute bottom-3 sm:bottom-4 left-0 right-0 z-20 flex items-center justify-between px-3 sm:px-4 pointer-events-none">
              <div className="flex items-center gap-1 sm:gap-1.5 rounded-full bg-ink/30 px-2.5 sm:px-3 py-1 sm:py-1.5 backdrop-blur-md pointer-events-auto">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIndex(idx);
                    }}
                    aria-label={`Go to image ${idx + 1}`}
                    className={`
                      h-1 sm:h-1.5 rounded-full transition-all duration-300
                      ${
                        activeIndex === idx
                          ? "w-4 sm:w-5 bg-ivory"
                          : "w-1 sm:w-1.5 bg-ivory/60 hover:bg-ivory"
                      }
                    `}
                  />
                ))}
              </div>

              <div className="rounded-full border border-ivory/60 bg-ivory/90 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] font-medium tracking-wider text-ink shadow-sm backdrop-blur-md">
                {activeIndex + 1} / {images.length}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= FULLSCREEN LIGHTBOX MODAL ================= */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Close zoomed view"
            className="absolute top-4 right-4 z-50 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/20 text-white transition-all hover:bg-white/30 hover:scale-110"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Lightbox Main Image */}
          <div
            className="relative w-full max-w-4xl h-[78vh] sm:h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={activeImage}
              alt={`${productName} zoomed view`}
              fill
              className="object-contain"
              priority
              sizes="100vw"
            />

            {/* Lightbox Nav Arrows */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex((prev) =>
                      prev === 0 ? images.length - 1 : prev - 1
                    )
                  }
                  aria-label="Previous image"
                  className="absolute left-2 md:-left-14 top-1/2 -translate-y-1/2 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-white/40 hover:scale-110"
                >
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 -translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex((prev) =>
                      prev === images.length - 1 ? 0 : prev + 1
                    )
                  }
                  aria-label="Next image"
                  className="absolute right-2 md:-right-14 top-1/2 -translate-y-1/2 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-white/40 hover:scale-110"
                >
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </>
            )}

            {/* Bottom thumbnail bar in Lightbox */}
            {images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 bg-black/60 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full backdrop-blur-md max-w-[90vw] overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`relative w-8 h-10 sm:w-10 sm:h-12 flex-shrink-0 rounded-md overflow-hidden border transition-all ${
                      activeIndex === idx
                        ? "border-white scale-105"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
