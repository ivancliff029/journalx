"use client";
import Navbar from "./components/Navbar";
import Article from "./components/Article";
import Post from "./components/Post";
import { db, auth } from "./lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export default function Home() {
  const [user, loadingAuth, errorAuth] = useAuthState(auth);
  const [imgURL, setImgURL] = useState('');
  const [username, setUsername] = useState('');
  const [posts, setPosts] = useState([]); 
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Fetch user profile
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

  
  useEffect(() => {
  setLoadingPosts(true);

  const parseTimestamp = (ts) => {
    if (!ts) return new Date();
    if (ts.toDate) return ts.toDate();
    if (ts instanceof Date) return ts;
    if (typeof ts === 'string') return new Date(ts);
    return new Date();
  };

  const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const postsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type || "user-post",
          content: data.content || "",
          username: data.username || "Anonymous", 
          imageUrl: data.imageUrl || "",
          timestamp: parseTimestamp(data.timestamp),
        };
      });
      setPosts(postsData);
      setLoadingPosts(false);
    },
    (error) => {
      console.error("Error fetching posts:", error);
      setLoadingPosts(false);
    }
  );

  return () => unsubscribe();
}, [db]);

  const name = username || "Trader";

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
            <div className="space-y-6 mt-8">
              {loadingPosts ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">Loading posts...</p>
                </div>
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <Article key={post.id} article={post} />
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">No posts yet. Be the first to share!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            backgroundImage: `url('/img/welcome.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          className="min-h-screen flex flex-col justify-center items-center bg-black bg-opacity-50 py-8 px-4"
        >
          <div className="max-w-3xl w-full text-center backdrop-blur-sm bg-white/10 p-8 rounded-xl">
            <h1 className="text-4xl font-extrabold text-white mb-4">
              Forex Trading Inspiration
            </h1>
            <p className="text-lg text-white/90 mb-8">
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