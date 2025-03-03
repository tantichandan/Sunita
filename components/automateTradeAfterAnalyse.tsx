"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SolanaAnalyzerandTrade() {
  const [entryPrice, setEntryPrice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchEntryPrice = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/realtime", { method: "POST" });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to analyze Solana data");

      const entryPriceMatch = data.analysis.match(
        /entry_price\s*:\s*(\d+(\.\d+)?)/
      );
      if (!entryPriceMatch)
        throw new Error("Entry price not found in AI analysis");

      const parsedEntryPrice = parseFloat(entryPriceMatch[1]);
      setEntryPrice(parsedEntryPrice);
      console.log(`✅ Entry price identified: $${parsedEntryPrice}`);
    } catch (error) {
      console.error("❌ Error fetching entry price:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch entry price"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const monitorMarketPrice = async () => {
    if (!entryPrice) {
      setError("Please fetch the entry price first.");
      return;
    }

    setIsMonitoring(true);
    setMessage(null);
    setError(null);

    const startTime = Date.now();
    const maxDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    const monitor = async () => {
      if (Date.now() - startTime >= maxDuration) {
        setIsMonitoring(false);
        setMessage(
          "⏳ Monitoring ended. Entry price not matched within 24 hours."
        );
        return;
      }

      try {
        const response = await fetch(
          "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT"
        );
        const data = await response.json();
        const marketPrice = parseFloat(data.price);

        console.log(`📊 Current Market Price: $${marketPrice}`);

        // Check if the market price is within the slippage range
        if (
          marketPrice >= entryPrice - 0.1 &&
          marketPrice <= entryPrice + 0.1
        ) {
          setMessage("✅ Entry price matched! Placing trade...");

          // Execute the trade
          await executeTrade();

          setIsMonitoring(false);
          return;
        }
      } catch (error) {
        console.error("🚨 Error fetching market price:", error);
        setError("Failed to fetch market price.");
      }

      setTimeout(monitor, 15000); // Retry after 15 seconds
    };

    monitor();
  };

  // Function to execute the trade using the API
  const executeTrade = async () => {
    try {
      const tradeResponse = await fetch("/api/trade-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: "SOLUSDT",
          side: "BUY",
          type: "MARKET",
          quoteOrderQty: "10", // Amount to trade
        }),
      });

      if (!tradeResponse.ok) throw new Error("Trade execution failed");

      const tradeData = await tradeResponse.json();
      console.log("✅ Trade executed successfully:", tradeData);

      setMessage(`✅ Trade successful! Order ID: ${tradeData.orderId}`);

      const entryPrice = parseFloat(tradeData.fills[0].price); // Get executed price
      const quantity = parseFloat(tradeData.executedQty);
      console.log("🔍 Monitoring market...");
      await sellTrade(entryPrice, quantity);
      
    } catch (error) {
      console.error("❌ Error executing trade:", error);
      setError("Trade execution failed.");
    }
  };
  



  const sellTrade = async (entryPrice: number, quantity: number): Promise<void> => {
    try {
      const takeProfitPrice = (entryPrice * 1.02).toFixed(2); // 5% profit
      const stopLossTriggerPrice = (entryPrice * 0.99).toFixed(2); // 3% stop-loss trigger
      const stopLossLimitPrice = (entryPrice * 0.98).toFixed(2); // Slightly lower than trigger

      console.log(`📊 Entry Price: ${entryPrice}`);
      console.log(`🎯 Selling at: ${takeProfitPrice} (Limit Order)`);
      console.log(`🚨 Stop-Loss Trigger at: ${stopLossTriggerPrice}`);
      console.log(`🚨 Stop-Loss Limit at: ${stopLossLimitPrice}`);

      // 🛠 1️⃣ Place Take-Profit Limit Order
      const profitResponse = await fetch("/api/exit-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: "SOLUSDT",
          side: "SELL",
          type: "LIMIT",
          price: takeProfitPrice,
          quantity: quantity.toFixed(5),
          timeInForce: "GTC",
        }),
      });

      if (!profitResponse.ok) {
        const profitData = await profitResponse.json();
        console.error("🚨 API Error (Take Profit Order):", profitData);
        throw new Error("Take Profit order failed");
      }

      console.log("✅ Take Profit order placed successfully!");

      // 🛠 2️⃣ Place Stop-Loss Order
      const balanceResponse = await fetch("/api/balance", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const balanceData = await balanceResponse.json();
      const availableSolBalance = balanceData.available.SOL; // Adjust as needed
      
      // Step 2: Place stop-loss order with dynamic quantity
      const stopLossResponse = await fetch("/api/exit-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: "SOLUSDT",
          side: "SELL",
          type: "STOP_LOSS_LIMIT", // Correct order type
          stopPrice: stopLossTriggerPrice, // Trigger price
          price: stopLossLimitPrice, // Execution price (slightly lower)
          quantity: availableSolBalance, // Sell all available SOL
          timeInForce: "GTC",
        }),
      });

      if (!stopLossResponse.ok) {
        const stopLossData = await stopLossResponse.json();
        console.error("🚨 API Error (Stop-Loss Order):", stopLossData);
        throw new Error("Stop Loss order failed");
      }

      console.log("✅ Stop-Loss order placed successfully!");

    } catch (error) {
      console.error("❌ Error placing sell orders:", error);
    }
};

  



  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Solana Entry Point Analyzer & trade executor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={fetchEntryPrice}
          disabled={isAnalyzing}
          className="w-full sm:w-auto"
        >
          {isAnalyzing ? "Analyzing..." : "Get Entry Price"}
        </Button>
        <Button
          onClick={monitorMarketPrice}
          disabled={isMonitoring || !entryPrice}
          className="w-full sm:w-auto"
        >
          {isMonitoring ? "Monitoring..." : "Start Monitoring"}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {entryPrice !== null && !error && (
          <div className="mt-4 p-4 bg-secondary rounded-md">
            <h3 className="font-semibold mb-2">AI Recommended Entry Price:</h3>
            <p className="text-lg font-bold">${entryPrice.toFixed(2)}</p>
          </div>
        )}

        {message && (
          <div className="mt-4 p-4 bg-green-200 rounded-md">
            <h3 className="font-semibold mb-2">Market Update:</h3>
            <p className="text-lg font-bold">{message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
