import { NextResponse } from "next/server"
import { Connection } from "@solana/web3.js"
import OpenAI from "openai"
import Binance from "binance-api-node"

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
})

const binanceClient = Binance({
  apiKey: process.env.BN_RAPI_KEY,
  apiSecret: process.env.BN_RSECRECT_KEY,
})

export async function POST() {
  try {
    // Validate OpenAI API key
    if (!process.env.OPEN_AI_KEY) {
      throw new Error("OpenAI API key is not configured")
    }

    // Connect to Solana Web3 for real-time network data
    const connection = new Connection("https://api.devnet.solana.com", "confirmed")

    let solanaRealTimeData
    try {
      const [epochInfo, recentBlockhash] = await Promise.all([
        connection.getEpochInfo(),
        connection.getLatestBlockhash(),
      ])

      solanaRealTimeData = {
        slotHeight: epochInfo.slotsInEpoch,
        absoluteSlot: epochInfo.absoluteSlot,
        recentBlockhash: recentBlockhash.blockhash,
      }
    } catch (error) {
      console.error("Error fetching Solana real-time data:", error)
      solanaRealTimeData = null
    }

    // Fetch historical SOLUSDT data from Binance (last 30 days)
    let historicalData
    try {
      const now = Date.now()
      const oneDayMs = 24 * 60 * 60 * 1000
      const thirtyDaysAgo = now - 30 * oneDayMs

      const candles = await binanceClient.futuresCandles({
        symbol: "SOLUSDT",
        interval: "1h",
        startTime: thirtyDaysAgo,
        endTime: now,
        limit: 1000,
      })

      historicalData = candles.map((candle) => ({
        time: new Date(candle.openTime).toISOString(),
        open: parseFloat(candle.open),
        high: parseFloat(candle.high),
        low: parseFloat(candle.low),
        close: parseFloat(candle.close),
        volume: parseFloat(candle.volume),
      }))
    } catch (error) {
      console.error("Error fetching historical SOLUSDT data from Binance:", error)
      historicalData = null
    }

    // If both data fetches failed, return error
    if (!solanaRealTimeData && !historicalData) {
      throw new Error("Failed to fetch both Solana real-time data and Binance historical data")
    }

    // Prepare data for AI analysis
    const solanaData = {
      realTimeData: solanaRealTimeData || "Real-time data unavailable",
      historicalData: historicalData || "Historical data unavailable",
    }

    // Use OpenAI to analyze the data
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Please review realtimeData to fetch the realtime price of solana",
        },
        {
          role: "user",
          content: `Analyze this Solana and Binance data and provide a trading strategy: ${JSON.stringify(solanaData)}`,
        },
      ],
    })

    const analysis = completion.choices[0]?.message?.content || "No analysis generated"

    return NextResponse.json({
      analysis,
      realTimeDataAvailable: solanaRealTimeData ? true : false,
      historicalDataAvailable: historicalData ? true : false,
    })
  } catch (error) {
    console.error("Error in Solana analysis:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An error occurred during analysis",
        timestamp: Date.now(),
      },
      { status: 500 },
    )
  }
}
