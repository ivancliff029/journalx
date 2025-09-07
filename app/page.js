"use client";
import Navbar from "./components/Navbar";
import Article from "./components/Article";
import Post from "./components/Post";
import { db,auth } from "./lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  doc,
  getDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export default function Home() {
  const [user, loadingAuth, errorAuth] = useAuthState(auth);
  const [imgURL, setImgURL] = useState('');
  const [username, setUsername] = useState('');
   useEffect(() => {
    if (user) {
      const fetchUsername = async () => {
        try {
          const userDocRef = doc(db, "users", user.uid); // Reference to user's Firestore doc
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUsername(userData.username || "Trader");
            setImgURL(userData.avatar || ""); // Fallback if imgURL is missing
          } else {
            setUsername("Trader"); // No user doc found
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUsername("Trader");
        } 
      };

      fetchUsername();
    } else {
      // No authenticated user
      setUsername("Trader");
    }
  }, [user, db]);

   const name = username || "Trader";

  const posts = [
    {
      type: "quote",
      content:
        "The goal of a successful trader is to make the best trades. Money is a consequence.",
      author: "Paul Tudor Jones",
      imageUrl:
        "https://via.placeholder.com/400x200/1e40af/ffffff?text=Forex+Mastery",
    },
    {
      type: "tip",
      title: "Risk Management Tip",
      content:
        "Never risk more than 1-2% of your trading capital on a single trade. Protect your account first.",
      author: "Pro Trader Rule",
    },
    {
      type: "motivation",
      content:
        "Losses are tuition. Every losing trade teaches you something. Stay disciplined.",
      author: "Anonymous",
      imageUrl:
        "https://via.placeholder.com/400x200/7c3aed/ffffff?text=Stay+Strong",
    },
    {
      type: "info",
      title: "Did You Know?",
      content:
        "Over 90% of retail traders lose money. The top 10% win by having a journal, plan, and discipline.",
    },
  ];
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Stay Inspired. Stay Disciplined.
          </h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-6">
            Welcome back, {name}!
          </h2>
          <Post userImgURL={imgURL} />
          <div className="">
            {posts.map((post, index) => (
              <Article key={index} article={post} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
