"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      router.push("/login");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-82px)] bg-ivory px-6 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-[1100px] items-center justify-center">
        <div className="grid w-full max-w-[950px] overflow-hidden border border-ink/10 bg-[#f8f4e8] shadow-[0_20px_60px_rgba(38,43,18,0.08)] md:grid-cols-2">

          {/* LEFT */}
          <div className="hidden min-h-[600px] flex-col justify-between bg-[#30371c] p-10 text-ivory md:flex lg:p-14">
            <div>
              <p className="mb-5 text-[10px] uppercase tracking-[0.3em] text-zari">
                Begin Your Journey
              </p>

              <h2 className="max-w-[380px] font-serif text-4xl leading-tight lg:text-5xl">
                Tradition,
                <br />
                woven for you.
              </h2>

              <p className="mt-6 max-w-[340px] text-sm leading-7 text-ivory/70">
                Create your SakhiVastra account and discover thoughtfully
                crafted kurtis made with the warmth of Indian tradition.
              </p>
            </div>

            <div>
              <div className="mb-4 h-px w-16 bg-zari" />
              <p className="text-[10px] uppercase tracking-[0.25em] text-ivory/50">
                SakhiVastra
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex min-h-[600px] flex-col justify-center px-7 py-12 sm:px-12 lg:px-16">

            <div className="mb-8">
              <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-rani">
                SakhiVastra
              </p>

              <h1 className="font-serif text-4xl text-ink">
                Create your account
              </h1>

              <p className="mt-3 text-sm leading-6 text-ink/55">
                Join us and make every day a little more beautiful.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">

              {/* NAME */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-[10px] font-medium uppercase tracking-[0.18em] text-ink/60"
                >
                  Full Name
                </label>

                <input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-12 w-full border border-ink/15 bg-ivory px-4 text-sm text-ink outline-none transition-all placeholder:text-ink/35 focus:border-rani focus:ring-1 focus:ring-rani/20"
                />
              </div>

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
                  className="h-12 w-full border border-ink/15 bg-ivory px-4 text-sm text-ink outline-none transition-all placeholder:text-ink/35 focus:border-rani focus:ring-1 focus:ring-rani/20"
                />
              </div>

              {/* PHONE */}
              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-[10px] font-medium uppercase tracking-[0.18em] text-ink/60"
                >
                  Phone Number
                </label>

                <input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="h-12 w-full border border-ink/15 bg-ivory px-4 text-sm text-ink outline-none transition-all placeholder:text-ink/35 focus:border-rani focus:ring-1 focus:ring-rani/20"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-[10px] font-medium uppercase tracking-[0.18em] text-ink/60"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-12 w-full border border-ink/15 bg-ivory px-4 text-sm text-ink outline-none transition-all placeholder:text-ink/35 focus:border-rani focus:ring-1 focus:ring-rani/20"
                />
              </div>

              {/* ERROR */}
              {error && (
                <div className="border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                  {error}
                </div>
              )}

              {/* BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex h-12 w-full items-center justify-center bg-[#68753a] text-[11px] font-medium uppercase tracking-[0.2em] text-ivory transition-all duration-300 hover:bg-[#56632f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            {/* LOGIN */}
            <div className="mt-7 border-t border-ink/10 pt-6 text-center">
              <p className="text-xs text-ink/50">
                Already have an account?
              </p>

              <Link
                href="/login"
                className="mt-2 inline-block text-[11px] font-medium uppercase tracking-[0.16em] text-rani transition-colors hover:text-ink"
              >
                Sign In
              </Link>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}