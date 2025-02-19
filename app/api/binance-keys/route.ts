import { NextResponse } from "next/server"
import Binance from "binance-api-node"
import dotenv from "dotenv"

dotenv.config()

// Initialize Binance Client with API Keys from .env
const client = Binance({
  apiKey: process.env.BN_RAPI_KEY,
  apiSecret: process.env.BN_RSECRECT_KEY,
})

// Function to fetch 30 days of SOLUSDT historical data
export async function GET() {
  try {
    // Get current timestamp and 30 days ago
    const now = Date.now()
    const oneDayMs = 24 * 60 * 60 * 1000
    const thirtyDaysAgo = now - 30 * oneDayMs

    // Fetch 1-hour interval SOLUSDT candlestick data
    const candles = await client.futuresCandles({
      symbol: "SOLUSDT",
      interval: "1h",
      startTime: thirtyDaysAgo,
      endTime: now,
      limit: 1000, // Max per request
    })

    // Format data for frontend use
    const formattedData = candles.map((candle) => ({
      time: new Date(candle.openTime).toISOString(),
      open: parseFloat(candle.open),
      high: parseFloat(candle.high),
      low: parseFloat(candle.low),
      close: parseFloat(candle.close),
      volume: parseFloat(candle.volume),
    }))

    return NextResponse.json(formattedData)
  } catch (error) {
    console.error("Error fetching Binance historical data:", error)
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}
