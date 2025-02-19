"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function OrderPage() {
  const [buyAmount, setBuyAmount] = useState<string>("10") // Default: Buy $10 worth
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const handleBuyOrder = async () => {
    setLoading(true)
    setOrderDetails(null) // Clear previous order details

    try {
      const response = await fetch("/api/trade-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: "SOLUSDT", // Buying Solana with USDT
          side: "BUY",
          type: "MARKET", // Market order
          quoteOrderQty: buyAmount, // Spending amount in USDT
        }),
      })

      const data = await response.json()
      setOrderDetails(data) // Store order result
    } catch (error) {
      setOrderDetails({ error: "❌ Error placing order" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-4">📈 Buy Solana with USDT</h1>

      {/* Buying Amount Input */}
     

      <Button
        onClick={handleBuyOrder}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg"
      >
        {loading ? "Processing..." : `Buy SOL with $${buyAmount}`}
      </Button>

      {/* Order Details Display */}
      {orderDetails && (
        <Card className="mt-6 w-full max-w-lg bg-gray-800 shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-green-400">
              {orderDetails.error ? "❌ Order Failed" : "✅ Order Executed"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orderDetails.error ? (
              <Alert variant="destructive">
                <AlertDescription>{orderDetails.error}</AlertDescription>
              </Alert>
            ) : (
              <table className="w-full text-left border-collapse">
                <tbody>
                  <tr>
                    <td className="p-2 text-gray-400">Order ID:</td>
                    <td className="p-2 text-white">{orderDetails.orderId}</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-gray-400">Symbol:</td>
                    <td className="p-2 text-white">{orderDetails.symbol}</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-gray-400">Side:</td>
                    <td className="p-2 text-white">{orderDetails.side}</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-gray-400">Spent Amount (USDT):</td>
                    <td className="p-2 text-white">${buyAmount}</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-gray-400">Status:</td>
                    <td className="p-2 text-green-400">{orderDetails.status}</td>
                  </tr>

                  <tr>
                    <td className="p-2 text-gray-400">Purchased Quantity (SOL):</td>
                    <td className="p-2 text-green-400">{orderDetails.executedQty}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}










// "use client"

// import { useState } from "react"
// import { Button } from "@/components/ui/button"
// import { Alert, AlertDescription } from "@/components/ui/alert"

// export default function OrderPage() {
//   const [responseMessage, setResponseMessage] = useState<string>("")
//   const [loading, setLoading] = useState<boolean>(false)

//   const handleBuyOrder = async () => {
//     setLoading(true)
//     setResponseMessage("") // Clear previous messages

//     try {
//       const response = await fetch("/api/trade-bot", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           symbol: "BTCUSDT", // Change to your desired trading pair
//           side: "BUY",
//           type: "MARKET", // Market order
//           price: "30000", // Dummy price, not used in market orders
//           quantity: "0.01", // Adjust quantity as needed
//         }),
//       })

//       const data = await response.json()
//       setResponseMessage(`✅ Order Successful: ${JSON.stringify(data)}`)
//     } catch (error) {
//       setResponseMessage("❌ Error placing order")
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
//       <h1 className="text-2xl font-bold mb-4">Simple Buy Order</h1>

//       <Button
//         onClick={handleBuyOrder}
//         disabled={loading}
//         className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg"
//       >
//         {loading ? "Processing..." : "Buy"}
//       </Button>

//       {responseMessage && (
//         <Alert variant={responseMessage.includes("✅") ? "default" : "destructive"} className="mt-4">
//           <AlertDescription>{responseMessage}</AlertDescription>
//         </Alert>
//       )}
//     </div>
//   )
// }
