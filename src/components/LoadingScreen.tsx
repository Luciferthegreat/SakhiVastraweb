"use client";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-ivory">
      <div className="text-center">
        <div className="text-3xl font-display text-ink">
          Sakhi<span className="text-rani">Vastra</span>
        </div>

        <p className="mt-2 text-xs tracking-[0.3em] uppercase text-ink/50">
          Grace of Tradition
        </p>

        <div className="mx-auto mt-6 h-[2px] w-24 overflow-hidden bg-zari/20">
          <div className="h-full w-1/2 bg-zari animate-pulse" />
        </div>
      </div>
    </div>
  );
}