"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function formatInr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCartStore();
  const router = useRouter();

  const [loadingUser, setLoadingUser] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: "",
    phone: "",
    fullName: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  });

  // ================================
  // LOAD LOGGED-IN USER
  // ================================

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          setLoadingUser(false);
          return;
        }

        const data = await res.json();

        if (data.user) {
          setForm((current) => ({
            ...current,
            email: data.user.email || "",
            phone: data.user.phone || "",
            fullName: data.user.name || "",
          }));
        }
      } catch (error) {
        console.error("Could not load user:", error);
      } finally {
        setLoadingUser(false);
      }
    }

    loadUser();
  }, []);

  function update<K extends keyof typeof form>(
    key: K,
    value: string
  ) {
    setForm((f) => ({
      ...f,
      [key]: value,
    }));
  }

  async function handlePay() {
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: form.email,
          phone: form.phone,
          address: {
            fullName: form.fullName,
            line1: form.line1,
            line2: form.line2 || undefined,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
          },
          items: items.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
          })),
        }),
      });

      if (!res.ok) {
        const body = await res.json();

        throw new Error(
          body.error?._errors?.[0] ||
            body.error ||
            "Could not start checkout."
        );
      }

      const data = await res.json();

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "SakhiVastra",
        description: "Order payment",
        order_id: data.razorpayOrderId,

        prefill: {
          email: form.email,
          contact: form.phone,
          name: form.fullName,
        },

        theme: {
          color: "#7A1F3D",
        },

        handler: async (response: any) => {
          const verifyRes = await fetch(
            "/api/checkout/verify",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                orderId: data.orderId,
                razorpay_order_id:
                  response.razorpay_order_id,
                razorpay_payment_id:
                  response.razorpay_payment_id,
                razorpay_signature:
                  response.razorpay_signature,
              }),
            }
          );

          if (verifyRes.ok) {
            const result = await verifyRes.json();

            clear();

            router.push(
              `/order-confirmation/${result.orderId}`
            );
          } else {
            setError(
              "Payment succeeded but verification failed. Contact support with your payment ID."
            );

            setSubmitting(false);
          }
        },

        modal: {
          ondismiss: () => {
            setSubmitting(false);
          },
        },
      });

      rzp.open();
    } catch (err: any) {
      setError(
        err.message ||
          "Something went wrong. Please try again."
      );

      setSubmitting(false);
    }
  }

  // ================================
  // EMPTY CART
  // ================================

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="mb-4 font-display text-3xl text-ink">
          Nothing to check out
        </h1>

        <p className="text-ink/60">
          Your cart is empty.
        </p>
      </section>
    );
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-10 font-display text-4xl text-ink">
          Checkout
        </h1>

        {/* LOGGED-IN USER MESSAGE */}

        {!loadingUser && form.email && (
          <div className="mb-8 rounded-xl border border-[#68753a]/20 bg-[#68753a]/5 px-5 py-4">
            <p className="text-xs uppercase tracking-widest text-[#68753a]">
              Welcome back
            </p>

            <p className="mt-1 text-sm text-ink/70">
              Your saved account details have been filled in.
            </p>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handlePay();
          }}
          className="grid gap-5"
        >
          {/* EMAIL + PHONE */}

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => update("email", v)}
              required
            />

            <Field
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={(v) => update("phone", v)}
              required
            />
          </div>

          {/* NAME */}

          <Field
            label="Full Name"
            value={form.fullName}
            onChange={(v) => update("fullName", v)}
            required
          />

          {/* ADDRESS */}

          <Field
            label="Address Line 1"
            value={form.line1}
            onChange={(v) => update("line1", v)}
            required
          />

          <Field
            label="Address Line 2 (optional)"
            value={form.line2}
            onChange={(v) => update("line2", v)}
          />

          {/* CITY STATE PINCODE */}

          <div className="grid gap-5 md:grid-cols-3">
            <Field
              label="City"
              value={form.city}
              onChange={(v) => update("city", v)}
              required
            />

            <Field
              label="State"
              value={form.state}
              onChange={(v) => update("state", v)}
              required
            />

            <Field
              label="Pincode"
              value={form.pincode}
              onChange={(v) => update("pincode", v)}
              required
            />
          </div>

          {/* ERROR */}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* ORDER SUMMARY */}

          <div className="mt-6 space-y-3 border-t border-ink/10 pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink/60">
                Subtotal
              </span>

              <span className="text-sm text-ink">
                {formatInr(subtotal())}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-ink/60">
                Shipping
              </span>

              <span className="text-sm text-ink">
                ₹79
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-ink/10 pt-4">
              <span className="font-display text-xl text-ink">
                Total
              </span>

              <span className="font-display text-xl text-rani">
                {formatInr(subtotal() + 7900)}
              </span>
            </div>
          </div>

          {/* PAY BUTTON */}

          <button
            type="submit"
            disabled={submitting || loadingUser}
            className="mt-4 rounded-full bg-rani px-8 py-4 font-body text-sm tracking-widest text-ivory transition-colors hover:bg-rani-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Processing…"
              : "Pay with Razorpay"}
          </button>
        </form>
      </section>
    </>
  );
}

// =================================
// FIELD COMPONENT
// =================================

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-ink/50">
        {label}
      </span>

      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded border border-ink/20 px-3 py-2 focus:border-rani focus:outline-none"
      />
    </label>
  );
}