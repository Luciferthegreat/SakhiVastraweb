import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-ink text-ivory/90 mt-16 sm:mt-24">
      <div
        className="booti-divider booti-divider--dense text-zari"
        aria-hidden="true"
      />

      {/* Footer Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-10 lg:px-12 py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12">

          {/* Brand */}
          <div className="min-w-0">
            <Link href="/" className="inline-flex items-center">
              <span className="font-display text-xl font-semibold">
                Sakhi<span className="text-zari">Vastra</span>
              </span>
            </Link>

            <p className="mt-3 sm:mt-4 text-xs sm:text-sm leading-5 sm:leading-6 text-ivory/70 max-w-xs">
              Hand-finished kurtis, made in small batches by artisan partners
              across India.
            </p>

            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://www.instagram.com/sakhii.vastra/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-zari hover:text-ivory transition-colors border border-zari/30 rounded-full px-3 py-1 bg-zari/10"
              >
                <span>Instagram</span>
                <span>↗</span>
              </a>

              <a
                href="https://wa.me/917383744152?text=Hello%20SakhiVastra"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-green-300 hover:text-white transition-colors border border-green-500/30 rounded-full px-3 py-1 bg-green-900/20"
              >
                <span>WhatsApp</span>
                <span>↗</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="min-w-0">
            <h3 className="font-body text-xs sm:text-sm uppercase tracking-widest text-zari mb-3 sm:mb-4 font-medium">
              Quick Links
            </h3>

            <ul className="space-y-2.5 text-xs sm:text-sm text-ivory/80">
              <li>
                <Link
                  href="/shop"
                  className="hover:text-zari transition-colors"
                >
                  Shop All Pieces
                </Link>
              </li>

              <li>
                <Link
                  href="/shop?category=festive"
                  className="hover:text-zari transition-colors"
                >
                  Festive Edit
                </Link>
              </li>

              <li>
                <Link
                  href="/shop?category=everyday"
                  className="hover:text-zari transition-colors"
                >
                  Everyday Weave
                </Link>
              </li>

              <li>
                <Link
                  href="/cart"
                  className="hover:text-zari transition-colors"
                >
                  Bag / Cart
                </Link>
              </li>

              <li>
                <Link
                  href="/track-order"
                  className="hover:text-zari transition-colors"
                >
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="min-w-0">
            <h3 className="font-body text-xs sm:text-sm uppercase tracking-widest text-zari mb-3 sm:mb-4 font-medium">
              Contact Us
            </h3>

            <ul className="space-y-2.5 text-xs sm:text-sm text-ivory/80">
              <li>
                <a
                  href="tel:+917383744152"
                  className="hover:text-zari transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5 text-zari flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>+91 73837 44152</span>
                </a>
              </li>

              <li>
                <a
                  href="tel:+916353478922"
                  className="hover:text-zari transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5 text-zari flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>+91 63534 78922</span>
                </a>
              </li>

              <li className="break-all">
                <a
                  href="mailto:sakhivastra.marketplace@gmail.com"
                  className="hover:text-zari transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5 text-zari flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>sakhivastra.marketplace@gmail.com</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Locations */}
          <div className="min-w-0">
            <h3 className="font-body text-xs sm:text-sm uppercase tracking-widest text-zari mb-3 sm:mb-4 font-medium">
              Our Locations
            </h3>

            <div className="space-y-4 text-xs sm:text-sm text-ivory/80 leading-5">
              <div>
                <p className="text-ivory font-medium mb-0.5">
                  Gujarat
                </p>
                <p className="text-ivory/60">
                  THE HELP Cyber Center,
                  <br />
                  Dholikuva, Gujarat 396570
                </p>
              </div>

              <div>
                <p className="text-ivory font-medium mb-0.5">
                  Ahmedabad
                </p>
                <p className="text-ivory/60">
                  35, Dhanlaxmi Soc., Hiravadi Road,
                  <br />
                  Mahavir Nagar, Saijpur Bogha,
                  <br />
                  Ahmedabad, Gujarat 382345
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t border-ivory/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="text-[11px] text-ivory/40">
            Ships pan-India via Shiprocket
          </p>

          <p className="text-[11px] text-ivory/40">
            © {new Date().getFullYear()} SakhiVastra. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}