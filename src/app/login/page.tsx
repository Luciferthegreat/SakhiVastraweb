"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirect = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid email or password");
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-82px)] bg-ivory px-6 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-[1100px] items-center justify-center">

        <div className="grid w-full max-w-[900px] overflow-hidden rounded-3xl border border-ink/10 bg-[#f8f4e8] shadow-[0_20px_60px_rgba(38,43,18,0.08)] md:grid-cols-2">

          {/* LEFT SIDE */}
          <div className="relative hidden min-h-[520px] flex-col justify-between overflow-hidden rounded-l-3xl bg-[#30371c] p-10 text-ivory md:flex lg:p-14">

            <div>
              <p className="mb-5 text-[10px] uppercase tracking-[0.3em] text-zari">
                Welcome Back
              </p>

              <h2 className="max-w-[380px] font-serif text-4xl leading-tight lg:text-5xl">
                Grace of tradition,
                <br />
                made for today.
              </h2>

              <p className="mt-6 max-w-[330px] text-sm leading-7 text-ivory/70">
                Discover hand-finished kurtis made in small batches by artisan
                partners across India.
              </p>
            </div>

            <div>
              <div className="mb-4 h-px w-16 bg-zari" />

              <p className="text-[10px] uppercase tracking-[0.25em] text-ivory/50">
                SakhiVastra
              </p>
            </div>

          </div>

          {/* RIGHT SIDE */}
          <div className="flex min-h-[520px] flex-col justify-center rounded-r-3xl px-7 py-12 sm:px-12 lg:px-16">

            <div className="mb-9">

              <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-rani">
                SakhiVastra
              </p>

              <h1 className="font-serif text-4xl text-ink">
                Welcome back
              </h1>

              <p className="mt-3 text-sm leading-6 text-ink/55">
                Sign in to continue your journey with us.
              </p>

            </div>

            <form onSubmit={handleLogin} className="space-y-5">

              {/* EMAIL */}
              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-[10px] font-medium uppercase tracking-[0.18em] text-ink/60"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 w-full rounded-xl border border-ink/15 bg-ivory px-4 text-sm text-ink outline-none transition-all placeholder:text-ink/35 focus:border-rani focus:ring-1 focus:ring-rani/20"
                />

              </div>

              {/* PASSWORD */}
              <div>

                <div className="mb-2 flex items-center justify-between">

                  <label
                    htmlFor="password"
                    className="block text-[10px] font-medium uppercase tracking-[0.18em] text-ink/60"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-[10px] uppercase tracking-[0.12em] text-rani transition-colors hover:text-ink"
                  >
                    Forgot password?
                  </button>

                </div>

                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 w-full rounded-xl border border-ink/15 bg-ivory px-4 text-sm text-ink outline-none transition-all placeholder:text-ink/35 focus:border-rani focus:ring-1 focus:ring-rani/20"
                />

              </div>

              {/* ERROR */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                  {error}
                </div>
              )}

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-[#68753a] text-[11px] font-medium uppercase tracking-[0.2em] text-ivory transition-all duration-300 hover:bg-[#56632f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>

            </form>

            {/* REGISTER */}
            <div className="mt-8 border-t border-ink/10 pt-7 text-center">

              <p className="text-xs text-ink/50">
                Don't have an account?
              </p>

              <button
                type="button"
                onClick={() => router.push("/register")}
                className="mt-2 text-[11px] font-medium uppercase tracking-[0.16em] text-rani transition-colors hover:text-ink"
              >
                Create an account
              </button>

            </div>

          </div>

        </div>

      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[calc(100vh-82px)] items-center justify-center bg-ivory">
          <p className="text-sm text-ink/50">
            Loading...
          </p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}