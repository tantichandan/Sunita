import { NextResponse } from "next/server";
import https from "https";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const API_KEY: string = process.env.BINANCE_API_KEY!;
const API_SECRET: string = process.env.BINANCE_API_SECRET!;

/**
 * ✅ Function to Get Binance Server Time
 */
async function getServerTime(): Promise<number> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.binance.com",
      path: "/api/v3/time",
      method: "GET",
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          resolve(response.serverTime); // ✅ Get Binance server time
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", (error) => reject(error));
    req.end();
  });
}

/**
 * ✅ Function to Generate HMAC SHA256 Signature
 */
function generateSignature(queryString: string): string {
  return crypto.createHmac("sha256", API_SECRET).update(queryString).digest("hex");
}

/**
 * ✅ Function to Fetch Binance Balance
 */
async function fetchBinanceBalance(): Promise<any> {
  const timestamp = await getServerTime(); // ✅ Get correct timestamp
  const queryString = `timestamp=${timestamp}`;
  const signature = generateSignature(queryString);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.binance.com",
      path: `/api/v3/account?${queryString}&signature=${signature}`,
      method: "GET",
      headers: { "X-MBX-APIKEY": API_KEY },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", (error) => reject(error));
    req.end();
  });
}

/**
 * ✅ API Route: Fetch Binance Account Balance
 */
export async function GET() {
  try {
    console.log("✅ Fetching Binance balance...");
    const accountInfo = await fetchBinanceBalance();
    console.log("✅ Binance response:", accountInfo);

    // ✅ Extract USDT & SOL balances
    const usdtBalance = accountInfo.balances.find((b: any) => b.asset === "USDT");
    const solBalance = accountInfo.balances.find((b: any) => b.asset === "SOL");

    return NextResponse.json({
      USDT: { free: usdtBalance?.free || "0", locked: usdtBalance?.locked || "0" },
      SOL: { free: solBalance?.free || "0", locked: solBalance?.locked || "0" },
    });
  } catch (error: any) {
    console.error("❌ Error fetching Binance balance:", error);
    return NextResponse.json({ error: "Failed to fetch balance" }, { status: 500 });
  }
}
