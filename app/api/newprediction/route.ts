import { NextResponse } from "next/server"
import { Connection } from "@solana/web3.js"
import OpenAI from "openai"
import { technicalAnalysis } from "@/lib/newtechnical"


// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
})

// API URLs
const FUNDING_RATE_URL = "https://fapi.binance.com/fapi/v1/fundingRate?symbol=SOLUSDT"
const BINANCE_ORDER_BOOK_URL = "https://api.binance.com/api/v3/depth?symbol=SOLUSDT&limit=50"
const FIRE_BASE_URL = "https://sunitaai.vercel.app/api/firebase1"
const BINANCE_REALTIME_URL = "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT"
const BINANCE_HISTORICAL_URL = "https://api.binance.com/api/v3/klines?symbol=SOLUSDT&interval=15m&limit=96" // Last 24 hours of 15-min candles

// Cache mechanism to reduce API calls
const cache = {
  data: null as any,
  timestamp: 0,
  TTL: 60000, // 1 minute cache
}

async function fetchGoogleTrends() {
  try {
    const apiKey = process.env.SERPAPI_KEY as string
    const apiUrl = `https://serpapi.com/search.json?engine=google_trends&q=solana&hl=en&date=today%2012-m&data_type=TIMESERIES&api_key=${apiKey}`

    const response = await fetch(apiUrl)
    const data = await response.json()

    if (!data || !data.interest_over_time || !data.interest_over_time.timeline_data) {
      throw new Error("No Google Trends data found")
    }

    // Extract trend data with 7-day moving average for better signal
    const trendData = data.interest_over_time.timeline_data
    const recentTrends = trendData.slice(-14) // Last 14 data points

    return {
      current: trendData.at(-1),
      trend: recentTrends.map((item: any) => ({
        date: item.date,
        value: item.values[0].extracted_value,
      })),
      weeklyChange: calculatePercentChange(
        recentTrends[0]?.values[0]?.extracted_value,
        recentTrends.at(-1)?.values[0]?.extracted_value,
      ),
    }
  } catch (error) {
    console.error("❌ Error fetching Google Trends data:", error)
    return null
  }
}

function calculatePercentChange(start: number, end: number) {
  if (!start || !end) return 0
  return ((end - start) / start) * 100
}

async function fetchFundingRate() {
  try {
    const response = await fetch(FUNDING_RATE_URL)
    const data = await response.json()

    if (!data || data.length === 0) {
      throw new Error("No funding rate data found")
    }

    // Extract the latest funding rates and calculate average
    const recentRates = data.slice(-3)
    const avgRate =
      recentRates.reduce((acc: number, curr: any) => acc + Number.parseFloat(curr.fundingRate), 0) / recentRates.length

    return {
      latest: {
        symbol: recentRates[recentRates.length - 1].symbol,
        fundingRate: Number.parseFloat(recentRates[recentRates.length - 1].fundingRate),
        fundingTime: new Date(recentRates[recentRates.length - 1].fundingTime).toISOString(),
      },
      average: avgRate,
      trend: avgRate > 0 ? "positive" : "negative",
      intensity: Math.abs(avgRate) > 0.01 ? "strong" : "weak",
    }
  } catch (error) {
    console.error("❌ Error fetching funding rate data:", error)
    return null
  }
}

async function fetchFirebaseTweets() {
  try {
    const response = await fetch(FIRE_BASE_URL)
    const data = await response.json()

    if (!data || !Array.isArray(data.tweets) || data.tweets.length === 0) {
      throw new Error("No tweets found for analysis")
    }

    // Extract tweets with timestamps and perform basic sentiment analysis
    const tweets = data.tweets.map((tweet: any) => {
      const text = tweet.legacy.full_text
      const timestamp = tweet.legacy.created_at
      const isRecent = new Date(timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)

      // Simple sentiment detection
      const sentiment = detectSentiment(text)

      return {
        text,
        timestamp,
        isRecent,
        sentiment,
      }
    })

    return {
      tweets,
      recentCount: tweets.filter((t: any) => t.isRecent).length,
      sentimentSummary: summarizeSentiment(tweets),
    }
  } catch (error) {
    console.error("❌ Error fetching Firebase tweets:", error)
    return { tweets: [], recentCount: 0, sentimentSummary: { positive: 0, negative: 0, neutral: 0 } }
  }
}

