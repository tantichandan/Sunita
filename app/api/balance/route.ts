import { NextResponse } from "next/server";
import Binance from "binance-api-node";
import dotenv from "dotenv";

dotenv.config();

// Initialize Binance Client with API Keys from .env and Testnet Base URL
const client = Binance({
  apiKey: process.env.API_SPOT!,
  apiSecret: process.env.SECRECT_KEY_SPOT!,
  httpBase: "https://testnet.binance.vision", // Testnet Base URL
});

/**
 * Fetch Binance Testnet Spot Account Balance
 */
export async function GET() {
    try {
      const accountInfo = await client.accountInfo(); // Fetch all balances
  
      // Find USDT balance
      const usdtBalance = accountInfo.balances.find(
        (balance) => balance.asset === "USDT"
      );
  
      return NextResponse.json(usdtBalance || { asset: "USDT", free: "0", locked: "0" });
    } catch (error: any) {
      console.error("Error fetching Binance USDT balance:", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch USDT balance" },
        { status: 500 }
      );
    }
  }
  