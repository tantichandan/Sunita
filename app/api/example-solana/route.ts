import { NextResponse } from "next/server"
import { Connection } from "@solana/web3.js"
import OpenAI from "openai"

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
})

// Binance API URLs
const BINANCE_REALTIME_URL = "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT"
const BINANCE_HISTORICAL_URL = "https://api.binance.com/api/v3/klines?symbol=SOLUSDT&interval=1h&limit=720" // Last 30 days (24h * 30)

// Fetch real-time SOL price from Binance
async function fetchBinanceRealTimePrice() {
  try {
    const response = await fetch(BINANCE_REALTIME_URL)
    const data = await response.json()
    return parseFloat(data.price)
  } catch (error) {
    console.error("❌ Error fetching real-time SOL price from Binance:", error)
    return null
  }
}

// Fetch historical SOLUSDT data (last 30 days, 1-hour candles)
async function fetchBinanceHistoricalData() {
  try {
    const response = await fetch(BINANCE_HISTORICAL_URL)
    const data = await response.json()

    return data.map((candle: any) => ({
      time: new Date(candle[0]).toISOString(),
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5]),
    }))
  } catch (error) {
    console.error("❌ Error fetching historical SOLUSDT data from Binance:", error)
    return null
  }
}

// Fetch Solana Web3 real-time network data
async function fetchSolanaNetworkData() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed")
  try {
    const [epochInfo, recentBlockhash] = await Promise.all([
      connection.getEpochInfo(),
      connection.getLatestBlockhash(),
    ])
    return {
      slotHeight: epochInfo.slotsInEpoch,
      absoluteSlot: epochInfo.absoluteSlot,
      recentBlockhash: recentBlockhash.blockhash,
    }
  } catch (error) {
    console.error("❌ Error fetching Solana network data:", error)
    return null
  }
}

export async function POST() {
  try {
    if (!process.env.OPEN_AI_KEY) {
      throw new Error("⚠️ OpenAI API key is missing")
    }

    // Fetch all data in parallel
    const [realTimePrice, historicalData, solanaNetworkData] = await Promise.all([
      fetchBinanceRealTimePrice(),
      fetchBinanceHistoricalData(),
      fetchSolanaNetworkData(),
    ])

    if (!realTimePrice) {
      throw new Error("⚠️ Failed to fetch real-time SOL price from Binance")
    }

    if (!historicalData) {
      throw new Error("⚠️ Failed to fetch historical SOLUSDT data from Binance")
    }

    // Prepare data for AI analysis
    const solanaData = {
      realTimePrice,
      historicalData,
      solanaNetworkData: solanaNetworkData || "Solana network data unavailable",
    }

    // Use OpenAI to analyze the data
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a highly skilled Solana trading expert with deep expertise in market analysis. When reviewing realTimePrice, display the real-time price of Solana as the entry price. Format your response strictly as: 'entry_price: [number]', where [number] represents the optimal entry price. Additionally, provide the best trading strategy for Solana for a 24-hour window using all machine learning algorithms by reviewing realTimePrice, historicalData, and solanaNetworkData. Identify the best entry price to buy Solana within 24 hours.",
        },
        {
          role: "user",
          content: `Here is the data: ${JSON.stringify(solanaData)}. Generate a trading strategy.`,
        },
      ],
    })

    const analysis = completion.choices[0]?.message?.content || "No analysis generated"

    return NextResponse.json({
      analysis,
      realTimePrice,
      historicalData,
      solanaNetworkData,
    })
  } catch (error) {
    console.error("❌ Error in Solana analysis:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred", timestamp: Date.now() },
      { status: 500 },
    )
  }
}
