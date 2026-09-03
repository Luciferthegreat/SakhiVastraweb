import Link from "next/link";
import { prisma } from "@/lib/db";
import ProductCard from "@/components/ProductCard";

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: {
      variants: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Product with highest total stock becomes the hero product
  const heroProduct = products
    .map((product) => ({
      ...product,
      totalStock: product.variants.reduce(
        (total, variant) => total + variant.stock,
        0
      ),
    }))
    .sort((a, b) => b.totalStock - a.totalStock)[0];

  const featured = products.slice(0, 4);

  // DB price is stored in paise
  const heroPrice = heroProduct ? heroProduct.basePrice / 100 : 0;

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden pt-4 sm:pt-8 pb-12 sm:pb-20">
        {/* Decorative background circles */}
        <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full border border-zari/20" />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full border border-zari/20" />

        <div className="relative w-full px-4 sm:px-8 md:px-[6vw] lg:px-[7vw] xl:px-[8vw]">
          {/* Soft luxury background motif */}
          <div
            className="pointer-events-none absolute left-[42%] top-[46%] hidden -translate-x-1/2 -translate-y-1/2 lg:block"
            aria-hidden="true"
          >
            <div className="flex h-64 w-64 items-center justify-center rounded-full border border-zari/10">
              <div className="flex h-44 w-44 items-center justify-center rounded-full border border-zari/10">
                <span className="font-display text-6xl font-light text-zari/10">
                  ✦
                </span>
              </div>
            </div>
          </div>

          <div className="grid items-center gap-10 sm:gap-12 lg:grid-cols-[48%_52%] lg:gap-10">
            {/* LEFT CONTENT */}
            <div className="relative z-10 max-w-xl text-center sm:text-left">
              <p
                className="mb-3 sm:mb-4 text-[11px] sm:text-xs font-semibold tracking-[0.3em] uppercase text-rani"
              >
                Handcrafted Heritage · Jaipur
              </p>

              <h1 className="sv-fade-up font-display text-4xl sm:text-6xl md:text-7xl lg:text-[5.4rem] font-medium leading-[1.05] sm:leading-[0.95] tracking-tight text-ink">
                Kurtis worth
                <br />
                <span className="italic text-rani font-normal">keeping.</span>
              </h1>

              {/* Decorative divider */}
              <div className="my-5 sm:my-7 flex items-center justify-center sm:justify-start gap-4">
                <span className="h-px w-10 sm:w-16 bg-zari" />
                <span className="text-xs sm:text-sm text-zari">✦</span>
                <span className="h-px w-10 sm:w-16 bg-zari" />
              </div>

              <p className="mx-auto sm:mx-0 max-w-lg text-sm sm:text-base leading-relaxed text-ink/75 sm:leading-7">
                Hand-embroidered Chikankari, handloom ikat, and zari-trim weaves — finished by master artisan partners in small batches, shipped across India.
              </p>

              {/* CTA Buttons */}
              <div className="mt-6 sm:mt-9 flex flex-wrap items-center justify-center sm:justify-start gap-3.5">
                <Link
                  href="/shop"
                  className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-rani px-7 sm:px-9 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold tracking-wider text-ivory transition-all duration-300 hover:bg-rani-dark hover:shadow-lg active:scale-95 shadow-sm"
                >
                  <span>Explore Collection</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Link>

                <Link
                  href="/shop?category=festive"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/20 bg-white/70 px-6 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold tracking-wider text-ink transition-all duration-300 hover:border-rani hover:text-rani hover:bg-white active:scale-95 shadow-sm"
                >
                  <span>Festive Edit</span>
                </Link>
              </div>

              {/* Clean Luxury Feature Points */}
              <div className="mt-10 sm:mt-14 grid grid-cols-3 border-y border-ink/10 py-4 sm:py-5 text-center">
                <div className="px-2">
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-ink">
                    Artisan Made
                  </p>
                  <p className="mt-0.5 text-[9px] sm:text-[11px] text-ink/50">
                    Small Batch Weaves
                  </p>
                </div>

                <div className="border-x border-ink/10 px-2">
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-ink">
                    Pure Fabrics
                  </p>
                  <p className="mt-0.5 text-[9px] sm:text-[11px] text-ink/50">
                    Breathable Cotton
                  </p>
                </div>

                <div className="px-2">
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-ink">
                    Pan-India
                  </p>
                  <p className="mt-0.5 text-[9px] sm:text-[11px] text-ink/50">
                    Direct Delivery
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT HERO IMAGE - ARCHED ROYAL JHAROKHA SILHOUETTE */}
            {heroProduct && (
              <div className="relative flex justify-center lg:justify-end pb-8 sm:pb-4">
                {/* Concentric decorative gold rings */}
                <div className="pointer-events-none absolute -left-10 top-1/2 hidden h-[500px] w-[500px] -translate-y-1/2 rounded-full border border-zari/35 lg:block" />
                <div className="pointer-events-none absolute -left-4 top-1/2 hidden h-[390px] w-[390px] -translate-y-1/2 rounded-full border border-zari/20 lg:block" />

                {/* Arched image frame */}
                <Link
                  href={`/product/${heroProduct.slug}`}
                  className="group relative block w-full max-w-[360px] sm:max-w-[440px] lg:max-w-[490px]"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[42%_42%_10%_10%] bg-ink/5 shadow-[0_25px_60px_rgba(43,36,32,0.15)] border border-zari/30">
                    <img
                      src={
                        heroProduct.images?.[0] ||
                        "/products/placeholder.jpg"
                      }
                      alt={heroProduct.name}
                      className="sv-fade-up absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                    />

                    {/* Subtle warm luxury gradient */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-60" />
                  </div>

                  {/* Floating Luxury Price Card */}
                  <div className="absolute -bottom-4 -left-2 sm:-bottom-6 sm:-left-8 max-w-[270px] sm:max-w-[300px] rounded-2xl sm:rounded-3xl bg-white/95 backdrop-blur-xl border border-zari/30 px-4 py-3.5 sm:px-6 sm:py-5 shadow-[0_20px_45px_rgba(43,36,32,0.14)] transition-transform duration-500 group-hover:-translate-y-2">
                    <p className="font-display text-sm sm:text-base leading-snug text-ink truncate">
                      {heroProduct.name}
                    </p>

                    <div className="mt-2 sm:mt-3 flex items-center justify-between gap-3 sm:gap-5">
                      <span className="font-display text-base sm:text-xl text-rani font-medium">
                        ₹{heroPrice.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>

                      <span className="rounded-full bg-green-50 border border-green-200/80 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold text-green-800">
                        {heroProduct.totalStock > 0
                          ? `In Stock (${heroProduct.totalStock})`
                          : "Out of Stock"}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ================= DIVIDER ================= */}
      <div className="booti-divider" aria-hidden="true" />

      {/* ================= FEATURED COLLECTION ================= */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-8 md:px-10 lg:px-16 py-16 sm:py-24">
        <div className="sv-fade-up mb-10 sm:mb-14 text-center">
          <p className="mb-2 sm:mb-3 text-[10px] sm:text-xs tracking-[0.35em] text-rani font-semibold">
            CURATED FOR YOU
          </p>

          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium text-ink">
            Featured Collection
          </h2>

          <p className="mx-auto mt-3 sm:mt-4 max-w-lg text-xs sm:text-sm leading-5 sm:leading-6 text-ink/60">
            Thoughtfully selected pieces made to become part of your everyday
            wardrobe.
          </p>
        </div>

        {/* 2-column mobile grid with optimized gaps */}
        <div className="grid grid-cols-2 gap-3.5 sm:gap-x-5 sm:gap-y-12 md:grid-cols-4 md:gap-x-8">
          {featured.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                slug: product.slug,
                name: product.name,
                images:
                  product.images?.length > 0
                    ? product.images
                    : ["/products/placeholder.jpg"],
                basePrice: product.basePrice,
                originalPrice: product.originalPrice,
                fabric: product.fabric,
              }}
            />
          ))}
        </div>

        <div className="mt-12 sm:mt-16 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-3 border-b border-rani pb-2 text-xs sm:text-sm tracking-widest text-rani transition-all duration-300 hover:gap-5"
          >
            VIEW ALL COLLECTION
            <span>→</span>
          </Link>
        </div>
      </section>
    </>
  );
}