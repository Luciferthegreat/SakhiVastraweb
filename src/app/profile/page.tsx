"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (!response.ok) {
          window.location.href = "/login?redirect=/profile";
          return;
        }

        const data = await response.json();
        setUser(data.user);
      } catch {
        window.location.href = "/login?redirect=/profile";
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-82px)] bg-ivory px-6 py-20">
        <div className="mx-auto max-w-[900px] text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink/50">
            Loading profile...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-[calc(100vh-82px)] bg-ivory px-6 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1000px]">

        {/* HEADER */}
        <div className="mb-10">
          <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-rani">
            SakhiVastra
          </p>

          <h1 className="font-serif text-4xl text-ink sm:text-5xl">
            My Profile
          </h1>

          <p className="mt-3 text-sm text-ink/55">
            Manage your account and view your details.
          </p>
        </div>

        {/* PROFILE CARD */}
        <div className="grid overflow-hidden rounded-2xl border border-ink/10 bg-[#f8f4e8] shadow-[0_20px_60px_rgba(38,43,18,0.08)] md:grid-cols-[280px_1fr]">

          {/* LEFT */}
          <div className="flex min-h-[300px] flex-col justify-between bg-[#30371c] p-8 text-ivory sm:p-10">

            <div>
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-zari/50 text-3xl font-serif text-zari">
                {(user.name || user.email)
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <h2 className="font-serif text-2xl">
                {user.name || "Welcome"}
              </h2>

              <p className="mt-2 break-all text-xs text-ivory/55">
                {user.email}
              </p>
            </div>

            <div>
              <div className="mb-4 h-px w-14 bg-zari" />

              <p className="text-[10px] uppercase tracking-[0.25em] text-ivory/50">
                SakhiVastra Member
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="p-8 sm:p-10">

            <div className="mb-8">
              <p className="text-[10px] uppercase tracking-[0.25em] text-rani">
                Account Details
              </p>

              <h2 className="mt-2 font-serif text-2xl text-ink">
                Personal Information
              </h2>
            </div>

            <div className="space-y-6">

              {/* NAME */}
              <div className="border-b border-ink/10 pb-5">
                <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-ink/45">
                  Full Name
                </p>

                <p className="text-sm text-ink">
                  {user.name || "Not added"}
                </p>
              </div>

              {/* EMAIL */}
              <div className="border-b border-ink/10 pb-5">
                <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-ink/45">
                  Email Address
                </p>

                <p className="text-sm text-ink">
                  {user.email}
                </p>
              </div>

              {/* PHONE */}
              <div className="border-b border-ink/10 pb-5">
                <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-ink/45">
                  Phone Number
                </p>

                <p className="text-sm text-ink">
                  {user.phone || "Not added"}
                </p>
              </div>

            </div>

            {/* ACTIONS */}
            <div className="mt-8 flex flex-wrap gap-3">

              <Link
                href="/shop"
                className="rounded-full bg-[#68753a] px-6 py-3 text-[10px] font-medium uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-[#56632f]"
              >
                Continue Shopping
              </Link>

              <Link
                href="/cart"
                className="rounded-full border border-ink/15 px-6 py-3 text-[10px] font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:border-rani/50 hover:text-rani"
              >
                View Cart
              </Link>

            </div>

          </div>
        </div>

        {/* FUTURE SECTIONS */}
        <div className="mt-8 grid gap-5 md:grid-cols-2">

          <div className="rounded-2xl border border-ink/10 bg-[#f8f4e8] p-7">
            <p className="text-[10px] uppercase tracking-[0.2em] text-rani">
              Orders
            </p>

            <h3 className="mt-2 font-serif text-xl text-ink">
              My Orders
            </h3>

            <p className="mt-2 text-sm text-ink/50">
              Your order history will appear here.
            </p>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-[#f8f4e8] p-7">
            <p className="text-[10px] uppercase tracking-[0.2em] text-rani">
              Address
            </p>

            <h3 className="mt-2 font-serif text-xl text-ink">
              Saved Addresses
            </h3>

            <p className="mt-2 text-sm text-ink/50">
              Your saved delivery addresses will appear here.
            </p>
          </div>

        </div>

      </div>
    </main>
  );
}