"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BalancePage() {
  const [balance, setBalance] = useState<{ USDT: { free: string; locked: string }; SOL: { free: string; locked: string } } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  /**
   * ✅ Fetch Balance from `/api/get-balance`
   */
  const fetchBalance = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/balance");
      const data = await response.json();

      if (response.ok) {
        setBalance(data);
      } else {
        setErrorMessage("❌ Failed to fetch balance.");
      }
    } catch (error) {
      setErrorMessage("❌ Error fetching balance.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch balance when the page loads
  useEffect(() => {
    fetchBalance();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-4">💰 Binance Account Balance</h1>

      {/* Fetch Balance Button */}
      <Button onClick={fetchBalance} disabled={loading} className="bg-blue-500 hover:bg-blue-600">
        {loading ? "Fetching..." : "Refresh Balance"}
      </Button>

      {/* Error Message */}
      {errorMessage && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Balance Display */}
      {balance && (
        <Card className="mt-6 w-full max-w-md bg-gray-800 shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-green-400">💰 Your Binance Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">USDT: <span className="text-yellow-400">{balance.USDT.free}</span> (Locked: {balance.USDT.locked})</p>
            <p className="text-lg">SOL: <span className="text-blue-400">{balance.SOL.free}</span> (Locked: {balance.SOL.locked})</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}