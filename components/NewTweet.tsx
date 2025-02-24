"use client"

import { useState } from "react"
import { AlertCircle, Loader2 } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Tweet {
  id: string
  text: string
  author: {
    name: string
    username: string
    profileImage: string
  }
  createdAt: string
}

export default function NewestTweets() {
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTweets = async () => {
    setLoading(true)  // Show loading state
    setError(null)    // Clear previous errors
  
    try {
      const response = await fetch("/api/solana")  // Call the API
      console.log("Fetching tweets... Response Status:", response.status)  // Log API response status
  
      const data = await response.json()  // Convert response to JSON
      console.log("Fetched Data:", data)  // Log the whole response to check
  
      // Check if "results" exist and have tweets
      if (!data || !data.results || data.results.length === 0) {
        console.warn("No tweets found in response:", data)  // Log warning
        setTweets([])  // Set empty list
        return
      }
  
      // 🔥 Extract tweets from each user inside "results"
      const extractedTweets = data.results.flatMap((user: any) =>
        user.tweets.map((tweet: any) => ({
          id: tweet.rest_id,  // Tweet ID
          text: tweet.legacy?.full_text || "No text available",  // Tweet text
          author: {
            name: tweet.core?.user_results?.result?.legacy?.name || "Unknown",  // Name of author
            username: tweet.core?.user_results?.result?.legacy?.screen_name || "Unknown",  // Twitter handle
            profileImage: tweet.core?.user_results?.result?.legacy?.profile_image_url_https || "",  // Profile picture
          },
          createdAt: tweet.legacy?.created_at || "",  // When it was posted
        }))
      )
  
      console.log("Extracted Tweets:", extractedTweets)  // Log extracted tweets
      setTweets(extractedTweets)  // Update the state with tweets
    } catch (err: any) {
      console.error("Error fetching tweets:", err)  // Log errors
      setError(err.message || "Failed to fetch tweets")  // Show error message
    } finally {
      setLoading(false)  // Stop loading
    }
  }
  

  return (
    <div className="mx-auto max-w-2xl p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold">Latest Tweets</CardTitle>
          <Button onClick={fetchTweets} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching...
              </>
            ) : (
              "Fetch Tweets"
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && !error && tweets.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">No Solana-related tweets found.</p>
          )}

          <div className="space-y-4">
            {tweets.map((tweet) => (
              <Card key={tweet.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <Avatar>
                      <AvatarImage src={tweet.author.profileImage} alt={tweet.author.name} />
                      <AvatarFallback>{tweet.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium leading-none">{tweet.author.name}</p>
                        <p className="text-sm text-muted-foreground">@{tweet.author.username}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tweet.createdAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                      <p className="text-sm">{tweet.text}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
