"use client"
import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const fetchHistoricalData = async () => {
  const response = await fetch("https://api.binance.com/api/v3/klines?symbol=SOLUSDT&interval=1h&limit=720")
  if (!response.ok) throw new Error("Failed to fetch historical data")
  const data = await response.json()

  return data.map((candle: any) => ({
    time: new Date(candle[0]).toLocaleString(),
    close: Number.parseFloat(candle[4]),
  }))
}

export default function TradeHistoryChart() {
  const [historicalData, setHistoricalData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchHistoricalData()
        setHistoricalData(data)
      } catch (error) {
        console.error("Error fetching historical data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <Card className="w-full max-w-4xl mx-auto bg-gradient-to-br from-gray-900 to-gray-800">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white">Solana (SOL) Trade History - Last 30 Days</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-[400px] w-full bg-gray-700" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-[100px] bg-gray-700" />
              <Skeleton className="h-4 w-[100px] bg-gray-700" />
            </div>
          </div>
        ) : (
          <div className="relative">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={historicalData}>
                <XAxis
                  dataKey="time"
                  tick={{ fill: "white", fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fill: "white", fontSize: 12 }}
                  tickFormatter={(value) => `$${value.toFixed(2)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(17, 24, 39, 0.8)",
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  }}
                  labelStyle={{ color: "#9CA3AF" }}
                  itemStyle={{ color: "#4ADE80" }}
                />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="#4ADE80"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 8, fill: "#4ADE80", stroke: "#064E3B" }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-gray-900 to-transparent opacity-20 pointer-events-none" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

