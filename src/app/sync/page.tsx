import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import SyncButton from "./SyncButton";

export default async function SyncPage() {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("malik_admin");

  if (!adminCookie || adminCookie.value !== "authenticated") {
    redirect("/malik");
  }

  return (
    <main className="min-h-screen bg-ivory">
      {/* Top Admin Bar */}
      <div className="border-b border-ink/10 bg-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-rani bg-rani/10 px-3 py-1 rounded-full">
              Malik Portal
            </span>
            <span className="font-display text-lg text-ink font-medium">
              Sakhi Vastra
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/sync"
              className="text-sm px-4 py-2 rounded-lg font-medium bg-rani text-white transition"
            >
              📊 Sheet Sync
            </Link>
            <Link
              href="/malik/meta-ads"
              className="text-sm px-4 py-2 rounded-lg font-medium bg-ink/5 text-ink hover:bg-ink/10 transition flex items-center gap-2"
            >
              🚀 Meta Ads Automation
            </Link>
          </div>
        </div>
      </div>

      <div className="min-h-[70vh] flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-ink/5 p-10">
            <p className="text-xs tracking-[0.3em] text-rani uppercase font-semibold">
              Inventory & Catalog
            </p>

            <h1 className="font-display text-3xl text-ink mt-3">
              Google Sheet Sync
            </h1>

            <p className="text-sm text-ink/60 mt-3 mb-8">
              Sync live product listings, sizes, variants, pricing, and ImageKit assets from your master Google Sheet.
            </p>

            <SyncButton />

            <div className="mt-8 pt-6 border-t border-ink/10 flex justify-center">
              <Link
                href="/malik/meta-ads"
                className="text-xs text-rani font-medium hover:underline flex items-center gap-1"
              >
                Go to Meta Ads Automation Dashboard &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}