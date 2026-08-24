import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-ink text-ivory/90 mt-24">
      <div
        className="booti-divider booti-divider--dense text-zari"
        aria-hidden="true"
      />

      {/* Footer Main */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">

          {/* Brand */}
          <div className="min-w-0">
            <Link href="/" className="inline-flex items-center">
              <span className="font-display text-xl font-semibold">
                Sakhi<span className="text-zari">Vastra</span>
              </span>
            </Link>

            <p className="mt-4 text-sm leading-6 text-ivory/70 max-w-xs">
              Hand-finished kurtis, made in small batches by artisan partners
              across India.
            </p>

            <a
              href="https://www.instagram.com/sakhii.vastra/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-5 text-sm text-zari hover:text-ivory transition-colors"
            >
              Instagram ↗
            </a>
          </div>

          {/* Quick Links */}
          <div className="min-w-0">
            <h3 className="font-body text-sm uppercase tracking-widest text-zari mb-4">
              Quick Links
            </h3>

            <ul className="space-y-3 text-sm text-ivory/80">
              <li>
                <Link
                  href="/shop"
                  className="hover:text-zari transition-colors"
                >
                  Shop All
                </Link>
              </li>

              <li>
                <Link
                  href="/cart"
                  className="hover:text-zari transition-colors"
                >
                  Cart
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
            <h3 className="font-body text-sm uppercase tracking-widest text-zari mb-4">
              Contact
            </h3>

            <ul className="space-y-3 text-sm text-ivory/80">
              <li>
                <a
                  href="tel:+917383744152"
                  className="hover:text-zari transition-colors"
                >
                  +91 73837 44152
                </a>
              </li>

              <li>
                <a
                  href="tel:+916353478922"
                  className="hover:text-zari transition-colors"
                >
                  +91 63534 78922
                </a>
              </li>

              <li className="break-all">
                <a
                  href="mailto:sakhivastra.marketplace@gmail.com"
                  className="hover:text-zari transition-colors"
                >
                  sakhivastra.marketplace@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Locations */}
          <div className="min-w-0">
            <h3 className="font-body text-sm uppercase tracking-widest text-zari mb-4">
              Our Locations
            </h3>

            <div className="space-y-5 text-sm text-ivory/80 leading-6">

              <div>
                <p className="text-ivory font-medium mb-1">
                  Gujarat
                </p>
                <p>
                  THE HELP Cyber Center,
                  <br />
                  Dholikuva, Gujarat 396570
                </p>
              </div>

              <div>
                <p className="text-ivory font-medium mb-1">
                  Ahmedabad
                </p>
                <p>
                  35, Dhanlaxmi Soc.,
                  <br />
                  Hiravadi Road, Mahavir Nagar,
                  <br />
                  Saijpur Bogha,
                  <br />
                  Ahmedabad, Gujarat 382345
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-ivory/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ivory/40">
            Ships pan-India via Shiprocket
          </p>

          <p className="text-xs text-ivory/40">
            © {new Date().getFullYear()} SakhiVastra. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}