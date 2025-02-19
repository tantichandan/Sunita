"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

interface PriceData {
  time: string
  close: number
}

export default function SolanaHistoricalChart() {
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch("/api/binance-keys") // API route
        if (!response.ok) throw new Error("Failed to fetch price data")

        const data = await response.json()
        setPriceHistory(data)
      } catch (error) {
        console.error("Error fetching historical data:", error)
        setError("Failed to load historical data")
      } finally {
        setLoading(false)
      }
    }

    fetchHistoricalData()
  }, [])

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Solana 30-Day Price Chart</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : loading ? (
          <div className="text-center text-muted-foreground">Loading...</div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceHistory}>
                <XAxis dataKey="time" tickFormatter={(time) => new Date(time).toLocaleDateString()} />
                <YAxis />
                <Tooltip labelFormatter={(label) => new Date(label).toLocaleString()} />
                <Line type="monotone" dataKey="close" stroke="hsl(var(--primary))" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
