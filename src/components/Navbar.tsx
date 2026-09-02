"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/cart-store";

const links = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/shop?category=festive", label: "Festive Edit" },
  { href: "/shop?category=everyday", label: "Everyday Weave" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const itemCount = useCartStore((s) =>
    s.items.reduce((n, i) => n + i.quantity, 0)
  );

  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    async function checkLogin() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        setLoggedIn(response.ok);
      } catch {
        setLoggedIn(false);
      }
    }

    checkLogin();
  }, [pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-ivory/95 backdrop-blur-md">
      <nav className="mx-auto flex h-[68px] sm:h-[82px] w-full max-w-[1600px] items-center justify-between px-4 sm:px-8 lg:px-10 xl:px-14">

        {/* ================= LEFT: MOBILE HAMBURGER + LOGO ================= */}
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 text-ink/80 md:hidden transition-colors hover:bg-rani/5 hover:text-rani"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>

          {/* ================= LOGO ================= */}
          <Link
            href="/"
            className="group flex items-center"
            aria-label="SakhiVastra Home"
          >
            <img
              src="/logo.png"
              alt="SakhiVastra"
              className="h-[44px] sm:h-[58px] w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </Link>
        </div>

        {/* ================= DESKTOP NAVIGATION ================= */}
        <div className="hidden items-center gap-8 md:flex lg:gap-11">
          {links.map((link) => {
            const linkPath = link.href.split("?")[0];
            const isActive =
              linkPath === "/"
                ? pathname === "/"
                : pathname === linkPath;

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative py-2 text-[12px] font-medium uppercase tracking-[0.16em] transition-colors duration-300 ${
                  isActive
                    ? "text-rani"
                    : "text-ink/70 hover:text-rani"
                }`}
              >
                {link.label}

                <span
                  className={`absolute bottom-0 left-1/2 h-[1.5px] -translate-x-1/2 bg-zari transition-all duration-300 ${
                    isActive ? "w-full" : "w-0"
                  }`}
                />
              </Link>
            );
          })}
        </div>

        {/* ================= LOGIN / PROFILE + CART ================= */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* LOGIN / PROFILE */}
          {loggedIn ? (
            <Link
              href="/profile"
              aria-label="Profile"
              className="group flex items-center gap-2 rounded-full border border-ink/15 px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-300 hover:border-rani/50 hover:bg-rani/5"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-ink/75 transition-colors duration-300 group-hover:text-rani"
              >
                <circle
                  cx="12"
                  cy="8"
                  r="3.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <path
                  d="M5 20C5.8 16.7 8.2 14.5 12 14.5C15.8 14.5 18.2 16.7 19 20"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>

              <span className="hidden sm:inline text-[11px] font-medium uppercase tracking-[0.16em] text-ink/80 transition-colors duration-300 group-hover:text-rani">
                Profile
              </span>
            </Link>
          ) : (
            <Link
              href={`/login?redirect=${encodeURIComponent(pathname)}`}
              aria-label="Login"
              className="group flex items-center gap-2 rounded-full border border-ink/15 px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-300 hover:border-rani/50 hover:bg-rani/5"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-ink/75 transition-colors duration-300 group-hover:text-rani"
              >
                <circle
                  cx="12"
                  cy="8"
                  r="3.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <path
                  d="M5 20C5.8 16.7 8.2 14.5 12 14.5C15.8 14.5 18.2 16.7 19 20"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>

              <span className="hidden sm:inline text-[11px] font-medium uppercase tracking-[0.16em] text-ink/80 transition-colors duration-300 group-hover:text-rani">
                Login
              </span>
            </Link>
          )}

          {/* ================= CART ================= */}
          <Link
            href="/cart"
            aria-label={`Cart, ${itemCount} item${
              itemCount === 1 ? "" : "s"
            }`}
            className="group relative flex items-center gap-2 rounded-full border border-ink/15 px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-300 hover:border-rani/50 hover:bg-rani/5"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-ink/75 transition-colors duration-300 group-hover:text-rani"
            >
              <path
                d="M6.5 8.5H17.5L19 21H5L6.5 8.5Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <path
                d="M9 9V6.5C9 4.84 10.34 3.5 12 3.5C13.66 3.5 15 4.84 15 6.5V9"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>

            <span className="hidden sm:inline text-[11px] font-medium uppercase tracking-[0.16em] text-ink/80 transition-colors duration-300 group-hover:text-rani">
              Cart
            </span>

            {itemCount > 0 && (
              <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rani px-1 text-[9px] font-medium text-ivory">
                {itemCount}
              </span>
            )}
          </Link>

        </div>
      </nav>

      {/* Heritage divider */}
      <div className="booti-divider" aria-hidden="true" />

      {/* ================= MOBILE NAVIGATION DRAWER ================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[69px] z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-[69px] bg-ink/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative z-10 w-4/5 max-w-sm h-full bg-ivory border-r border-ink/10 shadow-2xl flex flex-col justify-between p-6 overflow-y-auto">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-rani font-medium mb-4">
                Navigation
              </p>

              <div className="flex flex-col space-y-3">
                {links.map((link) => {
                  const linkPath = link.href.split("?")[0];
                  const isActive =
                    linkPath === "/"
                      ? pathname === "/"
                      : pathname === linkPath;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-medium tracking-wider transition-colors ${
                        isActive
                          ? "bg-rani/10 text-rani font-semibold"
                          : "text-ink/80 hover:bg-ink/5 hover:text-rani"
                      }`}
                    >
                      <span>{link.label}</span>
                      <span className="text-xs text-ink/30">→</span>
                    </Link>
                  );
                })}

                <Link
                  href="/track-order"
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-medium tracking-wider text-ink/80 hover:bg-ink/5 hover:text-rani"
                >
                  <span>Track Order</span>
                  <span className="text-xs text-ink/30">→</span>
                </Link>
              </div>

              {/* Decorative divider */}
              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-ink/10" />
                <span className="text-xs text-zari">✦</span>
                <span className="h-px flex-1 bg-ink/10" />
              </div>

              {/* Quick links & support */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.3em] text-ink/50 font-medium">
                  Direct Support
                </p>

                <a
                  href="https://wa.me/917383744152?text=Hello%20SakhiVastra,%20I%20have%20an%20inquiry"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 py-2 px-3 rounded-xl text-xs text-ink/80 bg-green-50 text-green-800 border border-green-200/60"
                >
                  <span>💬</span>
                  <span>WhatsApp Concierge</span>
                </a>

                <a
                  href="tel:+917383744152"
                  className="flex items-center gap-2.5 py-2 px-3 rounded-xl text-xs text-ink/70 hover:text-rani"
                >
                  <span>📞</span>
                  <span>+91 73837 44152</span>
                </a>
              </div>
            </div>

            {/* Bottom account info */}
            <div className="pt-6 border-t border-ink/10">
              {loggedIn ? (
                <Link
                  href="/profile"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-rani text-ivory text-xs font-medium tracking-wider"
                >
                  View Profile
                </Link>
              ) : (
                <Link
                  href={`/login?redirect=${encodeURIComponent(pathname)}`}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-rani text-ivory text-xs font-medium tracking-wider"
                >
                  Login / Register
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}