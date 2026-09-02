"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  discountBadge?: string | null;
}

export default function ProductGallery({
  images: rawImages,
  productName,
  discountBadge,
}: ProductGalleryProps) {
  const images =
    rawImages && rawImages.length > 0
      ? rawImages
      : ["/products/placeholder.jpg"];

  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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

  const activeImage = images[activeIndex] || images[0];

  return (
    <>
      <div className="flex flex-col-reverse md:flex-row gap-4 lg:gap-6">
        {/* ================= THUMBNAILS (VERTICAL ON MD+, HORIZONTAL ON MOBILE) ================= */}
        {images.length > 1 && (
          <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto md:max-h-[620px] pb-2 md:pb-0 scrollbar-thin scrollbar-thumb-ink/10 flex-shrink-0">
            {images.map((img, idx) => {
              const isSelected = activeIndex === idx;
              return (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`View ${productName} image ${idx + 1}`}
                  className={`
                    relative w-16 h-20 md:w-20 md:h-24 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300
                    ${
                      isSelected
                        ? "border-rani shadow-md ring-2 ring-rani/20 scale-[1.02] opacity-100"
                        : "border-ink/10 opacity-70 hover:opacity-100 hover:border-ink/30"
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
        <div className="relative flex-1 aspect-[3/4] rounded-2xl overflow-hidden bg-ink/5 border border-ink/10 shadow-sm group">
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
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ))}

          {/* Discount Badge */}
          {discountBadge && (
            <div className="absolute top-4 left-4 z-20 rounded-full border border-rani/20 bg-ivory/95 px-3 py-1.5 text-[10px] font-semibold tracking-wider text-rani shadow-sm backdrop-blur-md">
              {discountBadge}
            </div>
          )}

          {/* Zoom hint overlay icon */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            aria-label="Open zoom view"
            className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-ivory/90 text-ink/70 shadow-sm backdrop-blur-md transition-all duration-300 hover:bg-ivory hover:text-ink hover:scale-105"
          >
            <svg
              className="w-4 h-4"
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

          {/* Image Navigation Arrows (Desktop & Tablet) */}
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
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-ivory/85 text-ink/80 shadow-md backdrop-blur-md transition-all duration-300 hover:bg-ivory hover:text-ink hover:scale-110 opacity-80 hover:opacity-100"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-ivory/85 text-ink/80 shadow-md backdrop-blur-md transition-all duration-300 hover:bg-ivory hover:text-ink hover:scale-110 opacity-80 hover:opacity-100"
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
            <div className="absolute bottom-4 left-0 right-0 z-20 flex items-center justify-between px-4 pointer-events-none">
              <div className="flex items-center gap-1.5 rounded-full bg-ink/30 px-3 py-1.5 backdrop-blur-md pointer-events-auto">
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
                      h-1.5 rounded-full transition-all duration-300
                      ${
                        activeIndex === idx
                          ? "w-5 bg-ivory"
                          : "w-1.5 bg-ivory/60 hover:bg-ivory"
                      }
                    `}
                  />
                ))}
              </div>

              <div className="rounded-full border border-ivory/60 bg-ivory/90 px-3 py-1 text-[11px] font-medium tracking-wider text-ink shadow-sm backdrop-blur-md">
                {activeIndex + 1} / {images.length}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= FULLSCREEN LIGHTBOX MODAL ================= */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Close zoomed view"
            className="absolute top-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white transition-all hover:bg-white/30 hover:scale-110"
          >
            <svg
              className="w-6 h-6"
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
            className="relative w-full max-w-4xl h-[85vh] flex items-center justify-center"
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
                  className="absolute left-2 md:-left-14 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-white/40 hover:scale-110"
                >
                  <svg
                    className="w-6 h-6 -translate-x-0.5"
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
                  className="absolute right-2 md:-right-14 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-white/40 hover:scale-110"
                >
                  <svg
                    className="w-6 h-6 translate-x-0.5"
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
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 px-4 py-2 rounded-full backdrop-blur-md">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`relative w-10 h-12 rounded-md overflow-hidden border transition-all ${
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
