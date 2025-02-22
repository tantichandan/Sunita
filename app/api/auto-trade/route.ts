
import { NextResponse } from "next/server";
import Binance from "binance-api-node";
import dotenv from "dotenv";
import { OrderType } from "binance-api-node";

dotenv.config();

const client = Binance({
  apiKey: process.env.API_SPOT!,
  apiSecret: process.env.SECRECT_KEY_SPOT!,
  httpBase: "https://testnet.binance.vision",
});

const ANALYSIS_API_URL = "http://localhost:3000/api/analyze-solana"; // Change to your actual API URL

export async function POST(req: Request) {
  try {
    const { symbol, quoteOrderQty } = await req.json();

    if (!symbol || !quoteOrderQty) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Step 1: Fetch Analysis from solana-analyze API
    const analysisResponse = await fetch(ANALYSIS_API_URL, { method: "POST" });
    const analysisData = await analysisResponse.json();

    if (!analysisData.analysis) {
      throw new Error("No analysis received from solana-analyze");
    }

    // Extract entry price from the AI-generated analysis
    const entryPriceMatch = analysisData.analysis.match(/"entry_price"\s*:\s*([\d.]+)/);
    if (!entryPriceMatch) {
      throw new Error("Entry price not found in AI analysis");
    }

    const entryPrice = parseFloat(entryPriceMatch[1]);
    console.log(`✅ Entry price identified: ${entryPrice}`);

    // Step 2: Monitor Market Price Until It Reaches Entry Price
    let currentPrice = 0;
    while (currentPrice < entryPrice) {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds before checking again

      const ticker = await client.prices({ symbol });
      currentPrice = parseFloat(ticker[symbol]);

      console.log(`📊 Monitoring: Current Price = ${currentPrice}, Target = ${entryPrice}`);
    }

    console.log(`🚀 Entry price reached! Placing buy order...`);

    // Step 3: Place Market Buy Order
    const buyOrder = await client.order({
      symbol,
      side: "BUY",
      type: "MARKET" as any,
      quoteOrderQty,
    });

    console.log("✅ Buy Order Executed:", buyOrder);

    // Step 4: Set Stop-Loss & Take-Profit Orders
    const buyPrice = parseFloat(buyOrder.fills?.[0]?.price || entryPrice.toString());
    const takeProfitPrice = buyPrice * 1.25; // 25% profit target
    const stopLossPrice = buyPrice * 0.92; // 8% stop-loss

    await client.order({
        symbol,
        side: "SELL",
        type: "STOP_LOSS_LIMIT" as any, // ✅ Corrected order type
        stopPrice: stopLossPrice.toFixed(2), // ✅ Stop price (trigger level)
        price: stopLossPrice.toFixed(2), // ✅ Limit price (same as stop for safety)
        quantity: buyOrder.executedQty, // ✅ Sell the exact quantity bought
        timeInForce: "GTC", // ✅ Keep order active until filled
      })

    await client.order({
      symbol,
      side: "SELL",
      type: "TAKE_PROFIT_LIMIT" as any,
      stopPrice: takeProfitPrice.toFixed(2),
      price: takeProfitPrice.toFixed(2),
      quantity: buyOrder.executedQty,
      timeInForce: "GTC",
    });

    console.log(`🎯 Stop-Loss @ ${stopLossPrice}, Take-Profit @ ${takeProfitPrice}`);

    return NextResponse.json({ success: true, entryPrice, buyOrder });
  } catch (error: any) {
    console.error("❌ Error in auto-trading:", error);
    return NextResponse.json({ error: error.message || "Failed to execute trade" }, { status: 500 });
  }
}
