"use client";

import { useState } from "react";

export default function BinanceBalance() {
  const [usdtBalance, setUsdtBalance] = useState<{ free: string; locked: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchUSDTBalance = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/balance");
      if (!response.ok) throw new Error("Failed to fetch balance");

      const data = await response.json();
      setUsdtBalance(data);
    } catch (err: any) {
      console.error("Error fetching balance:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 rounded-lg shadow-md text-center max-w-sm mx-auto">
      <h2 className="text-2xl font-semibold mb-4">USDT Balance</h2>

      {error && <p className="text-red-500">Error: {error}</p>}

      {usdtBalance ? (
        <div className="text-lg">
          <p><strong>Free Balance:</strong> {usdtBalance.free} USDT</p>
          <p><strong>Locked Balance:</strong> {usdtBalance.locked} USDT</p>
        </div>
      ) : (
        <p className="text-gray-600">{loading ? "Loading..." : "Click the button to fetch balance"}</p>
      )}

      <button
        onClick={fetchUSDTBalance}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        disabled={loading}
      >
        {loading ? "Fetching..." : "Get USDT Balance"}
      </button>
    </div>
  );
}
