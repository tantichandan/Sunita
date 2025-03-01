"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FetchTweets from "./FirebaseTweets";

interface Tweet {
  id: string;
  text: string;
  author: {
    name: string;
    username: string;
    profileImage: string;
  };
  createdAt: string;
}

export default function NewestTweets1() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch tweets on initial load
  useEffect(() => {
    fetchTweets();
  }, []);

  const fetchTweets = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/firebase1");
      console.log("Fetching tweets... Response Status:", response.status);

      const data = await response.json();
      console.log("Fetched Data:", data);

      // Ensure data structure is correct and tweets exist
      if (!data.success || !Array.isArray(data.tweets) || data.tweets.length === 0) {
        console.warn("No tweets found in response:", data);
        setTweets([]);
        return;
      }

      // 🔥 Extract tweets from the fetched data
      const extractedTweets = data.tweets.map((tweet: any) => ({
        id: tweet.id ?? "unknown", // Fallback if ID is missing
        text: tweet.legacy?.full_text ?? "No text available", // Extracting text
        author: {
          name: tweet.core?.user_results?.result?.legacy?.name ?? "Unknown", // Extracting user name
          username: tweet.core?.user_results?.result?.legacy?.screen_name ?? "Unknown", // Extracting username
          profileImage: tweet.core?.user_results?.result?.legacy?.profile_image_url_https ?? "", // Extracting profile image URL
        },
        createdAt: tweet.legacy?.created_at ?? "", // Tweet creation date
      }));

      console.log("Extracted Tweets:", extractedTweets);

      // Update state with the extracted tweets
      setTweets(extractedTweets);
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
          <FetchTweets/>
        
        </CardHeader>

        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && !error && tweets.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">No tweets found.</p>
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
  );
}
