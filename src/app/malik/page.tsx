"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MalikLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/malik/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Login failed");
      return;
    }

    router.push("/sync");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-ivory px-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="text-center mb-8">
            <p className="text-sm tracking-[0.3em] text-rani uppercase">
              Sakhi Vastra
            </p>

            <h1 className="font-display text-4xl text-ink mt-3">
              Malik
            </h1>

            <p className="text-sm text-ink/50 mt-2">
              Admin Panel
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm text-ink mb-2">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sakhivastra.in"
                required
                className="w-full border border-ink/10 rounded-lg px-4 py-3 outline-none focus:border-rani"
              />
            </div>

            <div>
              <label className="block text-sm text-ink mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border border-ink/10 rounded-lg px-4 py-3 outline-none focus:border-rani"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-rani text-ivory rounded-full py-3 font-medium hover:bg-rani-dark transition"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}