function detectSentiment(text: string) {
  const positiveWords = ["bullish", "moon", "up", "gain", "profit", "buy", "growth", "rise", "good", "great"]
  const negativeWords = ["bearish", "down", "crash", "loss", "sell", "drop", "bad", "dump", "fall", "decrease"]

  const lowerText = text.toLowerCase()
  let positiveScore = 0
  let negativeScore = 0

  positiveWords.forEach((word) => {
    if (lowerText.includes(word)) positiveScore++
  })

  negativeWords.forEach((word) => {
    if (lowerText.includes(word)) negativeScore++
  })

  if (positiveScore > negativeScore) return "positive"
  if (negativeScore > positiveScore) return "negative"
  return "neutral"
}

function summarizeSentiment(tweets: { sentiment: "positive" | "negative" | "neutral" }[]): {
  positive: number
  negative: number
  neutral: number
} {
  const summary: Record<"positive" | "negative" | "neutral", number> = {
    positive: 0,
    negative: 0,
    neutral: 0,
  }

  tweets.forEach((tweet) => {
    // TypeScript will now know that tweet.sentiment is always one of the valid keys
    summary[tweet.sentiment]++ // no error here
  })

  return summary
}

async function fetchBinanceOrderBook() {
  try {
    const response = await fetch(BINANCE_ORDER_BOOK_URL)
    const data = await response.json()

    if (!data?.bids || !data?.asks) {
      throw new Error("❌ No order book data found")
    }

    // Process order book data for better analysis
    const bids = data.bids.map(([price, quantity]: [string, string]) => ({
      price: Number.parseFloat(price),
      quantity: Number.parseFloat(quantity),
    }))

    const asks = data.asks.map(([price, quantity]: [string, string]) => ({
      price: Number.parseFloat(price),
      quantity: Number.parseFloat(quantity),
    }))

    // Calculate buy/sell pressure and support/resistance levels
    const bidVolume = bids.reduce((sum: number, bid: any) => sum + bid.quantity, 0)
    const askVolume = asks.reduce((sum: number, ask: any) => sum + ask.quantity, 0)

    // Find significant support/resistance levels (price levels with high volume)
    const supportLevels = findSignificantLevels(bids)
    const resistanceLevels = findSignificantLevels(asks)

    return {
      bids,
      asks,
      buyPressure: bidVolume,
      sellPressure: askVolume,
      buySellRatio: bidVolume / askVolume,
      supportLevels,
      resistanceLevels,
    }
  } catch (error) {
    console.error("❌ Error fetching order book data from Binance:", error)
    return {
      bids: [],
      asks: [],
      buyPressure: 0,
      sellPressure: 0,
      buySellRatio: 1,
      supportLevels: [],
      resistanceLevels: [],
    }
  }
}

