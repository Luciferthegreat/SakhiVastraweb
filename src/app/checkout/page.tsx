"use client";

import { useState } from "react";
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

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handlePay() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error?._errors?.[0] || body.error || "Could not start checkout.");
      }

      const data = await res.json();

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "SakhiVastra",
        description: "Order payment",
        order_id: data.razorpayOrderId,
        prefill: { email: form.email, contact: form.phone, name: form.fullName },
        theme: { color: "#7A1F3D" },
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: data.orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          if (verifyRes.ok) {
            const result = await verifyRes.json();
            clear();
            router.push(`/order-confirmation/${result.orderId}`);
          } else {
            setError("Payment succeeded but verification failed. Contact support with your payment ID.");
          }
        },
        modal: {
          ondismiss: () => setSubmitting(false),
        },
      });

      rzp.open();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <section className="max-w-xl mx-auto px-6 py-24 text-center">
        <h1 className="font-display text-3xl text-ink mb-4">Nothing to check out</h1>
        <p className="text-ink/60">Your cart is empty.</p>
      </section>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <section className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-display text-4xl text-ink mb-10">Checkout</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handlePay();
          }}
          className="grid gap-5"
        >
          <div className="grid md:grid-cols-2 gap-5">
            <Field label="Email" type="email" value={form.email} onChange={(v) => update("email", v)} required />
            <Field label="Phone" type="tel" value={form.phone} onChange={(v) => update("phone", v)} required />
          </div>
          <Field label="Full Name" value={form.fullName} onChange={(v) => update("fullName", v)} required />
          <Field label="Address Line 1" value={form.line1} onChange={(v) => update("line1", v)} required />
          <Field label="Address Line 2 (optional)" value={form.line2} onChange={(v) => update("line2", v)} />
          <div className="grid md:grid-cols-3 gap-5">
            <Field label="City" value={form.city} onChange={(v) => update("city", v)} required />
            <Field label="State" value={form.state} onChange={(v) => update("state", v)} required />
            <Field label="Pincode" value={form.pincode} onChange={(v) => update("pincode", v)} required />
          </div>

            <div className="mt-6 border-t border-ink/10 pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink/60">Subtotal</span>
                <span className="text-sm text-ink">
                  {formatInr(subtotal())}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-ink/60">Shipping</span>
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
          

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 font-body text-sm tracking-widest px-8 py-4 bg-rani text-ivory rounded-full hover:bg-rani-dark transition-colors disabled:opacity-50"
          >
            {submitting ? "Processing…" : "Pay with Razorpay"}
          </button>
        </form>
      </section>
    </>
  );
}

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
      <span className="text-xs uppercase tracking-widest text-ink/50">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-ink/20 rounded px-3 py-2 focus:border-rani"
      />
    </label>
  );
}
