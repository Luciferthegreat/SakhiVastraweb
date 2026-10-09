import { GeneratedCreative, CreativeAngleType } from "./types";

interface ProductInput {
  id: string;
  name: string;
  slug: string;
  fabric?: string | null;
  basePrice: number; // in paise (e.g. 39900 = ₹399)
  originalPrice?: number | null; // in paise
  images: string[];
  variants?: Array<{ size: string; stock: number }>;
}

export function generateCreativesForProduct(
  product: ProductInput,
  baseUrl = "https://www.sakhivastra.in"
): GeneratedCreative[] {
  const priceRupees = Math.round(product.basePrice / 100);
  const originalPriceRupees = product.originalPrice
    ? Math.round(product.originalPrice / 100)
    : Math.round(priceRupees * 1.75);
  const discountPct = Math.round(
    ((originalPriceRupees - priceRupees) / originalPriceRupees) * 100
  );

  const mainImage =
    product.images[0] ||
    "https://ik.imagekit.io/sakhivastra/Product/DKNJ-000034/2d5baaca-82b6-4f7c-ac4e-e8ed928dcfca.png";

  const fabricText = product.fabric || "Premium Breathable Cotton";
  const productUrl = `${baseUrl}/product/${product.slug}`;

  const creatives: GeneratedCreative[] = [];

  // 1. PRODUCT SHOWCASE
  creatives.push({
    angle: "PRODUCT_SHOWCASE",
    title: "Product Showcase",
    headline: `${product.name} | Grace & Everyday Comfort`,
    primaryText: `Step out in effortless grace with our ${product.name}. Tailored with precision from ${fabricText}, designed to flatter every silhouette with breathable all-day ease. Explore the latest drop from Sakhi Vastra.`,
    description: `₹${priceRupees} (Was ₹${originalPriceRupees}) • ${discountPct}% OFF • Free Shipping & COD Available across India.`,
    callToAction: "SHOP_NOW",
    imageUrl: mainImage,
    destinationUrl: productUrl,
  });

  // 2. BENEFIT FOCUS
  creatives.push({
    angle: "BENEFIT_FOCUS",
    title: "Benefits & Fabric Focus",
    headline: `Ultra-Soft ${fabricText} • Zero Color Bleed`,
    primaryText: `Say goodbye to stiff ethnic wear! The ${product.name} is woven from lightweight, skin-friendly fabric that keeps you cool from 9 AM meetings to evening family dinners. Hand-finished details, pre-shrunk, and easy to wash.`,
    description: `Direct from Surat's artisan looms • Small batch crafting • Sizes XS to 2XL available.`,
    callToAction: "SHOP_NOW",
    imageUrl: product.images[1] || mainImage,
    destinationUrl: productUrl,
  });

  // 3. STYLING & OUTFIT INSPIRATION
  creatives.push({
    angle: "STYLING_OUTFIT",
    title: "Styling & Occasion Inspiration",
    headline: `1 Kurti, 3 Chic Looks | Sakhi Vastra Lookbook`,
    primaryText: `How to style the ${product.name}:\n✨ Office Chic: Pair with crisp white palazzos & silver studs.\n✨ Casual Day Out: Wear with denim jeans & comfortable juttis.\n✨ Festive Touch: Layer with an organza dupatta & statement jhumkas.\nElevate your everyday ethnic wardrobe effortlessly!`,
    description: `Versatile Ethnic Wardrobe Essential • Instant Wardrobe Upgrade at ₹${priceRupees}.`,
    callToAction: "SHOP_NOW",
    imageUrl: product.images[2] || mainImage,
    destinationUrl: productUrl,
  });

  // 4. PRICE & VALUE OFFER
  creatives.push({
    angle: "PRICE_OFFER",
    title: "Price & Value Promotion",
    headline: `Just ₹${priceRupees}! Premium Indian Kurtis Under ₹500`,
    primaryText: `Why pay designer prices when you can get boutique artisan quality for just ₹${priceRupees}? Grab ${product.name} at a special introductory price of ₹${priceRupees} (Regular ₹${originalPriceRupees}). Limited stock per size!`,
    description: `Flat ${discountPct}% Discount • COD Available • Easy 7-Day Exchanges across India.`,
    callToAction: "ORDER_NOW",
    imageUrl: product.images[3] || mainImage,
    destinationUrl: productUrl,
  });

  // 5. SHORT-FORM REEL CONCEPT
  creatives.push({
    angle: "REEL_CONCEPT",
    title: "Short-Form Reel / Story Hook",
    headline: `POV: You found the comfiest Indian kurti under ₹500 😍`,
    primaryText: `Hook: "Stop scrolling if you hate uncomfortable ethnic clothes!"\n\nVisual Flow:\n0-2s: Close-up fabric touch & breathability test.\n3-5s: Quick full-body spin showing square neck and flattering fall.\n6-8s: Styling transition from bare kurti to complete accessories.\n9-12s: Price reveal banner (₹${priceRupees}) & "Link in Bio / Tap Shop Now" CTA.`,
    description: `Trending Audio Concept: Acoustic Hindi/Indie beats • 9:16 Vertical Video Format.`,
    callToAction: "SHOP_NOW",
    imageUrl: mainImage,
    destinationUrl: productUrl,
    hookConcept: "Stop scrolling if you hate scratchy, uncomfortable kurtis! Wore this 10 hours straight and here is why I'm obsessed.",
  });

  // 6. CAROUSEL CONCEPT
  creatives.push({
    angle: "CAROUSEL",
    title: "Multi-Card Carousel Set",
    headline: `Explore the Sakhi Vastra Cotton Collection from ₹399`,
    primaryText: `Swipe through our best-selling floral and festive kurtis. Each piece is crafted in breathable cotton, hand-finished seams, and tailored sizes. Swipe to find your favorite color & pattern! 👉`,
    description: `Card 1: ${product.name} (₹${priceRupees}) • Card 2: Floral Square Neck Editions • Card 3: Navratri Special Short Kurtis.`,
    callToAction: "SHOP_NOW",
    imageUrl: mainImage,
    destinationUrl: `${baseUrl}/shop`,
    carouselItems: product.images.slice(0, 4).map((img, i) => ({
      name: `${product.name} - Angle ${i + 1}`,
      imageUrl: img,
      price: priceRupees,
      url: productUrl,
    })),
  });

  return creatives;
}
