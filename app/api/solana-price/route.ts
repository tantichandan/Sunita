import { NextResponse } from "next/server"

export async function GET() {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd", {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 10 }, // Cache for 10 seconds
    })

    if (!response.ok) {
      throw new Error("Failed to fetch price from CoinGecko")
    }

    const data = await response.json()

    // Validate the response data
    if (!data?.solana?.usd) {
      throw new Error("Invalid price data format")
    }

    return NextResponse.json({
      price: data.solana.usd,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error("Error fetching Solana price:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch price",
        timestamp: Date.now(),
      },
      { status: 500 },
    )
  }
}

