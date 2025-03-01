import { NextResponse } from "next/server";
import dotenv from "dotenv";

dotenv.config();

const userIds = [
  "109108987", // Andrew
  "1424905944857722887", // Solana master
  "276810355", // Armani
  "731402158512476161", // Sensei
  "1845659330500231169",
  "1379774059840344064",
  "951329744804392960",
  "4718237894",
   // Elon Musk
  // Donald Trump
];

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function fetchSolanaTweets(userId: string) {
  const url = `https://twitter241.p.rapidapi.com/user-tweets?user=${userId}&count=18&query=solana`;

  const headers = {
    "X-RapidAPI-Key": process.env.NEXT_PUBLIC_RAPIDAPI_KEY as string,
    "X-RapidAPI-Host": "twitter241.p.rapidapi.com",
  };

  try {
    const response = await fetch(url, { headers });
    const data = await response.json();

    // Extract Solana tweets
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

export async function GET() {
  const results = [];

  for (const userId of userIds) {
    const result = await fetchSolanaTweets(userId);
    results.push(result);
    await delay(2000); // Wait 1 second to avoid rate limits
  }

  return NextResponse.json({ results }, { status: 200 });
}
