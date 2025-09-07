"use client";
import Navbar from "./components/Navbar";
import Article from "./components/Article";
import Post from "./components/Post";
import { db, auth } from "./lib/firebase";
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
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUsername(userData.username || "Trader");
            setImgURL(userData.avatar || "");
          } else {
            setUsername("Trader");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUsername("Trader");
        }
      };

      fetchUsername();
    } else {
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
      {user ? (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
          <div className="max-w-6xl mx-auto">
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
      ) : (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
          <div className="max-w-3xl w-full text-center">
            <h1 className="text-4xl font-extrabold text-gray-800 mb-4">
              Forex Trading Inspiration
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Unlock your trading potential with daily quotes, tips, and motivation from top traders.
            </p>
            <div className="flex justify-center space-x-4">
              <a
                href="/signup"
                className="px-6 py-3 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition"
              >
                Get Started
              </a>
              <a
                href="/login"
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md shadow hover:bg-gray-300 transition"
              >
                Log In
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}