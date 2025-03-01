import { NextResponse } from "next/server";
import { tweetsCollection } from "@/lib/firebase"; // ✅ Firestore reference
import { firestore } from "firebase-admin"; // Import firestore

// Helper function to convert a string date to Firestore Timestamp
function convertToTimestamp(dateString: string): firestore.Timestamp | null {
  if (!dateString) {
    console.error("Date string is empty or undefined.");
    return null; // Return null if the date is missing
  }

  const date = new Date(dateString);  // Convert string to JavaScript Date

  // If the date is invalid, return null
  if (isNaN(date.getTime())) {
    console.error("Invalid date string:", dateString);
    return null; // Return null if the date is invalid
  }

  return firestore.Timestamp.fromDate(date);  // Convert to Firestore Timestamp
}

export async function GET() {
  try {
    // Fetch all the tweets
    const snapshot = await tweetsCollection.get(); 

    // Map the tweets and convert the 'created_at' string to Timestamp
    const tweets = snapshot.docs
      .map((doc) => {
        const data = doc.data();

        // Log the full document to check the structure
        console.log("Full document:", doc.id, data); 

        // Check if created_at exists inside the legacy field
        const createdAtString = data?.legacy?.created_at;

        // If created_at is missing, use the current date as a fallback
        if (!createdAtString) {
          console.warn("Missing 'created_at' field for tweet:", doc.id);
          return null; // Skip tweet if 'created_at' is missing
        }

        // Convert created_at string to Timestamp
        const createdAtTimestamp = convertToTimestamp(createdAtString);

        if (!createdAtTimestamp) {
          console.error("Skipping tweet due to invalid created_at:", createdAtString);
          return null; // Skip invalid tweets
        }

        return {
          id: doc.id,
          created_at: createdAtTimestamp, // Store the Timestamp
          ...data,
        };
      })
      .filter((tweet) => tweet !== null) // Remove null (invalid) tweets from the array
      .sort((a, b) => b.created_at.seconds - a.created_at.seconds); // Sort by the timestamp in descending order

    return NextResponse.json({ success: true, tweets }, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching tweets from Firestore:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch tweets" }, { status: 500 });
  }
}
