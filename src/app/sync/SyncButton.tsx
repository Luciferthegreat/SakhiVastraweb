"use client";

import { useState } from "react";

export default function SyncButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSync() {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/sync-sheet", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Sync failed");
        return;
      }

      setMessage("✅ Products synced successfully!");
    } catch (error) {
      console.error(error);
      setMessage("❌ Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleSync}
        disabled={loading}
        className="bg-black text-white px-8 py-4 rounded-xl font-medium hover:opacity-80 transition disabled:opacity-50"
      >
        {loading ? "Syncing..." : "Sync Google Sheet"}
      </button>

      {message && (
        <p className="text-sm text-center">
          {message}
        </p>
      )}
    </div>
  );
}