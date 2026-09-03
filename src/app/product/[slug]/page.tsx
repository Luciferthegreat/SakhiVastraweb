import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import AddToCartForm from "@/components/AddToCartForm";
import ProductGallery from "@/components/ProductGallery";
import ProductCard from "@/components/ProductCard";

function formatInr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: { variants: true },
  });

  if (!product || !product.active) notFound();

  // Fetch similar / random products from the database (synced from sheet)
  const similarCategoryProducts = await prisma.product.findMany({
    where: {
      active: true,
      slug: { not: slug },
      ...(product.categoryId ? { categoryId: product.categoryId } : {}),
    },
    take: 8,
  });

  let recommendedProducts = [...similarCategoryProducts];

  // If fewer than 4 items from the same category, fetch other active products
  if (recommendedProducts.length < 4) {
    const remainingCount = 8 - recommendedProducts.length;
    const additionalProducts = await prisma.product.findMany({
      where: {
        active: true,
        slug: {
          notIn: [slug, ...recommendedProducts.map((p) => p.slug)],
        },
      },
      take: remainingCount,
    });
    recommendedProducts = [...recommendedProducts, ...additionalProducts];
  }

  // Shuffle and pick 4 random products for display
  const displaySimilar = recommendedProducts
    .sort(() => 0.5 - Math.random())
    .slice(0, 4);

  const images =
    product.images && product.images.length > 0
      ? product.images
      : ["/products/placeholder.jpg"];

  const primaryImage = images[0];

  const hasDiscount =
    !!product.originalPrice && product.originalPrice > product.basePrice;

  const discountPercent = hasDiscount
    ? Math.round(
        ((product.originalPrice! - product.basePrice) / product.originalPrice!) *
          100
      )
    : 0;

  const discountBadge = hasDiscount ? `${discountPercent}% OFF` : null;

  return (
    <div className="min-h-screen bg-ivory pb-28 sm:pb-16">
      {/* ================= BREADCRUMBS ================= */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 text-[11px] sm:text-xs tracking-wider text-ink/50 whitespace-nowrap">
          <Link href="/" className="hover:text-rani transition-colors">
            HOME
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-rani transition-colors">
            SHOP
          </Link>
          <span>/</span>
          <span className="text-ink truncate max-w-[180px] sm:max-w-xs">{product.name}</span>
        </div>
      </nav>

      {/* ================= MAIN PRODUCT SECTION ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 md:py-12">
        <div className="grid lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-14">
          {/* LEFT: MULTI-IMAGE GALLERY (7 cols on LG) */}
          <div className="lg:col-span-7">
            <ProductGallery
              images={images}
              productName={product.name}
              discountBadge={discountBadge}
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                images,
                basePrice: product.basePrice,
                originalPrice: product.originalPrice,
                fabric: product.fabric,
              }}
            />
          </div>

          {/* RIGHT: PRODUCT INFO & PURCHASE (5 cols on LG) */}
          <div className="lg:col-span-5 flex flex-col justify-start">
            {product.fabric && (
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-rani mb-1.5 sm:mb-2">
                {product.fabric}
              </p>
            )}

            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-medium text-ink leading-snug sm:leading-tight">
              {product.name}
            </h1>

            {/* Price section */}
            <div className="mt-3 sm:mt-5 flex items-baseline gap-3 flex-wrap">
              <span className="font-display text-2xl sm:text-3xl font-medium text-peacock">
                {formatInr(product.basePrice)}
              </span>

              {hasDiscount && (
                <>
                  <span className="text-base sm:text-lg text-ink/40 line-through">
                    {formatInr(product.originalPrice!)}
                  </span>
                  <span className="rounded-full bg-green-50 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-green-700 tracking-wide">
                    {discountPercent}% OFF
                  </span>
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-ink/50">Inclusive of all taxes</p>

            {/* Decorative divider */}
            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-ink/10" />
              <span className="text-xs text-zari">✦</span>
              <span className="h-px flex-1 bg-ink/10" />
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-ink/75 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Add to Cart form with Kurti-specific Size Chart */}
            <div className="mt-8">
              <AddToCartForm
                productName={product.name}
                slug={product.slug}
                image={primaryImage}
                variants={product.variants.map((v) => ({
                  id: v.id,
                  size: v.size,
                  stock: v.stock,
                  price: product.basePrice + v.priceDelta,
                  chest: v.chest,
                  shoulder: v.shoulder,
                  waist: v.waist,
                  length: v.length,
                  hip: v.hip,
                }))}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================= SIMILAR PRODUCTS SECTION ================= */}
      {displaySimilar.length > 0 && (
        <>
          <div className="booti-divider" aria-hidden="true" />

          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <div className="text-center mb-8 sm:mb-12">
              <p className="text-[10px] sm:text-xs tracking-[0.35em] uppercase text-rani font-semibold mb-2">
                CURATED FOR YOU
              </p>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-medium text-ink">
                Similar Kurtis You Might Like
              </h2>
              <div className="my-3 sm:my-4 flex items-center justify-center gap-3">
                <span className="h-px w-8 sm:w-12 bg-zari" />
                <span className="text-xs sm:text-sm text-zari">✦</span>
                <span className="h-px w-8 sm:w-12 bg-zari" />
              </div>
              <p className="mx-auto mt-2 max-w-lg text-xs sm:text-sm leading-5 text-ink/60">
                Discover more handcrafted artisan pieces designed for your everyday and festive grace.
              </p>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-2 gap-3.5 sm:gap-x-5 sm:gap-y-12 md:grid-cols-4 md:gap-x-8">
              {displaySimilar.map((item) => (
                <ProductCard
                  key={item.id}
                  product={{
                    slug: item.slug,
                    name: item.name,
                    images:
                      item.images && item.images.length > 0
                        ? item.images
                        : ["/products/placeholder.jpg"],
                    basePrice: item.basePrice,
                    originalPrice: item.originalPrice,
                    fabric: item.fabric,
                  }}
                />
              ))}
            </div>

            {/* Bottom link */}
            <div className="mt-12 sm:mt-16 text-center">
              <Link
                href="/shop"
                className="inline-flex items-center gap-3 border-b border-rani pb-1 text-xs sm:text-sm tracking-widest text-rani transition-all duration-300 hover:gap-5"
              >
                EXPLORE ALL COLLECTION
                <span>→</span>
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
