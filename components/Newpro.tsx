"use client"

import { useState, useEffect } from "react"
import {
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type PredictionData = {
  signal: string
  currentPrice: string
  predictedPrice: string
  direction: string
  confidence: number
  entryPoint: string
  stopLoss: string
  takeProfit: string
  riskLevel: string
  reasoning: string
  keyIndicators: string
}

export default function SolanaPredictionDashboard() {
  const [prediction, setPrediction] = useState<PredictionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState(900) // 15 minutes in seconds

  const fetchPrediction = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/newprediction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch prediction")
      }

      const data = await response.json()
      setPrediction(data.parsedAnalysis)
      setLastUpdated(new Date())
      setCountdown(900) // Reset countdown to 15 minutes
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrediction()

    // Set up auto-refresh every 5 minutes
    const refreshInterval = setInterval(
      () => {
        fetchPrediction()
      },
      5 * 60 * 1000,
    )

    return () => clearInterval(refreshInterval)
  }, [fetchPrediction]) // Added fetchPrediction to dependencies

  // Countdown timer
  useEffect(() => {
    if (!lastUpdated) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 0) return 0
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [lastUpdated])

  // Format countdown as MM:SS
  const formatCountdown = () => {
    const minutes = Math.floor(countdown / 60)
    const seconds = countdown % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  // Calculate price change percentage
  const calculatePriceChange = (): string => {
    if (!prediction) return "0.00"

    const current = Number.parseFloat(prediction.currentPrice)
    const predicted = Number.parseFloat(prediction.predictedPrice)
    return (((predicted - current) / current) * 100).toFixed(2)
  }

  // Get direction icon
  const getDirectionIcon = () => {
    if (!prediction) return <Minus className="h-6 w-6" />

    switch (prediction.direction) {
      case "UP":
        return <ArrowUp className="h-6 w-6 text-green-500" />
      case "DOWN":
        return <ArrowDown className="h-6 w-6 text-red-500" />
      default:
        return <Minus className="h-6 w-6 text-yellow-500" />
    }
  }

  // Get signal color
  const getSignalColor = () => {
    if (!prediction) return "bg-gray-200"

    switch (prediction.signal) {
      case "BUY":
        return "bg-green-500"
      case "SELL":
        return "bg-red-500"
      default:
        return "bg-yellow-500"
    }
  }

  // Get risk level color
  const getRiskLevelColor = () => {
    if (!prediction) return "bg-gray-200"

    switch (prediction.riskLevel.toUpperCase()) {
      case "LOW":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      case "HIGH":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={fetchPrediction} variant="outline" className="mt-2">
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </Alert>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Solana 15-Minute Prediction</h1>
          <div className="flex items-center space-x-2">
            <Button onClick={fetchPrediction} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="mr-1 h-4 w-4" />
              {lastUpdated ? (
                <span>
                  Updated {lastUpdated.toLocaleTimeString()} ({formatCountdown()} remaining)
                </span>
              ) : (
                <span>Loading...</span>
              )}
            </div>
          </div>
        </div>

        {loading && !prediction ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-[200px] w-full rounded-lg" />
            <Skeleton className="h-[200px] w-full rounded-lg" />
            <Skeleton className="h-[200px] w-full rounded-lg" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Trading Signal Card */}
              <Card className="overflow-hidden">
                <div className={`h-2 ${getSignalColor()}`} />
                <CardHeader className="pb-2">
                  <CardTitle>Trading Signal</CardTitle>
                  <CardDescription>15-minute recommendation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="text-4xl font-bold">{prediction?.signal || "WAIT"}</div>
                    <Badge variant="outline" className={getRiskLevelColor()}>
                      {prediction?.riskLevel || "Medium"} Risk
                    </Badge>
                    <div className="flex items-center mt-2">
                      <span className="text-sm text-muted-foreground mr-2">Confidence:</span>
                      <Progress value={prediction?.confidence || 0} className="h-2 w-24" />
                      <span className="text-sm ml-2">{prediction?.confidence || 0}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Price Prediction Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Price Prediction</CardTitle>
                  <CardDescription>15-minute forecast</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="flex items-center">
                      {getDirectionIcon()}
                      <span className="text-3xl font-bold ml-2">${prediction?.predictedPrice || "0.00"}</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <Badge
                        variant={Number.parseFloat(calculatePriceChange()) >= 0 ? "default" : "destructive"}
                        className={
                          Number.parseFloat(calculatePriceChange()) >= 0 ? "bg-green-500 hover:bg-green-600" : ""
                        }
                      >
                        {Number.parseFloat(calculatePriceChange()) >= 0 ? "+" : ""}
                        {calculatePriceChange()}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between w-full text-sm">
                      <div className="flex flex-col items-center">
                        <span className="text-muted-foreground">Current</span>
                        <span className="font-medium">${prediction?.currentPrice || "0.00"}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-muted-foreground">Predicted</span>
                        <span className="font-medium">${prediction?.predictedPrice || "0.00"}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trading Levels Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Trading Levels</CardTitle>
                  <CardDescription>Entry and exit points</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium flex items-center">
                        <DollarSign className="h-4 w-4 mr-1 text-blue-500" />
                        Entry Point
                      </span>
                      <span className="font-bold">${prediction?.entryPoint || "0.00"}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                        Take Profit
                      </span>
                      <span className="font-bold">${prediction?.takeProfit || "0.00"}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium flex items-center">
                        <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
                        Stop Loss
                      </span>
                      <span className="font-bold">${prediction?.stopLoss || "0.00"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analysis Details */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Analysis Details</CardTitle>
                <CardDescription>Key indicators and reasoning</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium flex items-center mb-2">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Key Indicators
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {prediction?.keyIndicators || "No key indicators available"}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium flex items-center mb-2">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Reasoning
                    </h3>
                    <p className="text-sm text-muted-foreground">{prediction?.reasoning || "No reasoning available"}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 flex justify-between">
                <div className="text-xs text-muted-foreground">
                  This prediction is valid for 15 minutes from the time of generation.
                </div>
                <div className="text-xs font-medium">Time remaining: {formatCountdown()}</div>
              </CardFooter>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

