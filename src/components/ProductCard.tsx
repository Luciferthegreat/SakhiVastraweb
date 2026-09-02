"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export interface ProductCardData {
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

  /*
   * 5 different offer variations.
   * Uses product slug so the same product
   * keeps the same variation after refresh.
   */

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
    }, 3000);

    return () => clearInterval(timer);
  }, [images.length, isHovered]);

  /*
   * ================= SHARE PRODUCT =================
   *
   * Mobile:
   * Opens native share sheet.
   *
   * Desktop:
   * Copies product URL to clipboard.
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
    } catch (error) {
      // User cancelled native share.
      console.log("Share cancelled");
    }
  }

  return (
    <article
      className="
        group
        overflow-hidden
        rounded-[24px]
        border border-ink/10
        bg-[#f8f4e8]
        shadow-[0_8px_30px_rgba(38,43,18,0.06)]
        transition-all
        duration-500
        hover:-translate-y-1
        hover:shadow-[0_18px_45px_rgba(38,43,18,0.12)]
      "
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
                  duration-1000
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
              left-4
              top-4
              z-20
              rounded-full
              border
              border-rani/20
              bg-ivory/95
              px-3
              py-1.5
              text-[9px]
              font-semibold
              tracking-[0.08em]
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
            right-4
            top-4
            z-20
            flex
            flex-col
            gap-2
          "
        >
          {/* ================= WISHLIST ================= */}

          <button
            type="button"
            aria-label="Add to wishlist"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              // Wishlist functionality will be connected next.
            }}
            className="
              flex
              h-10
              w-10
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
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20.84 4.61C19.32 3.09 16.88 3.09 15.36 4.61L12 7.97L8.64 4.61C7.12 3.09 4.68 3.09 3.16 4.61C1.64 6.13 1.64 8.57 3.16 10.09L12 18.93L20.84 10.09C22.36 8.57 22.36 6.13 20.84 4.61Z"
                stroke="currentColor"
                strokeWidth="1.4"
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
              h-10
              w-10
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
              width="18"
              height="18"
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

        {/* ================= SHARE COPIED MESSAGE ================= */}

        {shareCopied && (
          <div
            className="
              absolute
              bottom-4
              left-1/2
              z-30
              -translate-x-1/2
              whitespace-nowrap
              rounded-full
              bg-ink
              px-4
              py-2
              text-xs
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
              bottom-4
              right-4
              z-10
              rounded-full
              border
              border-ivory/60
              bg-ivory/90
              px-3
              py-1.5
              text-[10px]
              font-medium
              tracking-[0.12em]
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
              bottom-4
              left-1/2
              z-10
              flex
              -translate-x-1/2
              items-center
              gap-1.5
              rounded-full
              bg-ink/20
              px-3
              py-2
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
                  h-1.5
                  rounded-full
                  transition-all
                  duration-300
                  ${
                    activeImage === index
                      ? "w-5 bg-ivory"
                      : "w-1.5 bg-ivory/60 hover:bg-ivory"
                  }
                `}
              />
            ))}
          </div>
        )}
      </div>

      {/* ================= PRODUCT INFO ================= */}

      <div className="px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
        {/* ================= THUMBNAILS ================= */}

        {images.length > 1 && (
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveImage(index)}
                aria-label={`View image ${index + 1}`}
                className={`
                  relative
                  h-11
                  w-9
                  flex-shrink-0
                  overflow-hidden
                  rounded-md
                  border
                  transition-all
                  duration-300
                  ${
                    activeImage === index
                      ? "border-zari opacity-100 shadow-sm"
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

        <Link href={`/product/${product.slug}`}>
          <h3
            className="
              font-display
              text-base
              leading-snug
              text-ink
              transition-colors
              duration-300
              group-hover:text-peacock
              sm:text-lg
            "
          >
            {product.name}
          </h3>
        </Link>

        {/* ================= FABRIC ================= */}

        {product.fabric && (
          <p
            className="
              mt-2
              text-[9px]
              uppercase
              tracking-[0.22em]
              text-ink/45
            "
          >
            {product.fabric}
          </p>
        )}

        {/* ================= PRICE ROW ================= */}

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            {hasDiscount && (
              <p
                className="
                  mb-1
                  text-xs
                  text-ink/45
                  line-through
                "
              >
                {formatInr(product.originalPrice!)}
              </p>
            )}

            <p
              className="
                font-body
                text-sm
                font-medium
                tracking-wide
                text-peacock
              "
            >
              {formatInr(product.basePrice)}
            </p>
          </div>

          {hasDiscount && (
            <span
              className="
                rounded-full
                bg-green-50
                px-2.5
                py-1
                text-[9px]
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

        <div className="mt-3">
          <Link
            href={`/product/${product.slug}`}
            className="
              text-[9px]
              font-medium
              uppercase
              tracking-[0.18em]
              text-rani
              transition-colors
              duration-300
              hover:text-ink
            "
          >
            View Details
          </Link>
        </div>

        {/* ================= DECORATIVE DIVIDER ================= */}

        <div className="mt-5 flex items-center justify-center gap-2">
          <span className="h-px w-8 bg-zari/40" />
          <span className="h-1 w-1 rotate-45 bg-zari" />
          <span className="h-px w-8 bg-zari/40" />
        </div>
      </div>
    </article>
  );
}