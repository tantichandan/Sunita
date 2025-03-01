"use client";

import { useState } from "react";

export default function FetchTweets() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchTweets = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/firebase"); // ✅ API Route
      const data = await response.json();

      if (response.ok) {
        if (data.storedTweets.length > 0) {
          setMessage(`✅Updated, refresh the page`);
        } else {
          setMessage("ℹ️ No new tweets found.");
        }
      } else {
        setMessage("❌ Failed to fetch tweets.");
      }
    } catch (error) {
      setMessage("❌ Error fetching tweets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <button
        onClick={fetchTweets}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400"
        disabled={loading}
      >
        {loading ? "Fetching..." : "Fetch Solana Tweets"}
      </button>

      {message && <p className="text-lg">{message}</p>}
    </div>
  );
}
