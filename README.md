# SakhiVastra — Full-Stack E-commerce

Next.js 14 (App Router) + Prisma/Postgres + Razorpay + Shiprocket.

## What's included

- **Catalog:** products, variants (size/stock), categories — seeded with 3 sample kurtis
- **Cart:** client-side, persisted (zustand)
- **Checkout:** address form → server re-prices from the DB → Razorpay order → Checkout.js popup
- **Payment verification:** signature-verified server-side (never trusts the client "success" event)
- **Shipping:** on verified payment, an order is auto-created in Shiprocket with the customer's
  address and line items; a tracking endpoint is included for order status pages
- **Design:** a from-scratch visual identity (rani-pink/zari-gold/peacock palette, Fraunces +
  Work Sans type, a woven "booti-divider" motif as the signature element) — not a template

## What's NOT included (by design — needs your real accounts)

- Actual product photography — placeholder image paths are in `prisma/seed.ts`
- A hosted Postgres instance — bring your own (Neon/Supabase/Railway all have free tiers)
- Live Razorpay/Shiprocket credentials — you must create these accounts yourself
- Order emails / SMS notifications — hook these into `verify/route.ts` once you pick a provider
- Refunds, COD, and multi-courier rate comparison at checkout (there's a
  `checkShiprocketServiceability` helper in `lib/shiprocket.ts` ready to wire in)
- Auth / customer accounts (currently guest checkout only)

## Setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, Razorpay keys, Shiprocket login
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Visit `http://localhost:3000`.

### Razorpay

1. Sign up at https://razorpay.com, complete KYC (required before you can accept live payments —
   test mode works immediately).
2. Dashboard → Settings → API Keys → generate a Key ID + Secret → put them in `.env`.
3. Test mode uses card `4111 1111 1111 1111`, any future expiry, any CVV.

### Shiprocket

1. Sign up at https://shiprocket.in.
2. Settings → Pickup Addresses → add your warehouse/store address and note its exact **nickname**
   (goes in `SHIPROCKET_PICKUP_LOCATION_NAME`).
3. Use your normal login email/password in `.env` — Shiprocket's API auth is login-based, not a
   separate API key.
4. Orders appear automatically in Shiprocket → Orders once a payment is verified. From there you
   assign a courier and generate the AWB/label as you normally would (or automate that step too —
   see `lib/shiprocket.ts` for the request pattern to extend).

### Going live

- Swap Razorpay test keys for live keys once KYC is approved.
- Point `DATABASE_URL` at a production Postgres instance and re-run `prisma migrate deploy`.
- Deploy to Vercel (or any Node host) — set all `.env` values as environment variables there.
- Replace placeholder product images with real photography and update `prisma/seed.ts` or manage
  products via `npx prisma studio`.

## Project structure

```
src/
  app/
    page.tsx                 Home
    shop/page.tsx             Catalog + category filter
    product/[slug]/page.tsx   Product detail
    cart/page.tsx             Cart
    checkout/page.tsx         Address + Razorpay checkout
    order-confirmation/[orderId]/page.tsx
    api/
      checkout/create-order/  Creates DB order + Razorpay order
      checkout/verify/        Verifies payment, decrements stock, creates Shiprocket shipment
      shiprocket/track/[awb]/ Tracking lookup
  components/                 Navbar, Footer, ProductCard, AddToCartForm
  lib/                        db.ts, razorpay.ts, shiprocket.ts, cart-store.ts
prisma/
  schema.prisma               Product, Variant, Order, Address, etc.
  seed.ts                     Sample catalog data
```
