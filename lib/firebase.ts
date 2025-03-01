import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";

dotenv.config();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_SDK!)), // ✅ Load credentials
  });
}

const db = getFirestore(); // ✅ Initialize Firestore
const tweetsCollection = db.collection("tweets"); // ✅ Ensure Firestore reference exists

export { db, tweetsCollection };
