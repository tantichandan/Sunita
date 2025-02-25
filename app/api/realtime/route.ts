import { NextResponse } from "next/server"
import { Connection } from "@solana/web3.js"
import OpenAI from "openai"




// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
})

// Binance API URLs
const FUNDING_RATE_URL = "https://fapi.binance.com/fapi/v1/fundingRate?symbol=SOLUSDT";
const BINANCE_ORDER_BOOK_URL = "https://api.binance.com/api/v3/depth?symbol=SOLUSDT&limit=50";
const SOLANA_API_URL = "http://localhost:3000/api/solana" // Adjust in production
const BINANCE_REALTIME_URL = "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT"
const BINANCE_HISTORICAL_URL = "https://api.binance.com/api/v3/klines?symbol=SOLUSDT&interval=1h&limit=720" // Last 30 days (24h * 30)


async function fetchGoogleTrends() {
  try {
    const apiKey = process.env.SERPAPI_KEY as string;
    const apiUrl = `https://serpapi.com/search.json?engine=google_trends&q=solana&hl=en&date=today%2012-m&data_type=TIMESERIES&api_key=${apiKey}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data || !data.interest_over_time || !data.interest_over_time.timeline_data) {
      throw new Error("No Google Trends data found");
    }

    // Extract the latest trend data
    const latestTrend = data.interest_over_time.timeline_data.at(-1);

    return {
      date: latestTrend.date,
      interest: latestTrend.values[0].extracted_value,
    };
  } catch (error) {
    console.error("❌ Error fetching Google Trends data:", error);
    return null;
  }
}



async function fetchFundingRate() {
  

  try {
    const response = await fetch(FUNDING_RATE_URL);
    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error("No funding rate data found");
    }

    // Extract the latest funding rate
    const latestFundingRate = data[data.length - 1];

    return {
      symbol: latestFundingRate.symbol,
      fundingRate: parseFloat(latestFundingRate.fundingRate),
      fundingTime: new Date(latestFundingRate.fundingTime).toISOString(),
      markPrice: parseFloat(latestFundingRate.markPrice),
    };
  } catch (error) {
    console.error("❌ Error fetching funding rate data:", error);
    return null;
  }
}



async function fetchSolanaTweets() {
  try {
    const response = await fetch(SOLANA_API_URL)
    const data = await response.json()

    if (!data || !Array.isArray(data.results) || data.results.length === 0) {
      throw new Error("No tweets found for analysis")
    }

    // ✅ Extract only tweet text
    return data.results.flatMap((user: any) =>
      user.tweets.map((tweet: any) => tweet.legacy.full_text)
    )
  } catch (error) {
    console.error("❌ Error fetching Solana tweets:", error)
    return []
  }
}

async function fetchBinanceOrderBook() {
  try {
    const response = await fetch(BINANCE_ORDER_BOOK_URL)
    const data = await response.json()

    if (!data?.bids || !data?.asks) {
      throw new Error("❌ No order book data found")
    }

    // ✅ Return properly structured order book data
    return {
      bids: data.bids.map(([price, quantity]: [string, string]) => ({
        price: parseFloat(price),
        quantity: parseFloat(quantity),
      })),
      asks: data.asks.map(([price, quantity]: [string, string]) => ({
        price: parseFloat(price),
        quantity: parseFloat(quantity),
      })),
    }
  } catch (error) {
    console.error("❌ Error fetching order book data from Binance:", error)
    return { bids: [], asks: [] } // Return empty structure to avoid breaking analysis
  }
}







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
      throw new Error("⚠️ OpenAI API key is missing");
    }

    // Fetch all data in parallel
    const [realTimePrice, historicalData, solanaNetworkData, solanaTweets, BinanceOrderBook, FundingRate, GoogleTrend] = await Promise.all([
      fetchBinanceRealTimePrice(),
      fetchBinanceHistoricalData(),
      fetchSolanaNetworkData(),
      fetchSolanaTweets(), 
      fetchBinanceOrderBook(),// ✅ Call the function to get tweet data
      fetchFundingRate(),
      fetchGoogleTrends()
    ]);

    if (!realTimePrice) {
      throw new Error("⚠️ Failed to fetch real-time SOL price from Binance");
    }

    if (!historicalData) {
      throw new Error("⚠️ Failed to fetch historical SOLUSDT data from Binance");
    }

    // Prepare data for AI analysis
    const solanaData = {
      realTimePrice,
      historicalData,
      solanaTweets, // ✅ Now contains actual tweet data
      solanaNetworkData: solanaNetworkData || "Solana network data unavailable",
      BinanceOrderBook,
      FundingRate,
      GoogleTrend
    };

    // Use OpenAI to analyze the data
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are super efficient, and highly trained Solana expert. You are expert in machine learning mechanism to find out best entry point analysing solanaData which gives you realTimePrice, historicalData, solanaNetworkData, solanaTweets, BinanceOrderBook, FundingRate, GoogleTrend. You prediction should always be profitable. Your job is to give an entry price to enter in Solana market for a trading timeline of 10 minutes. Format your response strictly as: 'entry_price: [number]', where [number] represents the optimal entry price",
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
      fetchSolanaTweets
    })
  } catch (error) {
    console.error("❌ Error in Solana analysis:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred", timestamp: Date.now() },
      { status: 500 },
    )
  }
}
