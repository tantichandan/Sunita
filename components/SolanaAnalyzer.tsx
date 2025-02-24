"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

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
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl md:text-3xl font-bold text-primary">Solana Market Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            onClick={analyzeSolana}
            disabled={isAnalyzing}
            className="w-full sm:w-auto mx-auto flex items-center justify-center"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze Solana Data"
            )}
          </Button>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {analysis && !error && (
            <div className="mt-6 p-4 bg-secondary rounded-md shadow-inner">
              <h3 className="font-semibold text-lg mb-3 text-primary">Analysis Result:</h3>
              <div className="prose prose-sm sm:prose-base max-w-none">
                {analysis.split("\n").map((paragraph, index) => (
                  <p key={index} className="mb-2 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

