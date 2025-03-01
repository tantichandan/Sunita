import { NextResponse } from "next/server";
import { tweetsCollection } from "@/lib/firebase";
import dotenv from "dotenv";

dotenv.config();

// Twitter User IDs to Monitor
const userIds = [
  "109108987", // Andrew
  "1424905944857722887", // Solana master
  "276810355", // Armani
  "731402158512476161", // Sensei
  "1845659330500231169",
  "1379774059840344064",
  "951329744804392960",
  "4718237894",
];

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function fetchSolanaTweets(userId: string) {
  const url = `https://twitter241.p.rapidapi.com/user-tweets?user=${userId}&count=80&query=solana`;

  const headers = {
    "X-RapidAPI-Key": process.env.NEXT_PUBLIC_RAPIDAPI_KEY!,
    "X-RapidAPI-Host": "twitter241.p.rapidapi.com",
  };

  try {
    const response = await fetch(url, { headers });
    const data = await response.json();

    const tweets =
      data?.result?.timeline?.instructions
        ?.flatMap((instruction: any) =>
          instruction.entries?.flatMap((entry: any) =>
            entry.content?.itemContent?.tweet_results?.result
              ? [entry.content.itemContent.tweet_results.result]
              : []
          ) || []
        )
        ?.filter((tweet: any) => tweet.legacy?.full_text?.toLowerCase().includes("solana")) || [];

    return { userId, tweets };
  } catch (error) {
    console.error(`Error fetching tweets for ${userId}:`, error);
    return { userId, tweets: [] };
  }
}

// ✅ Function to Store Tweets in Firestore
async function storeTweets(tweets: any[]) {
  for (const tweet of tweets) {
    const tweetRef = tweetsCollection.doc(tweet.rest_id);
    const exists = await tweetRef.get();

    if (!exists.exists) {
      await tweetRef.set(tweet); // Store tweet in Firestore
      console.log(`✅ New Solana tweet stored: ${tweet.legacy?.full_text}`);
    }
  }
}

// ✅ API Route to Fetch and Store Tweets
export async function GET() {
  try {
    const allTweets: any[] = [];

    for (const userId of userIds) {
      const { tweets } = await fetchSolanaTweets(userId);
      await storeTweets(tweets); // ✅ Store tweets in Firestore
      allTweets.push(...tweets);
      await delay(2000); // Wait 2 seconds before checking the next user
    }

    return NextResponse.json({ success: true, storedTweets: allTweets }, { status: 200 });
  } catch (error) {
    console.error("❌ Error storing tweets:", error);
    return NextResponse.json({ error: "Failed to store tweets" }, { status: 500 });
  }
}
