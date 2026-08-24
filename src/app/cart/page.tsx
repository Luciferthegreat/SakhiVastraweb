"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/lib/cart-store";

function formatInr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCartStore();
  const total = subtotal();

  if (items.length === 0) {
    return (
      <>
        <style jsx>{`
          @keyframes cartFadeUp {
            from {
              opacity: 0;
              transform: translateY(24px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .cart-empty {
            animation: cartFadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
          }

          .cart-empty-button {
            transition:
              transform 0.3s ease,
              box-shadow 0.3s ease,
              background-color 0.3s ease;
          }

          .cart-empty-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(43, 36, 32, 0.12);
          }
        `}</style>

        <section className="max-w-2xl mx-auto px-6 py-24 text-center cart-empty">
          <h1 className="font-display text-3xl text-ink mb-4">
            Your cart is empty
          </h1>

          <p className="text-ink/60 mb-8">
            Find something worth keeping.
          </p>

          <Link
            href="/shop"
            className="cart-empty-button inline-block font-body text-sm tracking-widest px-8 py-4 bg-rani text-ivory rounded-full hover:bg-rani-dark"
          >
            Shop The Collection
          </Link>
        </section>
      </>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes cartPageIn {
          from {
            opacity: 0;
            transform: translateY(28px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes cartItemIn {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes cartButtonIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .cart-page {
          animation: cartPageIn 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .cart-item {
          opacity: 0;
          animation: cartItemIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: var(--delay);
        }

        .cart-product-image {
          transition:
            transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.5s ease;
        }

        .cart-product-image:hover {
          transform: scale(1.025);
          box-shadow: 0 10px 25px rgba(43, 36, 32, 0.08);
        }

        .quantity-input {
          transition:
            border-color 0.25s ease,
            box-shadow 0.25s ease;
        }

        .quantity-input:focus {
          outline: none;
          border-color: #718238;
          box-shadow: 0 0 0 3px rgba(113, 130, 56, 0.1);
        }

        .remove-button {
          transition:
            color 0.25s ease,
            transform 0.25s ease;
        }

        .remove-button:hover {
          transform: translateX(2px);
        }

        .checkout-button {
          opacity: 0;
          animation: cartButtonIn 0.6s 0.45s
            cubic-bezier(0.22, 1, 0.36, 1) forwards;
          transition:
            transform 0.3s ease,
            box-shadow 0.3s ease,
            background-color 0.3s ease;
        }

        .checkout-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(43, 36, 32, 0.14);
        }

        @media (prefers-reduced-motion: reduce) {
          .cart-page,
          .cart-item,
          .checkout-button {
            animation: none;
            opacity: 1;
            transform: none;
          }

          .cart-product-image,
          .remove-button,
          .checkout-button {
            transition: none;
          }
        }
      `}</style>

      <section className="max-w-4xl mx-auto px-6 py-16 cart-page">
        {/* Heading */}
        <div className="mb-10">
          <p className="font-body text-[10px] md:text-xs tracking-[0.3em] uppercase text-rani mb-2">
            Your Selection
          </p>

          <h1 className="font-display text-4xl text-ink">
            Your Cart
          </h1>
        </div>

        {/* Cart Items */}
        <ul className="divide-y divide-ink/10">
          {items.map((item, index) => (
            <li
              key={item.variantId}
              className="cart-item flex items-center gap-5 py-6"
              style={
                {
                  "--delay": `${index * 100}ms`,
                } as React.CSSProperties
              }
            >
              {/* Product Image */}
              <div className="cart-product-image relative w-20 h-24 bg-ink/5 rounded-xl overflow-hidden shrink-0">
                <Image
                  src={item.image}
                  alt={item.productName}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <p className="font-display text-lg text-ink truncate">
                  {item.productName}
                </p>

                <p className="text-sm text-ink/50 mt-1">
                  Size {item.size}
                </p>

                <p className="text-sm text-rani mt-2 font-medium">
                  {formatInr(item.unitPrice)}
                </p>
              </div>

              {/* Quantity + Remove */}
              <div className="flex items-center gap-2">
                <label
                  className="sr-only"
                  htmlFor={`qty-${item.variantId}`}
                >
                  Quantity for {item.productName}
                </label>

                <input
                  id={`qty-${item.variantId}`}
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) =>
                    updateQuantity(
                      item.variantId,
                      Number(e.target.value)
                    )
                  }
                  className="quantity-input w-16 border border-ink/20 rounded-lg px-2 py-2 text-center bg-transparent"
                />

                <button
                  type="button"
                  onClick={() => removeItem(item.variantId)}
                  className="remove-button text-sm text-ink/40 hover:text-rani underline ml-2"
                  aria-label={`Remove ${item.productName} from cart`}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>

        {/* Subtotal */}
        <div className="mt-10 border-t border-ink/10 pt-6">
          <div className="flex items-center justify-between">
            <span className="font-display text-xl text-ink">
              Subtotal
            </span>

            <span className="font-display text-xl text-ink">
              {formatInr(total)}
            </span>
          </div>

          <p className="text-xs text-ink/50 mt-2">
            Shipping calculated at checkout.
          </p>
        </div>

        {/* Checkout */}
        <Link
          href="/checkout"
          className="checkout-button mt-8 block text-center font-body text-sm tracking-widest px-8 py-4 bg-rani text-ivory rounded-full hover:bg-rani-dark"
        >
          Proceed to Checkout
          <span className="ml-2">→</span>
        </Link>
      </section>
    </>
  );
}