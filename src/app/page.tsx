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

        <div className="relative w-full px-6 sm:px-8 md:px-[6vw] lg:px-[7vw] xl:px-[8vw]">
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

          <div className="grid min-h-[calc(100vh-90px)] items-center gap-10 py-14 md:gap-12 lg:grid-cols-[45%_55%] lg:gap-0 lg:py-16">
            {/* LEFT CONTENT */}
            <div className="relative z-10 max-w-xl">
              <p
                className="mb-5 text-sm tracking-[0.35em] text-rani"
                style={{ fontVariant: "small-caps" }}
              >
                Grace of Tradition
              </p>

              <h1 className="sv-fade-up font-display text-6xl font-medium leading-[0.95] tracking-tight text-ink md:text-7xl lg:text-[6.2rem]">
                Kurtis worth
                <br />
                <span className="italic text-rani">keeping.</span>
              </h1>

              {/* Decorative divider */}
              <div className="my-8 flex items-center gap-4">
                <span className="h-px w-14 bg-zari" />
                <span className="text-lg text-zari">✦</span>
                <span className="h-px w-14 bg-zari" />
              </div>

              <p className="max-w-lg text-base leading-7 text-ink/65 md:text-lg">
                Hand-embroidered chikankari, handloom ikat, and zari-trim
                weaves — finished by artisan partners in small batches,
                shipped across India.
              </p>

              {heroProduct && (
                <Link
                  href={`/product/${heroProduct.slug}`}
                  className="group mt-8 inline-flex items-center gap-5 rounded-full bg-rani px-7 py-4 text-sm font-medium tracking-wide text-ivory transition-all duration-500 hover:-translate-y-1 hover:bg-rani-dark hover:shadow-xl"
                >
                  <span>Discover {heroProduct.name}</span>

                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              )}

              {/* Feature points */}
              <div className="mt-12 grid max-w-xl grid-cols-3 border-y border-ink/10 py-5">
                <div className="px-3 text-center first:pl-0">
                  <div className="mb-2 text-lg text-zari">♡</div>
                  <p className="text-[10px] tracking-widest text-ink/60 md:text-xs">
                    ARTISAN MADE
                  </p>
                </div>

                <div className="border-x border-ink/10 px-3 text-center">
                  <div className="mb-2 text-lg text-zari">◇</div>
                  <p className="text-[10px] tracking-widest text-ink/60 md:text-xs">
                    NATURAL FABRICS
                  </p>
                </div>

                <div className="px-3 text-center">
                  <div className="mb-2 text-lg text-zari">♧</div>
                  <p className="text-[10px] tracking-widest text-ink/60 md:text-xs">
                    PAN INDIA DELIVERY
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT HERO IMAGE */}
            {heroProduct && (
              <div className="relative flex justify-center lg:justify-end">
                {/* Large decorative ring */}
                <div className="pointer-events-none absolute -left-8 top-1/2 hidden h-[470px] w-[470px] -translate-y-1/2 rounded-full border border-zari/40 lg:block" />

                {/* Image frame */}
                <Link
                  href={`/product/${heroProduct.slug}`}
                  className="group relative block w-full max-w-[560px]"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[45%_45%_8%_8%] bg-ink/5 shadow-2xl">
                    <img
                      src={
                        heroProduct.images?.[0] ||
                        "/products/placeholder.jpg"
                      }
                      alt={heroProduct.name}
                      className="sv-fade-up absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                    />

                    {/* Image gradient */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-60" />

                    {/* Image text */}
                    <div className="absolute bottom-7 left-7 right-7 text-ivory">
                      <p className="mb-2 text-[10px] tracking-[0.3em] text-ivory/80">
                        FEATURED PIECE
                      </p>
                    </div>
                  </div>

                  {/* Floating price card */}
                  <div className="absolute -bottom-7 left-6 max-w-[270px] rounded-3xl bg-white px-6 py-5 shadow-[0_20px_50px_rgba(43,36,32,0.15)] transition-transform duration-500 group-hover:-translate-y-2 md:-left-12">
                    <p className="mt-2 font-display text-lg leading-tight text-ink">
                      {heroProduct.name}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-5">
                      <span className="font-display text-xl text-rani">
                        ₹
                        {heroPrice.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>

                      <span className="rounded-full bg-green-50 px-3 py-1 text-[10px] font-medium text-green-700">
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
      <section className="mx-auto max-w-[1400px] px-6 py-24 md:px-10 lg:px-16">
        <div className="sv-fade-up mb-14 text-center">
          <p className="mb-3 text-xs tracking-[0.35em] text-rani">
            CURATED FOR YOU
          </p>

          <h2 className="font-display text-4xl font-medium text-ink md:text-5xl">
            Featured Collection
          </h2>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-ink/55">
            Thoughtfully selected pieces made to become part of your everyday
            wardrobe.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-5 gap-y-14 md:grid-cols-4 md:gap-x-8">
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

        <div className="mt-16 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-3 border-b border-rani pb-2 text-sm tracking-widest text-rani transition-all duration-300 hover:gap-5"
          >
            VIEW ALL COLLECTION
            <span>→</span>
          </Link>
        </div>
      </section>
    </>
  );
}