function findSignificantLevels(orders: any[]) {
  // Group orders by price ranges
  const priceGroups: Record<string, number> = {}
  const groupSize = 0.5 // Group prices within $0.50

  orders.forEach((order) => {
    const groupKey = Math.floor(order.price / groupSize) * groupSize
    if (!priceGroups[groupKey]) priceGroups[groupKey] = 0
    priceGroups[groupKey] += order.quantity
  })

  // Find top 3 levels with highest volume
  return Object.entries(priceGroups)
    .map(([price, volume]) => ({ price: Number.parseFloat(price), volume }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 3)
}

async function fetchBinanceRealTimePrice() {
  try {
    const response = await fetch(BINANCE_REALTIME_URL)
    const data = await response.json()
    return Number.parseFloat(data.price)
  } catch (error) {
    console.error("❌ Error fetching real-time SOL price from Binance:", error)
    return null
  }
}

async function fetchBinanceHistoricalData() {
  try {
    const response = await fetch(BINANCE_HISTORICAL_URL)
    const data = await response.json()

    return data.map((candle: any) => ({
      time: new Date(candle[0]).toISOString(),
      open: Number.parseFloat(candle[1]),
      high: Number.parseFloat(candle[2]),
      low: Number.parseFloat(candle[3]),
      close: Number.parseFloat(candle[4]),
      volume: Number.parseFloat(candle[5]),
    }))
  } catch (error) {
    console.error("❌ Error fetching historical SOLUSDT data from Binance:", error)
    return null
  }
}

async function fetch15MinCandles() {
  try {
    const response = await fetch("https://api.binance.com/api/v3/klines?symbol=SOLUSDT&interval=15m&limit=96")
    const data = await response.json()

    return data.map((candle: any) => ({
      time: new Date(candle[0]).toISOString(),
      open: Number.parseFloat(candle[1]),
      high: Number.parseFloat(candle[2]),
      low: Number.parseFloat(candle[3]),
      close: Number.parseFloat(candle[4]),
      volume: Number.parseFloat(candle[5]),
    }))
  } catch (error) {
    console.error("❌ Error fetching 15-minute SOLUSDT data from Binance:", error)
    return null
  }
}

async function fetchSolanaNetworkData() {
  const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed")
  try {
    const [epochInfo, recentBlockhash, supplyInfo, performance] = await Promise.all([
      connection.getEpochInfo(),
      connection.getLatestBlockhash(),
      connection.getSupply(),
      connection.getRecentPerformanceSamples(5),
    ])

    return {
      slotHeight: epochInfo.slotsInEpoch,
      absoluteSlot: epochInfo.absoluteSlot,
      recentBlockhash: recentBlockhash.blockhash,
      supply: {
        total: supplyInfo.value.total / 10 ** 9,
        circulating: supplyInfo.value.circulating / 10 ** 9,
      },
      performance: performance.map((sample) => ({
        slot: sample.slot,
        numTransactions: sample.numTransactions,
        samplePeriodSecs: sample.samplePeriodSecs,
        tps: sample.numTransactions / sample.samplePeriodSecs,
      })),
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

    // Check cache first
    const now = Date.now()
    if (cache.data && now - cache.timestamp < cache.TTL) {
      return NextResponse.json(cache.data)
    }

    // Fetch all data in parallel
    const [
      realTimePrice,
      historicalData,
      fifteenMinData,
      solanaNetworkData,
      firebaseTweets,
      binanceOrderBook,
      fundingRate,
      googleTrend,
    ] = await Promise.all([
      fetchBinanceRealTimePrice(),
      fetchBinanceHistoricalData(),
      fetch15MinCandles(),
      fetchSolanaNetworkData(),
      fetchFirebaseTweets(),
      fetchBinanceOrderBook(),
      fetchFundingRate(),
      fetchGoogleTrends(),
    ])

    if (!realTimePrice) {
      throw new Error("⚠️ Failed to fetch real-time SOL price from Binance")
    }

    if (!historicalData) {
      throw new Error("⚠️ Failed to fetch historical SOLUSDT data from Binance")
    }

    // Calculate technical indicators
    const technicalIndicators = technicalAnalysis(historicalData)

    // Prepare data for AI analysis
    const solanaData = {
      realTimePrice,
      historicalData: historicalData.slice(-48), // Send only last 48 hours for analysis
      fifteenMinData: fifteenMinData || [], // 15-minute candles for short-term analysis
      technicalIndicators,
      fifteenMinIndicators: fifteenMinData ? technicalAnalysis(fifteenMinData) : null,
      firebaseTweets,
      solanaNetworkData: solanaNetworkData || "Solana network data unavailable",
      binanceOrderBook,
      fundingRate,
      googleTrend,
    }

    // Use OpenAI to analyze the data with an improved prompt
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Upgraded from gpt-4o-mini for better analysis
      temperature: 0.2, // Lower temperature for more consistent results
      messages: [
        {
          role: "system",
          content: `You are a highly skilled sophisticated Solana trading expert with deep expertise in market analysis and technical indicators. Your task is to analyze Solana data and provide precise 15-minute price predictions. Focus on:

1. ACTION RECOMMENDATION: Clearly state if the trader should BUY, SELL, or WAIT based on the 15-minute prediction. Provide a confidence level (percentage).

2. PRICE PREDICTION: Predict the EXACT price Solana will reach in 15 minutes from now. Be precise with dollar amounts.

3. ENTRY STRATEGY: If your recommendation is to BUY, provide the optimal entry price. If the price is likely to dip before rising, specify the best entry point.

4. TIME-SENSITIVE FACTORS: Identify any immediate market conditions that could affect the 15-minute price movement.

Analyze the following data points:
- Technical indicators (RSI, MACD, Bollinger Bands, Moving Averages)
- Order book data (support/resistance levels, buy/sell pressure)
- Recent tweets sentiment and volume
- Network metrics (transaction volume, active addresses)
- Funding rates and market sentiment
- Google Trends data

Your analysis must be extremely precise for the 15-minute timeframe. Format your response in this exact structure:

ACTION: [BUY/SELL/WAIT]
CONFIDENCE: [percentage]
CURRENT PRICE: [current price in USD]
15-MIN PREDICTION: [exact price in USD]
OPTIMAL ENTRY: [exact price in USD, if recommending BUY]
REASONING: [brief explanation with key factors]
KEY INDICATORS: [list the most influential indicators for this prediction]
RISK LEVEL: [Low/Medium/High]
TRADE TIMING: [specific timing advice within the 15-minute window]`,
        },
        {
          role: "user",
          content: `Here is the Solana data for analysis: ${JSON.stringify(solanaData)}. Please provide your 15-minute trading analysis.`,
        },
      ],
    })

    const analysis = completion.choices[0]?.message?.content || "No analysis generated"

    // Parse the analysis to extract structured data
    const parsedAnalysis = parseAnalysisResponse(analysis, realTimePrice)

    // Prepare the response
    const responseData = {
      analysis,
      parsedAnalysis,
      realTimePrice,
      technicalSummary: technicalIndicators.summary,
      fifteenMinSummary: fifteenMinData ? technicalAnalysis(fifteenMinData).summary : null,
      marketSentiment: {
        orderBookRatio: binanceOrderBook?.buySellRatio || 1,
        tweetSentiment: firebaseTweets?.sentimentSummary || {},
        fundingRate: fundingRate?.latest?.fundingRate || 0,
      },
      timestamp: new Date().toISOString(),
    }

    // Update cache
    cache.data = responseData
    cache.timestamp = now

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("❌ Error in Solana analysis:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred", timestamp: Date.now() },
      { status: 500 },
    )
  }
}

