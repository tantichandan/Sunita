import { NextResponse } from "next/server";
import Binance from "binance-api-node";
import dotenv from "dotenv";

dotenv.config();

const client = Binance({
  apiKey: process.env.BINANCE_API_KEY!,
  apiSecret: process.env.BINANCE_API_SECRET!,
  
});

export async function POST(req: Request) {
  try {
    const { symbol, side, type, quoteOrderQty, quantity, price, stopPrice, timeInForce } = await req.json();

    if (!symbol || !side || !type) {
      return NextResponse.json({ error: "Missing required order parameters" }, { status: 400 });
    }

    let orderDetails: any = { symbol, side, type };

    if (type === "MARKET") {
      if (!quoteOrderQty) {
        return NextResponse.json({ error: "quoteOrderQty is required for MARKET orders" }, { status: 400 });
      }
      orderDetails.quoteOrderQty = quoteOrderQty;
    } else if (type === "LIMIT") {
      if (!price || !quantity) {
        return NextResponse.json({ error: "LIMIT order requires price and quantity" }, { status: 400 });
      }
      orderDetails = { ...orderDetails, price, quantity, timeInForce: timeInForce || "GTC" };
    } else if (type === "STOP_LOSS_LIMIT") {
      if (!price || !stopPrice || !quantity) {
        return NextResponse.json({ error: "STOP_LIMIT order requires stopPrice, price, and quantity" }, { status: 400 });
      }
      orderDetails = { ...orderDetails, stopPrice, price, quantity, timeInForce: timeInForce || "GTC" };
    } else {
      return NextResponse.json({ error: "Invalid order type" }, { status: 400 });
    }

    console.log("📤 Sending order:", JSON.stringify(orderDetails, null, 2));

    const order = await client.order(orderDetails);

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("❌ Error placing order:", error);
    return NextResponse.json({ error: error.message || "Failed to place order" }, { status: 500 });
  }
}
