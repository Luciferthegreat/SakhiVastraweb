"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/cart-store";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/shop?category=festive", label: "Festive Edit" },
  { href: "/shop?category=everyday", label: "Everyday Weave" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const itemCount = useCartStore((s) =>
    s.items.reduce((n, i) => n + i.quantity, 0)
  );

  // Scroll detection for dynamic shadow and blur
  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 15);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check login state
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

  // Close mobile drawer on route change
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
    <>
      {/* ================= TOP STICKY HEADER ================= */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          isScrolled
            ? "bg-[#F8F5EA]/95 backdrop-blur-xl border-b border-ink/10 shadow-[0_4px_25px_rgba(48,53,31,0.08)]"
            : "bg-[#F8F5EA]/90 backdrop-blur-md border-b border-ink/10"
        }`}
      >
        <nav className="mx-auto flex h-[62px] sm:h-[80px] w-full max-w-[1600px] items-center justify-between px-4 sm:px-8 lg:px-12">
          {/* ================= LEFT: MOBILE HAMBURGER BUTTON ================= */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 bg-white/60 text-ink shadow-sm transition-all duration-200 active:scale-95 hover:border-rani hover:text-rani"
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M4 6.5h16M4 12h16M4 17.5h16"
                />
              </svg>
            </button>
          </div>

          {/* ================= LOGO ================= */}
          <Link
            href="/"
            className="group flex items-center transition-transform duration-300 hover:scale-[1.02]"
            aria-label="SakhiVastra Home"
          >
            <img
              src="/logo.png"
              alt="SakhiVastra"
              className="h-[40px] sm:h-[54px] w-auto object-contain"
            />
          </Link>

          {/* ================= DESKTOP NAVIGATION ================= */}
          <div className="hidden items-center gap-8 md:flex lg:gap-11">
            {navLinks.map((link) => {
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
                      ? "text-rani font-semibold"
                      : "text-ink/75 hover:text-rani"
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute bottom-0 left-1/2 h-[2px] -translate-x-1/2 bg-zari transition-all duration-300 ${
                      isActive ? "w-full" : "w-0"
                    }`}
                  />
                </Link>
              );
            })}
          </div>

          {/* ================= RIGHT: PROFILE + CART ================= */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* PROFILE (DESKTOP + TABLET) */}
            <Link
              href={
                loggedIn
                  ? "/profile"
                  : `/login?redirect=${encodeURIComponent(pathname)}`
              }
              aria-label={loggedIn ? "Profile" : "Login"}
              className="group hidden sm:flex items-center gap-2 rounded-full border border-ink/15 bg-white/50 px-3.5 py-2 text-ink/80 transition-all duration-300 hover:border-rani hover:bg-rani/5 hover:text-rani shadow-sm"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="transition-colors duration-300 group-hover:text-rani"
              >
                <circle
                  cx="12"
                  cy="8"
                  r="3.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M5 20C5.8 16.7 8.2 14.5 12 14.5C15.8 14.5 18.2 16.7 19 20"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>

              <span className="text-[11px] font-medium uppercase tracking-[0.14em]">
                {loggedIn ? "Profile" : "Login"}
              </span>
            </Link>

            {/* CART (ALWAYS VISIBLE WITH BADGE) */}
            <Link
              href="/cart"
              aria-label={`Cart, ${itemCount} items`}
              className="group relative flex items-center gap-2 rounded-full border border-ink/15 bg-white/60 px-3 py-2 sm:px-4 sm:py-2.5 text-ink transition-all duration-300 hover:border-rani hover:bg-rani/5 hover:text-rani shadow-sm active:scale-95"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="transition-colors duration-300 group-hover:text-rani"
              >
                <path
                  d="M6.5 8.5H17.5L19 21H5L6.5 8.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 9V6.5C9 4.84 10.34 3.5 12 3.5C13.66 3.5 15 4.84 15 6.5V9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>

              <span className="hidden md:inline text-[11px] font-medium uppercase tracking-[0.14em]">
                Cart
              </span>

              {itemCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rani px-1.5 text-[10px] font-bold text-ivory shadow-sm animate-pulse">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </nav>

        {/* Heritage booti divider */}
        <div className="booti-divider" aria-hidden="true" />
      </header>

      {/* ================= MOBILE SLIDE-OVER DRAWER ================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-ink/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="relative z-10 w-[85vw] max-w-[340px] h-full bg-[#F8F5EA] border-r border-ink/10 shadow-2xl flex flex-col justify-between p-5 overflow-y-auto animate-in slide-in-from-left duration-300">
            <div>
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between pb-4 border-b border-ink/10">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center"
                >
                  <img
                    src="/logo.png"
                    alt="SakhiVastra"
                    className="h-[36px] w-auto object-contain"
                  />
                </Link>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 bg-white/60 text-ink transition-colors hover:bg-rani/10 hover:text-rani"
                  aria-label="Close menu"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Navigation Links */}
              <div className="mt-5 space-y-1.5">
                <p className="text-[10px] uppercase tracking-[0.25em] text-rani font-bold px-3 mb-2">
                  Collections
                </p>

                {navLinks.map((link) => {
                  const linkPath = link.href.split("?")[0];
                  const isActive =
                    linkPath === "/"
                      ? pathname === "/"
                      : pathname === linkPath;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between py-3 px-3.5 rounded-2xl text-sm font-medium tracking-wide transition-all ${
                        isActive
                          ? "bg-rani text-ivory shadow-md font-semibold"
                          : "text-ink hover:bg-rani/5 hover:text-rani"
                      }`}
                    >
                      <span>{link.label}</span>
                      <span
                        className={`text-xs ${
                          isActive ? "text-ivory/80" : "text-ink/30"
                        }`}
                      >
                        →
                      </span>
                    </Link>
                  );
                })}

                <Link
                  href="/track-order"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-3 px-3.5 rounded-2xl text-sm font-medium tracking-wide text-ink hover:bg-rani/5 hover:text-rani transition-all"
                >
                  <span>Track Your Order</span>
                  <span className="text-xs text-ink/30">→</span>
                </Link>
              </div>

              {/* Decorative divider */}
              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-ink/10" />
                <span className="text-xs text-zari">✦</span>
                <span className="h-px flex-1 bg-ink/10" />
              </div>

              {/* Quick Concierge / Support Card */}
              <div className="rounded-2xl border border-green-200/80 bg-green-50/70 p-3.5 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-green-900">
                    WhatsApp Concierge
                  </p>
                </div>

                <p className="text-xs text-green-900/80 leading-relaxed">
                  Need sizing advice or order help? Chat directly with our
                  team.
                </p>

                <a
                  href="https://wa.me/917383744152?text=Hello%20SakhiVastra,%20I%20have%20an%20inquiry"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-green-600 text-white text-xs font-medium shadow-sm transition-all hover:bg-green-700 active:scale-95"
                >
                  <span>Chat on WhatsApp</span>
                  <span>↗</span>
                </a>
              </div>
            </div>

            {/* Bottom: Profile / Login Action */}
            <div className="pt-4 border-t border-ink/10 space-y-2">
              {loggedIn ? (
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-peacock text-ivory text-xs font-semibold uppercase tracking-wider shadow-md active:scale-95"
                >
                  My Profile & Orders
                </Link>
              ) : (
                <Link
                  href={`/login?redirect=${encodeURIComponent(pathname)}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-rani text-ivory text-xs font-semibold uppercase tracking-wider shadow-md active:scale-95"
                >
                  Login / Create Account
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MOBILE BOTTOM NAVIGATION BAR ================= */}
      {/* Pinned thumb-navigation bar on mobile screens */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F8F5EA]/95 backdrop-blur-xl border-t border-ink/10 shadow-[0_-4px_25px_rgba(48,53,31,0.08)] px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        aria-label="Mobile Bottom Navigation"
      >
        <div className="grid grid-cols-5 items-center justify-items-center">
          {/* 1. HOME */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 ${
              pathname === "/" ? "text-rani font-semibold" : "text-ink/60 hover:text-rani"
            }`}
          >
            <svg
              className="w-5 h-5 mb-0.5"
              fill={pathname === "/" ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.7}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-[10px] tracking-tight">Home</span>
          </Link>

          {/* 2. SHOP */}
          <Link
            href="/shop"
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 ${
              pathname === "/shop" && !pathname.includes("category=")
                ? "text-rani font-semibold"
                : "text-ink/60 hover:text-rani"
            }`}
          >
            <svg
              className="w-5 h-5 mb-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.7}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            <span className="text-[10px] tracking-tight">Shop</span>
          </Link>

          {/* 3. FESTIVE EDIT */}
          <Link
            href="/shop?category=festive"
            className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-ink/60 hover:text-rani transition-all duration-200"
          >
            <svg
              className="w-5 h-5 mb-0.5 text-zari"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l2.4 6.9 7.1.4-5.4 4.7 1.7 7-5.8-3.9-5.8 3.9 1.7-7-5.4-4.7 7.1-.4z" />
            </svg>
            <span className="text-[10px] tracking-tight text-zari-dark font-medium">Festive</span>
          </Link>

          {/* 4. CART */}
          <Link
            href="/cart"
            className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 ${
              pathname === "/cart" ? "text-rani font-semibold" : "text-ink/60 hover:text-rani"
            }`}
          >
            <div className="relative">
              <svg
                className="w-5 h-5 mb-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.7}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rani px-1 text-[8px] font-bold text-ivory shadow-sm">
                  {itemCount}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight">Bag</span>
          </Link>

          {/* 5. ACCOUNT */}
          <Link
            href={
              loggedIn
                ? "/profile"
                : `/login?redirect=${encodeURIComponent(pathname)}`
            }
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 ${
              pathname === "/profile" || pathname === "/login"
                ? "text-rani font-semibold"
                : "text-ink/60 hover:text-rani"
            }`}
          >
            <svg
              className="w-5 h-5 mb-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.7}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-[10px] tracking-tight">
              {loggedIn ? "Account" : "Login"}
            </span>
          </Link>
        </div>
      </nav>
    </>
  );
}