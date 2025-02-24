import { NextResponse } from "next/server";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

export async function GET() {
  try {
    const apiKey = process.env.CRYPTO_NEWS_API_KEY;
    if (!apiKey) {
      throw new Error("Missing API key for Crypto News API");
    }

    const url = `https://newsdata.io/api/1/news?apikey=${apiKey}&q=solana`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch news: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("News API Error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}
