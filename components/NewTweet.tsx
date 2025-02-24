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
    setLoading(true);
    setError(null);
  
    try {
      const response = await fetch("/api/solana");
      console.log("Fetching tweets... Response Status:", response.status);
  
      const data = await response.json();
      console.log("Fetched Data:", data);
  
      // Check if "results" exist and contain tweets
      if (!data || !data.results || !Array.isArray(data.results) || data.results.length === 0) {
        console.warn("No tweets found in response:", data);
        setTweets([]);
        return;
      }
  
      // 🔥 Extract tweets safely
      const extractedTweets = data.results.flatMap((user: any) =>
        user.tweets?.map((tweet: any) => ({
          id: tweet?.rest_id ?? "unknown",
          text: tweet?.legacy?.full_text ?? "No text available",
          author: {
            name: tweet?.core?.user_results?.result?.legacy?.name ?? "Unknown",
            username: tweet?.core?.user_results?.result?.legacy?.screen_name ?? "Unknown",
            profileImage: tweet?.core?.user_results?.result?.legacy?.profile_image_url_https ?? "",
          },
          createdAt: tweet?.legacy?.created_at ?? "",
        })) ?? [] // Ensure empty array if tweets are undefined
      );
  
      console.log("Extracted Tweets:", extractedTweets);
  
      // Ensure extractedTweets is a valid array before proceeding
      if (!Array.isArray(extractedTweets) || extractedTweets.length === 0) {
        console.warn("Extracted tweets is empty or invalid:", extractedTweets);
        setTweets([]);
        return;
      }
  
      // 🔥 Keep only the latest tweet per user
      const latestTweetsMap = new Map<string, Tweet>();
  
      extractedTweets.forEach((tweet) => {
        if (!tweet || !tweet.author?.username) return; // Ensure valid tweet
  
        const existingTweet = latestTweetsMap.get(tweet.author.username);
  
        if (!existingTweet || new Date(tweet.createdAt) > new Date(existingTweet.createdAt)) {
          latestTweetsMap.set(tweet.author.username, tweet);
        }
      });
  
      const latestTweets = Array.from(latestTweetsMap.values());
      console.log("Latest Tweets Per User:", latestTweets);
  
      setTweets(latestTweets);
    } catch (err: any) {
      console.error("Error fetching tweets:", err);
      setError(err.message || "Failed to fetch tweets");
    } finally {
      setLoading(false);
    }
  };
  
  

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
