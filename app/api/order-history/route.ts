import { NextResponse } from "next/server";
import Binance from "binance-api-node";
import dotenv from "dotenv";

dotenv.config();

const client = Binance({
  apiKey: process.env.API_SPOT!,
  apiSecret: process.env.SECRECT_KEY_SPOT!,
  httpBase: "https://testnet.binance.vision",
});

/**
 * ✅ Handle GET Request: Fetch Order History from Binance Testnet
 */
export async function GET() {
  try {
    // Fetch all past orders for SOLUSDT
    const orders = await client.allOrders({ symbol: "SOLUSDT" });

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error("❌ Error fetching order history:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch order history" }, { status: 500 });
  }
}
