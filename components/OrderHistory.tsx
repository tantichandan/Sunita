"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function OrderHistoryPage() {
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  /**
   * ✅ Fetch Order History from `/api/get-orders`
   */
  const fetchOrderHistory = async () => {
    setLoading(true);
    setErrorMessage("");
    setOrderHistory([]); // Clear previous results

    try {
      const response = await fetch("/api/order-history", { method: "GET" });
      const data = await response.json();

      if (response.ok) {
        setOrderHistory(data.orders);
      } else {
        setErrorMessage("❌ Failed to fetch order history.");
      }
    } catch (error) {
      setErrorMessage("❌ Error fetching order history.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-4">📜 Binance Order History</h1>

      {/* Fetch Order History Button */}
      <Button onClick={fetchOrderHistory} disabled={loading} className="bg-gray-500 hover:bg-gray-600">
        {loading ? "Loading..." : "Show Order History"}
      </Button>

      {/* Error Alert */}
      {errorMessage && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Order History Table */}
      {orderHistory.length > 0 && (
        <Card className="mt-6 w-full max-w-2xl bg-gray-800 shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-green-400">📜 Order History</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="p-2 text-gray-400">Order ID</th>
                  <th className="p-2 text-gray-400">Symbol</th>
                  <th className="p-2 text-gray-400">Side</th>
                  <th className="p-2 text-gray-400">Type</th>
                  <th className="p-2 text-gray-400">Solana QTY</th>
                </tr>
              </thead>
              <tbody>
                {orderHistory.slice(-5).map((order, index) => (
                  <tr key={index} className="border-b border-gray-700">
                    <td className="p-2 text-white">{order.orderId}</td>
                    <td className="p-2 text-white">{order.symbol}</td>
                    <td className={`p-2 ${order.side === "BUY" ? "text-green-400" : "text-red-400"}`}>
                      {order.side}
                    </td>
                    <td className="p-2 text-white">{order.type}</td>
                    <td className="p-2 text-yellow-400">{order.origQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
