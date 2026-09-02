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
      <section className="relative overflow-hidden">
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
                  ✽
                </span>
              </div>
            </div>
          </div>

          <div className="grid min-h-[calc(100vh-80px)] items-center gap-8 py-10 sm:py-14 md:gap-12 lg:grid-cols-[48%_52%] lg:gap-0 lg:py-16">
            {/* LEFT CONTENT */}
            <div className="relative z-10 max-w-xl">
              <p
                className="mb-3 sm:mb-5 text-xs sm:text-sm tracking-[0.35em] text-rani font-medium"
                style={{ fontVariant: "small-caps" }}
              >
                Grace of Tradition
              </p>

              <h1 className="sv-fade-up font-display text-4xl sm:text-6xl md:text-7xl lg:text-[5.8rem] font-medium leading-[1.05] sm:leading-[0.95] tracking-tight text-ink">
                Kurtis worth
                <br />
                <span className="italic text-rani">keeping.</span>
              </h1>

              {/* Decorative divider */}
              <div className="my-5 sm:my-8 flex items-center gap-4">
                <span className="h-px w-10 sm:w-14 bg-zari" />
                <span className="text-sm sm:text-lg text-zari">✦</span>
                <span className="h-px w-10 sm:w-14 bg-zari" />
              </div>

              <p className="max-w-lg text-sm sm:text-base leading-6 sm:leading-7 text-ink/70 md:text-lg">
                Hand-embroidered chikankari, handloom ikat, and zari-trim
                weaves — finished by artisan partners in small batches,
                shipped across India.
              </p>

              {heroProduct && (
                <div className="mt-6 sm:mt-8">
                  <Link
                    href={`/product/${heroProduct.slug}`}
                    className="group flex sm:inline-flex items-center justify-center gap-4 rounded-full bg-rani px-6 sm:px-7 py-3.5 sm:py-4 text-xs sm:text-sm font-medium tracking-wider text-ivory transition-all duration-500 hover:-translate-y-1 hover:bg-rani-dark hover:shadow-xl w-full sm:w-auto text-center"
                  >
                    <span>Discover {heroProduct.name}</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </Link>
                </div>
              )}

              {/* Feature points */}
              <div className="mt-8 sm:mt-12 grid max-w-xl grid-cols-3 border-y border-ink/10 py-4 sm:py-5 gap-1">
                <div className="px-1.5 sm:px-3 text-center first:pl-0">
                  <div className="mb-1 text-base sm:text-lg text-zari">♡</div>
                  <p className="text-[9px] sm:text-xs tracking-wider sm:tracking-widest text-ink/60 font-medium">
                    ARTISAN MADE
                  </p>
                </div>

                <div className="border-x border-ink/10 px-1.5 sm:px-3 text-center">
                  <div className="mb-1 text-base sm:text-lg text-zari">◇</div>
                  <p className="text-[9px] sm:text-xs tracking-wider sm:tracking-widest text-ink/60 font-medium">
                    NATURAL FABRICS
                  </p>
                </div>

                <div className="px-1.5 sm:px-3 text-center">
                  <div className="mb-1 text-base sm:text-lg text-zari">♧</div>
                  <p className="text-[9px] sm:text-xs tracking-wider sm:tracking-widest text-ink/60 font-medium">
                    PAN INDIA DELIVERY
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT HERO IMAGE */}
            {heroProduct && (
              <div className="relative flex justify-center lg:justify-end pb-8 sm:pb-0">
                {/* Large decorative ring */}
                <div className="pointer-events-none absolute -left-8 top-1/2 hidden h-[470px] w-[470px] -translate-y-1/2 rounded-full border border-zari/40 lg:block" />

                {/* Image frame */}
                <Link
                  href={`/product/${heroProduct.slug}`}
                  className="group relative block w-full max-w-[480px] lg:max-w-[540px]"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] sm:rounded-[45%_45%_8%_8%] bg-ink/5 shadow-xl sm:shadow-2xl">
                    <img
                      src={
                        heroProduct.images?.[0] ||
                        "/products/placeholder.jpg"
                      }
                      alt={heroProduct.name}
                      className="sv-fade-up absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                    />

                    {/* Image gradient */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-70" />

                    {/* Image text */}
                    <div className="absolute bottom-5 sm:bottom-7 left-5 sm:left-7 right-5 sm:right-7 text-ivory">
                      <p className="mb-1 text-[9px] sm:text-[10px] tracking-[0.3em] text-ivory/80 font-medium">
                        FEATURED PIECE
                      </p>
                    </div>
                  </div>

                  {/* Floating price card */}
                  <div className="absolute -bottom-4 left-3 right-3 sm:right-auto sm:max-w-[270px] rounded-2xl sm:rounded-3xl bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3.5 sm:py-5 shadow-[0_15px_35px_rgba(43,36,32,0.12)] transition-transform duration-500 group-hover:-translate-y-2 sm:-left-8">
                    <p className="font-display text-sm sm:text-lg leading-tight text-ink truncate">
                      {heroProduct.name}
                    </p>

                    <div className="mt-2 sm:mt-3 flex items-center justify-between gap-3 sm:gap-5">
                      <span className="font-display text-base sm:text-xl text-rani font-medium">
                        ₹
                        {heroPrice.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>

                      <span className="rounded-full bg-green-50 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-medium text-green-700">
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