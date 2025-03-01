import { NextResponse } from "next/server";
import Binance from "binance-api-node";
import dotenv from "dotenv";

dotenv.config();

const client = Binance({
  apiKey: process.env.BINANCE_API_KEY!,
  apiSecret: process.env.BINANCE_API_SECRET!,
  
});

/**
 * ✅ Handle GET Request: Fetch Order History (Only Required Fields)
 */
export async function GET() {
  try {
    // Fetch order history
    const orders = await client.allOrders({ symbol: "SOLUSDT" });

    // ✅ Extract only required fields
    const filteredOrders = orders.map(order => ({
      orderId: order.orderId,   // ✅ Include Order ID
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      quoteOrderQty: order.origQty, // Represents the original order amount
    }));

    return NextResponse.json({ orders: filteredOrders });
  } catch (error: any) {
    console.error("❌ Error fetching order history:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch order history" }, { status: 500 });
  }
}
