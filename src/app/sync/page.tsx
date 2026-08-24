import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SyncButton from "./SyncButton";

export default async function SyncPage() {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("malik_admin");

  if (!adminCookie || adminCookie.value !== "authenticated") {
    redirect("/malik");
  }

  return (
    <main className="min-h-screen bg-ivory">
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-sm p-10">
            <p className="text-sm tracking-[0.3em] text-rani uppercase">
              Sakhi Vastra
            </p>

            <h1 className="font-display text-4xl text-ink mt-3">
              Product Sync
            </h1>

            <p className="text-sm text-ink/50 mt-3 mb-8">
              Sync products from Google Sheet
            </p>

            <SyncButton />
          </div>
        </div>
      </div>
    </main>
  );
}