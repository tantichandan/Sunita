"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react"

export default function OrderPage() {
  const [buyAmount, setBuyAmount] = useState<string>("1")
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [currentPrice, setCurrentPrice] = useState<string>("0")
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>("")
  const [stopLossPrice, setStopLossPrice] = useState<string>("")
  const [exitLoading, setExitLoading] = useState<boolean>(false)
  const [exitStatus, setExitStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [activeTab, setActiveTab] = useState<string>("buy")

  // Fetch current Solana price
  const fetchCurrentPrice = async () => {
    try {
      const response = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT")
      const data = await response.json()
      if (data.price) {
        setCurrentPrice(data.price)

        // Set default take profit and stop loss if not set
        if (!takeProfitPrice) {
          const profitTarget = (Number.parseFloat(data.price) * 1.05).toFixed(2) // 5% profit
          setTakeProfitPrice(profitTarget)
        }

        if (!stopLossPrice) {
          const stopTarget = (Number.parseFloat(data.price) * 0.95).toFixed(2) // 5% loss
          setStopLossPrice(stopTarget)
        }
      }
    } catch (error) {
      console.error("Error fetching price:", error)
    }
  }

  // Fetch price on component mount and periodically
  useEffect(() => {
    fetchCurrentPrice()
    const interval = setInterval(fetchCurrentPrice, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [currentPrice]) // Added currentPrice to dependencies

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
      setActiveTab("exit") // Switch to exit tab after successful purchase
    } catch (error) {
      setOrderDetails({ error: "❌ Error placing order" })
    } finally {
      setLoading(false)
    }
  }

  const handleSetExitOrders = async () => {
    if (!orderDetails || !orderDetails.executedQty) {
      setExitStatus({
        success: false,
        message: "You need to buy SOL first before setting exit orders",
      })
      return
    }

    setExitLoading(true)
    setExitStatus(null)

    try {
      // Set take profit order
      const profitResponse = await fetch("/api/exit-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: "SOLUSDT",
          side: "SELL",
          type: "LIMIT",
          price: takeProfitPrice,
          quantity: orderDetails.executedQty,
          timeInForce: "GTC",
        }),
      })

      // Set stop loss order
      const stopLossLimitPrice = (Number.parseFloat(stopLossPrice) * 0.99).toFixed(2) // Set limit price slightly below stop price

      const stopLossResponse = await fetch("/api/exit-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: "SOLUSDT",
          side: "SELL",
          type: "STOP_LOSS_LIMIT",
          stopPrice: stopLossPrice, // Trigger price
          price: stopLossLimitPrice, // Execution price (slightly lower)
          quantity: orderDetails.executedQty,
          timeInForce: "GTC",
        }),
      })

      const profitData = await profitResponse.json()
      const stopLossData = await stopLossResponse.json()

      if (profitData.orderId && stopLossData.orderId) {
        setExitStatus({
          success: true,
          message: `Exit orders set successfully! TP: $${takeProfitPrice}, SL: $${stopLossPrice}`,
        })
      } else {
        throw new Error("Failed to set one or both exit orders")
      }
    } catch (error) {
      setExitStatus({
        success: false,
        message: "Error setting exit orders. Please try again.",
      })
    } finally {
      setExitLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-2">📈 Solana Trading Bot</h1>

      {/* Current Price Display */}
      <div className="mb-6 flex items-center">
        <Badge variant="outline" className="text-lg py-2 px-4 border-blue-500">
          <ArrowUpDown className="mr-2 h-4 w-4 text-white" />
          SOL Price: <span className="font-bold ml-1 text-white">${currentPrice}</span>
        </Badge>
      </div>

      <Tabs defaultValue="buy" value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="buy">Buy SOL</TabsTrigger>
          <TabsTrigger value="exit">Take Profit / Stop Loss</TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="space-y-4">
          {/* Buying Amount Input */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg">Buy Solana with USDT</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="buyAmount">USDT Amount to Spend</Label>
                  <div className="flex items-center">
                    <span className="bg-gray-700 px-3 py-2 rounded-l-md text-gray-400">$</span>
                    <Input
                      id="buyAmount"
                      type="number"
                      min="1"
                      step="1"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      className="rounded-l-none bg-gray-700 border-gray-600 text-white"
                      placeholder="Enter USDT amount"
                    />
                  </div>
                </div>

                <Button onClick={handleBuyOrder} disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
                  {loading ? "Processing..." : `Buy SOL with $${buyAmount}`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exit" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg">Set Exit Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Take Profit Input */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
                    <Label htmlFor="takeProfitPrice">Take Profit Price (USDT)</Label>
                  </div>
                  <div className="flex items-center">
                    <span className="bg-gray-700 px-3 py-2 rounded-l-md text-gray-400">$</span>
                    <Input
                      id="takeProfitPrice"
                      type="number"
                      step="0.01"
                      value={takeProfitPrice}
                      onChange={(e) => setTakeProfitPrice(e.target.value)}
                      className="rounded-l-none bg-gray-700 border-gray-600 text-white"
                      placeholder="Enter take profit price"
                    />
                  </div>
                </div>

                {/* Stop Loss Input */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <TrendingDown className="mr-2 h-4 w-4 text-red-500" />
                    <Label htmlFor="stopLossPrice">Stop Loss Price (USDT)</Label>
                  </div>
                  <div className="flex items-center">
                    <span className="bg-gray-700 px-3 py-2 rounded-l-md text-gray-400">$</span>
                    <Input
                      id="stopLossPrice"
                      type="number"
                      step="0.01"
                      value={stopLossPrice}
                      onChange={(e) => setStopLossPrice(e.target.value)}
                      className="rounded-l-none bg-gray-700 border-gray-600 text-white"
                      placeholder="Enter stop loss price"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSetExitOrders}
                  disabled={exitLoading || !orderDetails}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {exitLoading ? "Setting Orders..." : "Set Take Profit & Stop Loss"}
                </Button>

                {exitStatus && (
                  <Alert variant={exitStatus.success ? "default" : "destructive"} className="mt-2">
                    <AlertDescription>{exitStatus.message}</AlertDescription>
                  </Alert>
                )}

                {!orderDetails && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertDescription>You need to buy SOL first before setting exit orders</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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

