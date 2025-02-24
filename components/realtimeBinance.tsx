"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react"

interface PriceData {
  timestamp: number
  price: number
}

export default function SolanaPriceMonitorBinance() {
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([])
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [previousPrice, setPreviousPrice] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const fetchPrice = useCallback(
    async (retry = 0) => {
      try {
        const response = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT")

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (!data || typeof data.price !== "string") {
          throw new Error("Invalid price data received")
        }

        const newPrice = Number.parseFloat(data.price)

        setPreviousPrice(currentPrice)
        setCurrentPrice(newPrice)
        setPriceHistory((prev) =>
          [
            ...prev,
            {
              timestamp: Date.now(),
              price: newPrice,
            },
          ].slice(-20),
        )

        setError(null)
        setRetryCount(0)
      } catch (error) {
        console.error("Error fetching Solana price:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch price data"
        setError(errorMessage)

        if (retry < 3) {
          const backoffDelay = Math.pow(2, retry) * 1000
          setTimeout(() => {
            setRetryCount(retry + 1)
            fetchPrice(retry + 1)
          }, backoffDelay)
        }
      }
    },
    [currentPrice],
  )

  useEffect(() => {
    fetchPrice()
    const interval = setInterval(() => {
      fetchPrice()
    }, 5000) // Fetch every 5 seconds

    return () => {
      clearInterval(interval)
    }
  }, [fetchPrice])

  const priceChange = currentPrice && previousPrice ? currentPrice - previousPrice : 0
  const priceChangePercentage = previousPrice ? (priceChange / previousPrice) * 100 : 0

  return (
    <Card className="w-full max-w-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-lg">
      <CardHeader className="border-b border-gray-700">
        <CardTitle className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-2xl font-bold">Solana realtime price- Binance</span>
          {currentPrice && (
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">${currentPrice.toFixed(2)}</span>
              <span className={`text-sm font-medium ${priceChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                {priceChange >= 0 ? <TrendingUp className="inline mr-1" /> : <TrendingDown className="inline mr-1" />}
                {priceChangePercentage.toFixed(2)}%
              </span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {error ? (
          <Alert variant="destructive" className="bg-red-900 border-red-700 text-white">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center gap-2">
              {error}
              {retryCount > 0 && <span className="text-sm">Retry attempt: {retryCount}/3</span>}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="h-[300px] sm:h-[400px]">
            {priceHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceHistory}>
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
                    minTickGap={30}
                    stroke="#9CA3AF"
                  />
                  <YAxis domain={["auto", "auto"]} tickFormatter={(value) => `$${value.toFixed(2)}`} stroke="#9CA3AF" />
                  <Tooltip
                    labelFormatter={(label) => new Date(label).toLocaleString()}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
                    contentStyle={{ background: "#1F2937", border: "1px solid #374151", borderRadius: "8px" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#10B981"
                    dot={false}
                    strokeWidth={2}
                    activeDot={{ r: 8, fill: "#10B981", stroke: "#064E3B" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">Loading price data...</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

