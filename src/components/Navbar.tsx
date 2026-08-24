"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";

const links = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/shop?category=festive", label: "Festive Edit" },
  { href: "/shop?category=everyday", label: "Everyday Weave" },
];

export default function Navbar() {
  const pathname = usePathname();

  const itemCount = useCartStore((s) =>
    s.items.reduce((n, i) => n + i.quantity, 0)
  );

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-ivory/95 backdrop-blur-md">
      <nav className="mx-auto flex h-[82px] w-full max-w-[1600px] items-center justify-between px-6 sm:px-8 lg:px-10 xl:px-14">

        {/* ================= LOGO ================= */}
        <Link
          href="/"
          className="group flex items-center"
          aria-label="SakhiVastra Home"
        >
          <img
            src="/logo.png"
            alt="SakhiVastra"
            className="h-[58px] w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </Link>

        {/* ================= NAVIGATION ================= */}
        <div className="hidden md:flex items-center gap-9 lg:gap-11">
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

                {/* Elegant gold active line */}
                <span
                  className={`absolute bottom-0 left-1/2 h-[1.5px] -translate-x-1/2 bg-zari transition-all duration-300 ${
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            );
          })}
        </div>

        {/* ================= CART ================= */}
        <Link
          href="/cart"
          aria-label={`Cart, ${itemCount} item${
            itemCount === 1 ? "" : "s"
          }`}
          className="group relative flex items-center gap-2.5 rounded-full border border-ink/15 px-4 py-2.5 transition-all duration-300 hover:border-rani/50 hover:bg-rani/5"
        >
          {/* Shopping bag icon */}
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

          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink/80 transition-colors duration-300 group-hover:text-rani">
            Cart
          </span>

          {/* Count */}
          {itemCount > 0 && (
            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rani px-1 text-[9px] font-medium text-ivory">
              {itemCount}
            </span>
          )}
        </Link>
      </nav>

      {/* Heritage divider */}
      <div className="booti-divider" aria-hidden="true" />
    </header>
  );
}