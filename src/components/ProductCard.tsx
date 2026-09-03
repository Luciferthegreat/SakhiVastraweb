"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useWishlistStore } from "@/lib/wishlist-store";

export interface ProductCardData {
  id?: string;
  slug: string;
  name: string;
  images: string[];
  basePrice: number;
  originalPrice?: number | null;
  fabric?: string | null;
}

function formatInr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export default function ProductCard({
  product,
}: {
  product: ProductCardData;
}) {
  const [activeImage, setActiveImage] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [wishlistToast, setWishlistToast] = useState<string | null>(null);

  const isLiked = useWishlistStore((s) => s.isWishlisted(product.slug));
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);

  // Touch swipe state for mobile
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const images =
    product.images?.length > 0
      ? product.images
      : ["/products/placeholder.jpg"];

  /*
   * ================= DISCOUNT =================
   */

  const hasDiscount =
    !!product.originalPrice &&
    product.originalPrice > product.basePrice;

  const discountPercent = hasDiscount
    ? Math.round(
        ((product.originalPrice! - product.basePrice) /
          product.originalPrice!) *
          100
      )
    : 0;

  const offerVariations = [
    `OH! ${discountPercent}% OFF`,
    `This one is ${discountPercent}% OFF ✦`,
    `Save ${discountPercent}% on this piece`,
    `${discountPercent}% OFF — Just for you`,
    `A little luxury at ${discountPercent}% OFF`,
  ];

  const variationIndex =
    product.slug
      .split("")
      .reduce((total, char) => total + char.charCodeAt(0), 0) %
    offerVariations.length;

  const offerText = offerVariations[variationIndex];

  /*
   * ================= AUTOMATIC IMAGE ROTATION =================
   */

  useEffect(() => {
    if (images.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setActiveImage((current) => (current + 1) % images.length);
    }, 3500);

    return () => clearInterval(timer);
  }, [images.length, isHovered]);

  /*
   * ================= MOBILE TOUCH SWIPE =================
   */

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
      // Swiped left -> next
      setActiveImage((prev) => (prev + 1) % images.length);
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> prev
      setActiveImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
  }

  /*
   * ================= SHARE PRODUCT =================
   */

  async function handleShare() {
    const url = `${window.location.origin}/product/${product.slug}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: `Check out this beautiful kurti from SakhiVastra`,
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => {
        setShareCopied(false);
      }, 2000);
    } catch {
      console.log("Share cancelled");
    }
  }

  return (
    <article
      className="
        group
        overflow-hidden
        rounded-[18px] sm:rounded-[24px]
        border border-ink/10
        bg-[#f8f4e8]
        shadow-[0_4px_20px_rgba(38,43,18,0.05)]
        sm:shadow-[0_8px_30px_rgba(38,43,18,0.06)]
        transition-all
        duration-500
        hover:-translate-y-1
        hover:shadow-[0_18px_45px_rgba(38,43,18,0.12)]
        flex flex-col justify-between
      "
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ================= IMAGE ================= */}

      <div className="relative overflow-hidden bg-ink/5">
        <Link
          href={`/product/${product.slug}`}
          className="block"
          aria-label={`View ${product.name}`}
        >
          <div className="relative aspect-[3/4]">
            {/* Background image */}
            <Image
              src={images[(activeImage + 1) % images.length]}
              alt=""
              fill
              priority={activeImage === 0}
              className="object-cover scale-[1.01]"
              sizes="(max-width: 768px) 50vw, 25vw"
            />

            {/* Active image */}
            {images.map((image, index) => (
              <Image
                key={`${image}-${index}`}
                src={image}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className={`
                  object-cover
                  transition-all
                  duration-700
                  ease-in-out
                  ${
                    activeImage === index
                      ? "scale-100 opacity-100"
                      : "scale-[1.03] opacity-0"
                  }
                `}
              />
            ))}
          </div>
        </Link>

        {/* ================= OFFER BADGE ================= */}

        {hasDiscount && (
          <div
            className="
              absolute
              left-2.5
              top-2.5
              sm:left-4
              sm:top-4
              z-20
              max-w-[110px]
              sm:max-w-none
              truncate
              rounded-full
              border
              border-rani/20
              bg-ivory/95
              px-2
              py-1
              sm:px-3
              sm:py-1.5
              text-[8px]
              sm:text-[9px]
              font-semibold
              tracking-wider
              text-rani
              shadow-sm
              backdrop-blur-md
            "
          >
            {offerText}
          </div>
        )}

        {/* ================= TOP ACTIONS ================= */}

        <div
          className="
            absolute
            right-2.5
            top-2.5
            sm:right-4
            sm:top-4
            z-20
            flex
            flex-col
            gap-1.5
            sm:gap-2
          "
        >
          {/* ================= WISHLIST ================= */}

          <button
            type="button"
            aria-label={isLiked ? "Remove from wishlist" : "Add to wishlist"}
            title={isLiked ? "Saved to Liked Products" : "Add to Liked Products"}
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              const nowLiked = await toggleWishlist({
                id: product.id,
                slug: product.slug,
                name: product.name,
                images,
                basePrice: product.basePrice,
                originalPrice: product.originalPrice,
                fabric: product.fabric,
              });
              setWishlistToast(nowLiked ? "Added to Liked Products ♥" : "Removed from Liked Products");
              setTimeout(() => setWishlistToast(null), 2000);
            }}
            className={`
              flex
              h-8
              w-8
              sm:h-10
              sm:w-10
              items-center
              justify-center
              rounded-full
              border
              shadow-sm
              backdrop-blur-md
              transition-all
              duration-300
              hover:scale-110
              ${
                isLiked
                  ? "border-rani bg-rani text-ivory shadow-md scale-105"
                  : "border-ivory/60 bg-ivory/90 text-ink/70 hover:bg-ivory hover:text-rani"
              }
            `}
          >
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300"
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

          {/* ================= SHARE ================= */}

          <button
            type="button"
            aria-label="Share product"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleShare();
            }}
            className="
              relative
              flex
              h-8
              w-8
              sm:h-10
              sm:w-10
              items-center
              justify-center
              rounded-full
              border
              border-ivory/60
              bg-ivory/90
              text-ink/70
              shadow-sm
              backdrop-blur-md
              transition-all
              duration-300
              hover:scale-105
              hover:bg-ivory
              hover:text-rani
            "
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
                strokeWidth="1.4"
              />
              <circle
                cx="6"
                cy="12"
                r="2.5"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <circle
                cx="18"
                cy="19"
                r="2.5"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M8.2 10.8L15.8 6.2"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M8.2 13.2L15.8 17.8"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </svg>
          </button>
        </div>

        {/* ================= WISHLIST / SHARE TOAST MESSAGES ================= */}

        {wishlistToast && (
          <div
            className="
              absolute
              bottom-3
              left-1/2
              z-30
              -translate-x-1/2
              whitespace-nowrap
              rounded-full
              bg-ink
              px-3.5
              py-1.5
              text-[10px]
              font-medium
              text-ivory
              shadow-lg
              animate-in
              fade-in
              slide-in-from-bottom-2
              duration-200
            "
          >
            {wishlistToast}
          </div>
        )}

        {shareCopied && !wishlistToast && (
          <div
            className="
              absolute
              bottom-3
              left-1/2
              z-30
              -translate-x-1/2
              whitespace-nowrap
              rounded-full
              bg-ink
              px-3
              py-1.5
              text-[10px]
              text-ivory
              shadow-lg
            "
          >
            Link copied
          </div>
        )}

        {/* ================= IMAGE COUNTER ================= */}

        {images.length > 1 && (
          <div
            className="
              absolute
              bottom-2.5
              right-2.5
              sm:bottom-4
              sm:right-4
              z-10
              rounded-full
              border
              border-ivory/60
              bg-ivory/90
              px-2
              py-1
              sm:px-3
              sm:py-1.5
              text-[9px]
              sm:text-[10px]
              font-medium
              tracking-wider
              text-ink
              shadow-sm
              backdrop-blur-md
            "
          >
            {activeImage + 1} / {images.length}
          </div>
        )}

        {/* ================= IMAGE DOTS ================= */}

        {images.length > 1 && (
          <div
            className="
              absolute
              bottom-2.5
              left-1/2
              z-10
              flex
              -translate-x-1/2
              items-center
              gap-1
              sm:gap-1.5
              rounded-full
              bg-ink/20
              px-2.5
              py-1.5
              backdrop-blur-md
            "
          >
            {images.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveImage(index);
                }}
                aria-label={`View image ${index + 1}`}
                className={`
                  h-1
                  sm:h-1.5
                  rounded-full
                  transition-all
                  duration-300
                  ${
                    activeImage === index
                      ? "w-3.5 sm:w-5 bg-ivory"
                      : "w-1 sm:w-1.5 bg-ivory/60 hover:bg-ivory"
                  }
                `}
              />
            ))}
          </div>
        )}
      </div>

      {/* ================= PRODUCT INFO ================= */}

      <div className="p-3 sm:px-6 sm:pb-6 sm:pt-5 flex flex-col justify-between flex-1">
        <div>
          {/* ================= THUMBNAILS ================= */}

          {images.length > 1 && (
            <div className="mb-3 sm:mb-4 flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`View image ${index + 1}`}
                  className={`
                    relative
                    h-8
                    w-7
                    sm:h-11
                    sm:w-9
                    flex-shrink-0
                    overflow-hidden
                    rounded-md
                    border
                    transition-all
                    duration-300
                    ${
                      activeImage === index
                        ? "border-zari opacity-100 shadow-sm scale-105"
                        : "border-ink/10 opacity-60 hover:opacity-100"
                    }
                  `}
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="36px"
                  />
                </button>
              ))}
            </div>
          )}

          {/* ================= PRODUCT NAME ================= */}

          <Link href={`/product/${product.slug}`} className="block">
            <h3
              className="
                font-display
                text-xs
                sm:text-base
                leading-snug
                text-ink
                transition-colors
                duration-300
                group-hover:text-peacock
                line-clamp-2
              "
            >
              {product.name}
            </h3>
          </Link>

          {/* ================= FABRIC ================= */}

          {product.fabric && (
            <p
              className="
                mt-1
                sm:mt-2
                text-[8px]
                sm:text-[9px]
                uppercase
                tracking-[0.2em]
                text-ink/45
                truncate
              "
            >
              {product.fabric}
            </p>
          )}
        </div>

        <div>
          {/* ================= PRICE ROW ================= */}

          <div className="mt-3 sm:mt-4 flex items-baseline justify-between gap-1.5 sm:gap-3 flex-wrap">
            <div className="flex items-baseline gap-1.5">
              <p
                className="
                  font-body
                  text-xs
                  sm:text-sm
                  font-semibold
                  tracking-wide
                  text-peacock
                "
              >
                {formatInr(product.basePrice)}
              </p>

              {hasDiscount && (
                <p
                  className="
                    text-[10px]
                    sm:text-xs
                    text-ink/40
                    line-through
                  "
                >
                  {formatInr(product.originalPrice!)}
                </p>
              )}
            </div>

            {hasDiscount && (
              <span
                className="
                  rounded-full
                  bg-green-50
                  px-1.5
                  py-0.5
                  sm:px-2.5
                  sm:py-1
                  text-[8px]
                  sm:text-[9px]
                  font-semibold
                  tracking-wide
                  text-green-700
                "
              >
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* ================= VIEW DETAILS ================= */}

          <div className="mt-2.5 sm:mt-3 flex items-center justify-between">
            <Link
              href={`/product/${product.slug}`}
              className="
                text-[8px]
                sm:text-[9px]
                font-semibold
                uppercase
                tracking-[0.16em]
                text-rani
                transition-colors
                duration-300
                hover:text-ink
              "
            >
              View Details →
            </Link>
          </div>

          {/* ================= DECORATIVE DIVIDER ================= */}

          <div className="mt-3 sm:mt-5 flex items-center justify-center gap-1.5 sm:gap-2">
            <span className="h-px w-5 sm:w-8 bg-zari/40" />
            <span className="h-0.5 w-0.5 sm:h-1 sm:w-1 rotate-45 bg-zari" />
            <span className="h-px w-5 sm:w-8 bg-zari/40" />
          </div>
        </div>
      </div>
    </article>
  );
}