function parseAnalysisResponse(analysis: string, currentPrice: number) {
  try {
    // Extract key information using regex
    const actionMatch = analysis.match(/ACTION:\s*(\w+)/i)
    const confidenceMatch = analysis.match(/CONFIDENCE:\s*(\d+)/i)
    const predictionMatch = analysis.match(/15-MIN PREDICTION:\s*\$?(\d+\.?\d*)/i)
    const entryPointMatch = analysis.match(/OPTIMAL ENTRY:\s*\$?(\d+\.?\d*)/i)
    const riskLevelMatch = analysis.match(/RISK LEVEL:\s*(\w+)/i)
    const tradeTimingMatch = analysis.match(/TRADE TIMING:\s*(.*?)(?=\n|$)/i)

    // Calculate default values if not found
    const prediction = predictionMatch ? Number.parseFloat(predictionMatch[1]) : currentPrice
    const entryPoint = entryPointMatch ? Number.parseFloat(entryPointMatch[1]) : currentPrice
    const stopLoss = entryPoint * 0.97 // 3% below entry
    const takeProfit = entryPoint * 1.05 // 5% above entry

    return {
      action: actionMatch ? actionMatch[1].toUpperCase() : "WAIT",
      confidence: confidenceMatch ? Number.parseInt(confidenceMatch[1]) : 0,
      prediction: prediction.toFixed(2),
      entryPoint: entryPoint.toFixed(2),
      stopLoss: stopLoss.toFixed(2),
      takeProfit: takeProfit.toFixed(2),
      riskLevel: riskLevelMatch ? riskLevelMatch[1] : "Medium",
      tradeTiming: tradeTimingMatch ? tradeTimingMatch[1] : "As soon as possible",
    }
  } catch (error) {
    console.error("Error parsing analysis:", error)
    return {
      action: "WAIT",
      confidence: 0,
      prediction: currentPrice.toFixed(2),
      entryPoint: currentPrice.toFixed(2),
      stopLoss: (currentPrice * 0.97).toFixed(2),
      takeProfit: (currentPrice * 1.05).toFixed(2),
      riskLevel: "Medium",
      tradeTiming: "Wait for clearer signals",
    }
  }
}

