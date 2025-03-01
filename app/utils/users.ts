import crypto from "crypto"

export function generateSignature(queryString: string, apiSecret: string): string {
  return crypto.createHmac("sha256", apiSecret).update(queryString).digest("hex")
}

export function createHeaders(apiKey: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-MBX-APIKEY": apiKey,
  }
}

