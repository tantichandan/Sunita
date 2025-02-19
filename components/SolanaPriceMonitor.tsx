"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { AlertCircle } from "lucide-react"

interface PriceData {
  timestamp: number
  price: number
}

export default function SolanaPriceMonitor() {
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([])
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const fetchPrice = async (retry = 0) => {
    try {
      const response = await fetch("/api/solana-price", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!data || typeof data.price !== "number") {
        throw new Error("Invalid price data received")
      }

      setPriceHistory((prev) =>
        [
          ...prev,
          {
            timestamp: Date.now(),
            price: data.price,
          },
        ].slice(-20),
      )

      setCurrentPrice(data.price)
      setError(null)
      setRetryCount(0)
    } catch (error) {
      console.error("Error fetching Solana price:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch price data"
      setError(errorMessage)

      // Implement exponential backoff for retries
      if (retry < 3) {
        const backoffDelay = Math.pow(2, retry) * 1000 // 1s, 2s, 4s
        setTimeout(() => {
          setRetryCount(retry + 1)
          fetchPrice(retry + 1)
        }, backoffDelay)
      }
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchPrice()

    // Set up interval for updates
    const interval = setInterval(() => {
      fetchPrice()
    }, 5000)

    return () => {
      clearInterval(interval)
    }
  }, []) // Removed fetchPrice from dependencies

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Solana Price Monitor</span>
          {currentPrice && <span className="text-2xl">${currentPrice.toFixed(2)}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center gap-2">
              {error}
              {retryCount > 0 && <span className="text-sm">Retry attempt: {retryCount}/3</span>}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="h-[200px]">
            {priceHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceHistory}>
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
                    minTickGap={30}
                  />
                  <YAxis domain={["auto", "auto"]} tickFormatter={(value) => `$${value.toFixed(2)}`} />
                  <Tooltip
                    labelFormatter={(label) => new Date(label).toLocaleString()}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
                    contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                  />
                  <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">Loading price data...</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

