"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ArrowDown, ArrowUp, Loader2, RefreshCw, TrendingDown, TrendingUp } from "lucide-react"

type AnalysisResult = {
  analysis: string
  parsedAnalysis: {
    action: string
    confidence: number
    prediction: string
    entryPoint: string
    stopLoss: string
    takeProfit: string
    riskLevel: string
    tradeTiming: string
  }
  realTimePrice: number
  technicalSummary: {
    signal: string
    strength: number
    buySignals: number
    sellSignals: number
  }
  fifteenMinSummary?: {
    signal: string
    strength: number
    buySignals: number
    sellSignals: number
  }
  marketSentiment: {
    orderBookRatio: number
    tweetSentiment: {
      positive: number
      negative: number
      neutral: number
    }
    fundingRate: number
  }
  timestamp: string
}

export default function SolanaAnalyzerFifteenMinutes() {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const analyzeSolana = async () => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch("/api/newprediction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze Solana data")
      }

      setResult(data)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (error) {
      console.error("Error analyzing Solana data:", error)
      setError(error instanceof Error ? error.message : "An error occurred while analyzing Solana data")
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Format currency with $ sign and 2 decimal places
  const formatCurrency = (value: string | number) => {
    return `$${Number(value).toFixed(2)}`
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl md:text-3xl font-bold text-primary">Solana 15-Minute Prediction</CardTitle>
          <CardDescription>
            AI-powered price prediction and trading signals for Solana (SOL) in 15-minute timeframe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Button
              onClick={analyzeSolana}
              disabled={isAnalyzing}
              className="w-full sm:w-auto flex items-center justify-center"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Analyze Solana Data
                </>
              )}
            </Button>

            {lastUpdated && <span className="text-sm text-muted-foreground">Last updated: {lastUpdated}</span>}

            {result && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Current Price:</span>
                <span className="text-lg font-bold">{formatCurrency(result.realTimePrice)}</span>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && !error && (
            <Tabs defaultValue="prediction" className="mt-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="prediction">Prediction</TabsTrigger>
                <TabsTrigger value="15min">15min Analysis</TabsTrigger>
                <TabsTrigger value="technical">Technical</TabsTrigger>
                <TabsTrigger value="full">Full Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="prediction" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>Action Recommendation</span>
                        <Badge
                          variant={
                            result.parsedAnalysis.action === "BUY"
                              ? "default"
                              : result.parsedAnalysis.action === "SELL"
                                ? "destructive"
                                : "outline"
                          }
                          className="ml-2"
                        >
                          {result.parsedAnalysis.action === "BUY" ? (
                            <TrendingUp className="h-4 w-4 mr-1" />
                          ) : result.parsedAnalysis.action === "SELL" ? (
                            <TrendingDown className="h-4 w-4 mr-1" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-1" />
                          )}
                          {result.parsedAnalysis.action}
                        </Badge>
                      </CardTitle>
                      <CardDescription>Confidence: {result.parsedAnalysis.confidence}%</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Progress
                        value={result.parsedAnalysis.confidence}
                        className={
                          result.parsedAnalysis.action === "BUY"
                            ? "bg-green-100"
                            : result.parsedAnalysis.action === "SELL"
                              ? "bg-red-100"
                              : "bg-blue-100"
                        }
                      />
                      <div className="mt-4 text-sm">
                        <span className="font-medium">Trade Timing: </span>
                        {result.parsedAnalysis.tradeTiming}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">15-Minute Prediction</CardTitle>
                      <CardDescription>Price forecast for the next 15 minutes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                        <div className="text-sm font-medium mb-1">Predicted Price</div>
                        <div className="text-3xl font-bold">{formatCurrency(result.parsedAnalysis.prediction)}</div>
                        <div className="text-xs mt-2">
                          {Number(result.parsedAnalysis.prediction) > result.realTimePrice
                            ? `+${(
                                ((Number(result.parsedAnalysis.prediction) - result.realTimePrice) /
                                  result.realTimePrice) *
                                  100
                              ).toFixed(2)}%`
                            : `${(
                                ((Number(result.parsedAnalysis.prediction) - result.realTimePrice) /
                                  result.realTimePrice) *
                                  100
                              ).toFixed(2)}%`}
                          from current price
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Trading Strategy (15min)</CardTitle>
                    <CardDescription>Entry, exit and stop loss levels for 15-minute trading</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-sm font-medium mb-1">Optimal Entry</div>
                        <div className="text-xl font-bold">{formatCurrency(result.parsedAnalysis.entryPoint)}</div>
                        {Number(result.parsedAnalysis.entryPoint) !== result.realTimePrice && (
                          <div className="text-xs mt-1">
                            {Number(result.parsedAnalysis.entryPoint) < result.realTimePrice
                              ? "Wait for dip"
                              : "Buy now"}
                          </div>
                        )}
                      </div>
                      <div className="text-center p-4 bg-green-100 dark:bg-green-900 rounded-lg">
                        <div className="text-sm font-medium mb-1">Take Profit</div>
                        <div className="text-xl font-bold text-green-700 dark:text-green-300">
                          {formatCurrency(result.parsedAnalysis.takeProfit)}
                        </div>
                        <div className="text-xs mt-1">+5% target</div>
                      </div>
                      <div className="text-center p-4 bg-red-100 dark:bg-red-900 rounded-lg">
                        <div className="text-sm font-medium mb-1">Stop Loss</div>
                        <div className="text-xl font-bold text-red-700 dark:text-red-300">
                          {formatCurrency(result.parsedAnalysis.stopLoss)}
                        </div>
                        <div className="text-xs mt-1">-3% limit</div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-secondary rounded-lg">
                      <h4 className="font-medium mb-2">Risk Level: {result.parsedAnalysis.riskLevel}</h4>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div
                          className={`p-2 rounded ${
                            result.parsedAnalysis.riskLevel === "Low" ? "bg-green-100 dark:bg-green-900" : "bg-muted"
                          }`}
                        >
                          Low
                        </div>
                        <div
                          className={`p-2 rounded ${
                            result.parsedAnalysis.riskLevel === "Medium"
                              ? "bg-yellow-100 dark:bg-yellow-900"
                              : "bg-muted"
                          }`}
                        >
                          Medium
                        </div>
                        <div
                          className={`p-2 rounded ${
                            result.parsedAnalysis.riskLevel === "High" ? "bg-red-100 dark:bg-red-900" : "bg-muted"
                          }`}
                        >
                          High
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="15min" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">15-Minute Indicators</CardTitle>
                    <CardDescription>Short-term technical analysis for 15-minute trading</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {result.fifteenMinSummary ? (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-medium">15min Signal:</span>

                          <Badge
                            variant={
                              result.fifteenMinSummary.signal === "BUY"
                                ? "default"
                                : result.fifteenMinSummary.signal === "SELL"
                                  ? "destructive"
                                  : "outline"
                            }
                          >
                            {result.fifteenMinSummary.signal}
                          </Badge>
                        </div>

                        <div className="mb-4">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Signal Strength</span>
                            <span className="text-sm">{result.fifteenMinSummary.strength}%</span>
                          </div>
                          <Progress value={result.fifteenMinSummary.strength} />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-6">
                          <div className="flex flex-col items-center p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                            <ArrowUp className="h-5 w-5 text-green-600 dark:text-green-400 mb-1" />
                            <span className="text-sm font-medium">Buy Signals</span>
                            <span className="text-2xl font-bold">{result.fifteenMinSummary.buySignals}</span>
                          </div>
                          <div className="flex flex-col items-center p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                            <ArrowDown className="h-5 w-5 text-red-600 dark:text-red-400 mb-1" />
                            <span className="text-sm font-medium">Sell Signals</span>
                            <span className="text-2xl font-bold">{result.fifteenMinSummary.sellSignals}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <p>15-minute analysis data not available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Price Momentum</CardTitle>
                    <CardDescription>Short-term price movement and volatility</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Current vs 15min Prediction</span>
                          <span
                            className={
                              Number(result.parsedAnalysis.prediction) > result.realTimePrice
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {Number(result.parsedAnalysis.prediction) > result.realTimePrice
                              ? `+${(
                                  ((Number(result.parsedAnalysis.prediction) - result.realTimePrice) /
                                    result.realTimePrice) *
                                    100
                                ).toFixed(2)}%`
                              : `${(
                                  ((Number(result.parsedAnalysis.prediction) - result.realTimePrice) /
                                    result.realTimePrice) *
                                    100
                                ).toFixed(2)}%`}
                          </span>
                        </div>
                        <Progress
                          value={
                            50 +
                            ((Number(result.parsedAnalysis.prediction) - result.realTimePrice) / result.realTimePrice) *
                              500
                          }
                          className={
                            Number(result.parsedAnalysis.prediction) > result.realTimePrice
                              ? "bg-green-100"
                              : "bg-red-100"
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-sm font-medium mb-1">Current Price</div>
                          <div className="text-xl font-bold">{formatCurrency(result.realTimePrice)}</div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-sm font-medium mb-1">Predicted (15min)</div>
                          <div className="text-xl font-bold">{formatCurrency(result.parsedAnalysis.prediction)}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Order Book Analysis</CardTitle>
                    <CardDescription>Support and resistance levels from the order book</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Buy/Sell Pressure Ratio</span>
                          <span
                            className={result.marketSentiment.orderBookRatio > 1 ? "text-green-600" : "text-red-600"}
                          >
                            {result.marketSentiment.orderBookRatio.toFixed(2)}
                          </span>
                        </div>
                        <Progress
                          value={Math.min(result.marketSentiment.orderBookRatio * 50, 100)}
                          className={result.marketSentiment.orderBookRatio > 1 ? "bg-green-100" : "bg-red-100"}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="technical" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Technical Indicators</CardTitle>
                    <CardDescription>Summary of key technical analysis indicators</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium">Overall Signal:</span>

                      <Badge
                        variant={
                          result.technicalSummary.signal === "BUY"
                            ? "default" // Map "BUY" to "default" or "secondary" based on your needs
                            : result.technicalSummary.signal === "SELL"
                              ? "destructive"
                              : "outline" // Default case when it's neither "BUY" nor "SELL"
                        }
                      >
                        {result.technicalSummary.signal}
                      </Badge>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Signal Strength</span>
                        <span className="text-sm">{result.technicalSummary.strength}%</span>
                      </div>
                      <Progress value={result.technicalSummary.strength} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="flex flex-col items-center p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                        <ArrowUp className="h-5 w-5 text-green-600 dark:text-green-400 mb-1" />
                        <span className="text-sm font-medium">Buy Signals</span>
                        <span className="text-2xl font-bold">{result.technicalSummary.buySignals}</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                        <ArrowDown className="h-5 w-5 text-red-600 dark:text-red-400 mb-1" />
                        <span className="text-sm font-medium">Sell Signals</span>
                        <span className="text-2xl font-bold">{result.technicalSummary.sellSignals}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Market Sentiment</CardTitle>
                    <CardDescription>Order book, social media, and funding rate analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Buy/Sell Pressure Ratio</span>
                          <span
                            className={result.marketSentiment.orderBookRatio > 1 ? "text-green-600" : "text-red-600"}
                          >
                            {result.marketSentiment.orderBookRatio.toFixed(2)}
                          </span>
                        </div>
                        <Progress
                          value={Math.min(result.marketSentiment.orderBookRatio * 50, 100)}
                          className={result.marketSentiment.orderBookRatio > 1 ? "bg-green-100" : "bg-red-100"}
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Social Sentiment</span>
                          <span className="text-sm">
                            {result.marketSentiment.tweetSentiment.positive} positive /{" "}
                            {result.marketSentiment.tweetSentiment.negative} negative
                          </span>
                        </div>
                        <div className="flex h-2 overflow-hidden rounded bg-muted">
                          <div
                            className="bg-green-500"
                            style={{
                              width: `${
                                (result.marketSentiment.tweetSentiment.positive /
                                  (result.marketSentiment.tweetSentiment.positive +
                                    result.marketSentiment.tweetSentiment.negative +
                                    result.marketSentiment.tweetSentiment.neutral)) *
                                100
                              }%`,
                            }}
                          />
                          <div
                            className="bg-red-500"
                            style={{
                              width: `${
                                (result.marketSentiment.tweetSentiment.negative /
                                  (result.marketSentiment.tweetSentiment.positive +
                                    result.marketSentiment.tweetSentiment.negative +
                                    result.marketSentiment.tweetSentiment.neutral)) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Funding Rate</span>
                          <span className={result.marketSentiment.fundingRate > 0 ? "text-green-600" : "text-red-600"}>
                            {(result.marketSentiment.fundingRate * 100).toFixed(4)}%
                          </span>
                        </div>
                        <Progress
                          value={50 + result.marketSentiment.fundingRate * 5000}
                          className={result.marketSentiment.fundingRate > 0 ? "bg-green-100" : "bg-red-100"}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="full" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Full AI Analysis</CardTitle>
                    <CardDescription>Detailed market analysis and trading recommendations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-secondary rounded-md shadow-inner">
                      <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
                        {result.analysis.split("\n").map((paragraph, index) => (
                          <p key={index} className="mb-2 last:mb-0">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="text-sm text-muted-foreground">
                    Analysis generated at {new Date(result.timestamp).toLocaleString()}
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

