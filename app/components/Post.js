"use client";
import { auth, db } from "../lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { addDoc, collection } from "firebase/firestore";
import { useState } from "react";

export default function Post({ userImgURL }) {
  const [user, loadingAuth, errorAuth] = useAuthState(auth);
  const [content, setContent] = useState('');

  const storeData = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("You must be logged in to post.");
      return;
    }

    if (!content.trim()) {
      alert("Post content cannot be empty.");
      return;
    }

    try {
    
      await addDoc(collection(db, "users", user.uid, "posts"), {
        content: content.trim(),
        timestamp: new Date(),
      });
      setContent('');
      alert("Post shared successfully!");
    } catch (error) {
      console.error("Error storing post data:", error);
      alert("Failed to share post. Please try again.");
    }
  };

  if (loadingAuth) {
    return (
      <div className="w-full mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-300 h-10 w-10"></div>
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-4">
          <form onSubmit={storeData} className="space-y-4">
            {/* Post Input Area with Avatar */}
            <div className="flex gap-3">
              {/* Round Avatar */}
              <img
                src={
                  userImgURL ||
                  "https://via.placeholder.com/150?text=User" // Fallback if no image
                }
                alt="Your avatar"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700 flex-shrink-0"
              />

              {/* Textarea Container */}
              <div className="flex-1">
                <textarea
                  onChange={(e) => setContent(e.target.value)}
                  value={content}
                  className="w-full p-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 
                         bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 
                         rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 
                         focus:border-transparent transition-all duration-200 text-base leading-relaxed
                         min-h-[120px] sm:min-h-[100px]"
                  rows="4"
                  placeholder="What's on your mind?"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  aria-label="Add photo"
                >
                  📷
                </button>
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  aria-label="Add emoji"
                >
                  😊
                </button>
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  aria-label="Add location"
                >
                  📍
                </button>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 
                           hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg 
                           transition-all duration-200 transform hover:scale-105 active:scale-95
                           shadow-md hover:shadow-lg focus:outline-none focus:ring-2 
                           focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                disabled={!user || content.trim().length === 0}
              >
                Share Post
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}