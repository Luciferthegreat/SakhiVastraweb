"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export interface ProductCardData {
  slug: string;
  name: string;
  images: string[];
  basePrice: number;
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

  const images =
    product.images?.length > 0
      ? product.images
      : ["/products/placeholder.jpg"];

  /*
   * Automatic image rotation
   * Changes every 3 seconds
   */
  useEffect(() => {
    if (images.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setActiveImage((current) => (current + 1) % images.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [images.length, isHovered]);

  return (
    <div className="group">
      {/* PRODUCT IMAGE */}
      <Link
        href={`/product/${product.slug}`}
        className="block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="
            relative
            aspect-[3/4]
            overflow-hidden
            rounded-2xl
            bg-ink/5
            shadow-sm
          "
        >
          {/* Background image */}
          <Image
            src={images[(activeImage + 1) % images.length]}
            alt=""
            fill
            priority={activeImage === 0}
            className="
              object-cover
              scale-[1.01]
            "
            sizes="(max-width: 768px) 50vw, 25vw"
          />

          {/* Active image - CROSS FADE */}
          {images.map((image, index) => (
            <Image
              key={`${image}-${index}`}
              src={image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className={`
                object-cover
                transition-opacity
                duration-1000
                ease-in-out
                ${
                  activeImage === index
                    ? "opacity-100"
                    : "opacity-0"
                }
              `}
            />
          ))}

          {/* Image counter */}
          {images.length > 1 && (
            <div
              className="
                absolute
                bottom-3
                right-3
                rounded-full
                bg-ivory/90
                backdrop-blur-sm
                px-3
                py-1
                text-[11px]
                tracking-wide
                text-ink
                shadow-sm
              "
            >
              {activeImage + 1} / {images.length}
            </div>
          )}
        </div>
      </Link>

      {/* THUMBNAILS */}
      {images.length > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveImage(index)}
              aria-label={`View image ${index + 1}`}
              className={`
                relative
                h-12
                w-10
                overflow-hidden
                rounded-lg
                border
                transition-all
                duration-300
                ${
                  activeImage === index
                    ? "border-zari scale-105 shadow-sm"
                    : "border-transparent opacity-70 hover:opacity-100"
                }
              `}
            >
              <Image
                src={image}
                alt={`${product.name} ${index + 1}`}
                fill
                className="object-cover"
                sizes="40px"
              />
            </button>
          ))}
        </div>
      )}

      {/* PRODUCT DETAILS */}
      <Link href={`/product/${product.slug}`} className="block">
        <div className="mt-5 text-center">

          <h3
            className="
              font-display
              text-base
              md:text-lg
              leading-snug
              text-ink
              transition-colors
              duration-300
              group-hover:text-peacock
            "
          >
            {product.name}
          </h3>

          {product.fabric && (
            <p
              className="
                mt-2
                text-[10px]
                uppercase
                tracking-[0.18em]
                text-ink/45
              "
            >
              {product.fabric}
            </p>
          )}

          {/* PRICE */}
          <p
            className="
              mt-3
              font-body
              text-sm
              font-medium
              tracking-wide
              text-peacock
            "
          >
            {formatInr(product.basePrice)}
          </p>

          {/* Small decorative line */}
          <div
            className="
              mx-auto
              mt-3
              h-px
              w-7
              bg-zari/50
              transition-all
              duration-500
              group-hover:w-12
            "
          />
        </div>
      </Link>
    </div>
  );
}