import { NextResponse } from "next/server"
import Binance from "binance-api-node"
import dotenv from "dotenv"

dotenv.config()

const client = Binance({
  apiKey: process.env.API_SPOT!,
  apiSecret: process.env.SECRECT_KEY_SPOT!,
  httpBase: "https://testnet.binance.vision",
})

export async function POST(req: Request) {
  try {
    const { symbol, side, type, quoteOrderQty } = await req.json()

    if (!symbol || !side || !type || !quoteOrderQty) {
      return NextResponse.json({ error: "Missing required order parameters" }, { status: 400 })
    }

    const orderDetails: any = {
      symbol,
      side,
      type,
      quoteOrderQty, // ✅ Buy with a specific dollar amount
    }

    console.log("📤 Sending order:", orderDetails)

    const order = await client.order(orderDetails)

    return NextResponse.json(order)
  } catch (error: any) {
    console.error("❌ Error placing order:", error)
    return NextResponse.json({ error: error.message || "Failed to place order" }, { status: 500 })
  }
}

