"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SolanaAnalyzer() {
  const [analysis, setAnalysis] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)

  const analyzeSolana = async () => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch("/api/analyze-solana", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze Solana data")
      }

      setAnalysis(data.analysis)
    } catch (error) {
      console.error("Error analyzing Solana data:", error)
      setError(error instanceof Error ? error.message : "An error occurred while analyzing Solana data")
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Solana Market Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={analyzeSolana} disabled={isAnalyzing} className="w-full sm:w-auto">
          {isAnalyzing ? "Analyzing..." : "Analyze Solana Data"}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {analysis && !error && (
          <div className="mt-4 p-4 bg-secondary rounded-md">
            <h3 className="font-semibold mb-2">Analysis Result:</h3>
            <p className="whitespace-pre-wrap">{analysis}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

