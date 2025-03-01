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
const FIRE_BASE_URL="http://localhost:3000/api/firebase1";

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



// Assuming you want to fetch tweets from `/api/firebase1`
async function fetchFirebaseTweets() {
  try {
    // Fetch the tweets from the /api/firebase1 endpoint on the same local server
    const response = await fetch(FIRE_BASE_URL);
    const data = await response.json();

    if (!data || !Array.isArray(data.tweets) || data.tweets.length === 0) {
      throw new Error("No tweets found for analysis");
    }

    // ✅ Extract only tweet text from the response
    return data.tweets.map((tweet: any) => tweet.legacy.full_text);
  } catch (error) {
    console.error("❌ Error fetching Firebase tweets:", error);
    return [];
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
    const [realTimePrice, historicalData, solanaNetworkData, FirebaseTweets, BinanceOrderBook, FundingRate, GoogleTrend] = await Promise.all([
      fetchBinanceRealTimePrice(),
      fetchBinanceHistoricalData(),
      fetchSolanaNetworkData(),
      fetchFirebaseTweets(), 
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
      FirebaseTweets, // ✅ Now contains actual tweet data
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
          content: "You are super efficient, and highly trained Solana expert. You are expert in machine learning mechanism to find out best entry point analysing solanaData which gives you realTimePrice, historicalData, solanaNetworkData, solanaTweets, BinanceOrderBook, FundingRate, GoogleTrend. Your prediction should always be profitable. Your job is to give an entry price to enter in Solana market for a trading timeline of 10 minutes. Your 10 strategy should be very accurate, and profitable. Use all the data included in 'solanaData' to be able to predict it. Format your response strictly as: 'entry_price: [number]', where [number] represents the optimal entry price"
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
      fetchFirebaseTweets
    })
  } catch (error) {
    console.error("❌ Error in Solana analysis:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred", timestamp: Date.now() },
      { status: 500 },
    )
  }
}


//You are a highly skilled Solana trading expert with deep expertise in market analysis. You have knowledge of machine learning. You have vast knowledge of Time Series Forecasting, Regression Models, and Clustering to identify the best time to enter the market. Use your knowledge to analyze the (solanaData) to prepare the best profitable entry point and the reason why we should go with that. You can prepare the analysis using the technical terms Moving Averages, RSI, MACD, Bollinger Bands. You have the ability to provide a profitable strategy by reviewing the (realTimePrice), (historicalData) for 30 days, (solanaNetworkData), (firebaseTweets), and (BinanceOrderBook) to buy Solana within the next 24 hours. Additionally, you can review the (realTimePrice) and other indicator, and use your skill to provide the entry point for a maximum of 15 minutes trading. This response should be in the strict format entry_price. For an example entry_price: $120. You also have the ability to review other factors such as news, Twitter, and Google Trends, which can possibly affect the price of Solana. Use the data (solanaTweets) for any Solana-related tweets that help in the analysis. Solana-related tweets (solanaTweets): Extract sentiment and news impact from social media discussions that are helpful for analysis. Please check if there is any latest tweet by these users in the last 24 hours to analyze. Analyze all the relevant data and give a prediction if the price of Solana will go up or down in 24 hours from the current price. If it goes higher, signal buy at the current rate, else indicate waiting for a better entry point. If (solanaTweets) is older than 24 hours, do not consider it for prediction. Review the (BinanceOrderBook) for the latest bids and asks to analyze market liquidity and help predict the market. Review the (FundingRate) to understand how the funding rate of Solana can impact its price.Review the (GoogleTrend) data to check if there was any previous price surge spike and use your knowledge to identify similar patterns to predict any upcoming price spike. Please remember, you are a highly intelligent, experienced, and skilled AI trading bot with the ability to access the latest data from the internet to make the best decisions. You are perfect at what you do. Please be very accurate by using all your knowledge. Do you think SOLANA price will go down further? Critcally review everything, and answer in yes, or no. If it goes then by what margin it will go down//