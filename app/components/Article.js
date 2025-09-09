"use client";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import {
  addDoc,
  doc,
  collection,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { serverTimestamp } from 'firebase/firestore';

const Article = ({ article, imgURL }) => {
  const {
    content,
    username = 'Anonymous',
    timestamp,
    type = 'user-post',
    imageUrl = '',
  } = article;

  const [user] = useAuthState(auth);
  const userId = user ? user.uid : null;
  const [likes, setLikes] = useState(0);
  const [userHasLiked, setUserHasLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch likes count and check if current user has liked
  useEffect(() => {
    if (!article.id) return;

    const likesCollectionRef = collection(db, 'posts', article.id, 'likes');

    // Set up real-time listener for likes
    const unsubscribe = onSnapshot(likesCollectionRef, (snapshot) => {
      const likesCount = snapshot.size;
      setLikes(likesCount);

      // Check if current user has liked this post
      if (userId) {
        const userLike = snapshot.docs.find(doc => doc.data().userId === userId);
        setUserHasLiked(!!userLike);
      }
    }, (error) => {
      console.error('Error fetching likes:', error);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [article.id, userId]);

  const handleLike = async () => {
    if (!userId || !article.id || loading) {
      if (!userId) {
        alert('Please sign in to like posts!');
      }
      return;
    }

    // Prevent duplicate likes
    if (userHasLiked) {
      alert('You already liked this post!');
      return;
    }

    setLoading(true);

    try {
      // Double-check to prevent race conditions - query for existing like
      const likesRef = collection(db, 'posts', article.id, 'likes');
      const userLikeQuery = query(likesRef, where('userId', '==', userId));
      const existingLikes = await getDocs(userLikeQuery);

      if (!existingLikes.empty) {
        alert('You already liked this post!');
        setUserHasLiked(true); // Update state to match reality
        return;
      }

      // Add like to subcollection
      await addDoc(collection(db, 'posts', article.id, 'likes'), {
        userId,
        timestamp: serverTimestamp(),
      });

      // Note: The real-time listener will update the UI automatically
      alert('You liked this post!');
    } catch (error) {
      console.error('Error adding like:', error);
      alert('Failed to like post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = () => setBookmarked((prev) => !prev);

  const handleShare = () => {
    const shareText = `${content} — ${username}${timestamp ? ` · ${new Date(timestamp).toLocaleDateString()}` : ''
      }`;
    if (navigator.share) {
      navigator.share({
        title: 'Forex Post',
        text: shareText,
        url: window.location.href,
      }).catch(() => alert('Share failed.'));
    } else {
      navigator.clipboard
        .writeText(`${shareText}\n\nShared via your Forex Journal`)
        .then(() => alert('Copied to clipboard!'))
        .catch(() => alert('Failed to copy.'));
    }
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Map type to badge
  const getTypeBadge = () => {
    switch (type) {
      case 'tip':
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
            💡 Tip
          </span>
        );
      case 'info':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
            📊 Insight
          </span>
        );
      case 'motivation':
        return (
          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
            🔥 Motivation
          </span>
        );
      case 'quote':
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
            📜 Quote
          </span>
        );
      case 'user-post':
      default:
        return (
          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-full">
            📝 User Post
          </span>
        );
    }
  };

  return (
    <article className="w-full m-2 mx-auto bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-100">
      {/* Optional Image */}

      {/* Content */}
      <div className={`p-5 flex gap-3 ${!imageUrl ? 'bg-gradient-to-r from-amber-50 to-yellow-50' : ''}`}>
        <img
          src={
            imgURL ||
            "https://via.placeholder.com/150?text=User" // Fallback if no image
          }
          alt="Your avatar"
          className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700 flex-shrink-0"
        />
        {/* Type Badge */}

        {/* Content */}
        <blockquote className="text-gray-700 leading-relaxed mb-4 text-base">
          {content}
        </blockquote>

        {/* Author + Timestamp */}
      <div className="flex flex-col items-start flex-1">
        <footer className="text-sm text-gray-500 font-medium flex flex-wrap items-center gap-x-2 gap-y-1 pt-2 border-t border-gray-100 mt-3">
          <span>— {username}</span>
          {timestamp && (
            <span className="text-gray-400">• {formatDate(timestamp)}</span>
          )}
        </footer>
      </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center px-5 py-3 bg-gray-50 border-t border-gray-100">
        <button
          onClick={handleLike}
          disabled={loading}
          className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 ${userHasLiked
            ? 'bg-red-100 text-red-600'
            : likes > 0
              ? 'bg-red-50 text-red-500 hover:bg-red-100'
              : 'text-gray-600 hover:bg-gray-200'
            }`}
          aria-label={`${likes} likes`}
        >
          <span aria-hidden="true">{userHasLiked ? '❤️' : '🤍'}</span>
          <span>{loading ? '...' : likes}</span>
        </button>

        <div className="flex gap-3">
          <button
            onClick={handleBookmark}
            className="text-gray-600 hover:text-yellow-600 transition-colors"
            aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this post'}
          >
            <span className="text-xl" aria-hidden="true">
              {bookmarked ? '⭐' : '✩'}
            </span>
          </button>

          <button
            onClick={handleShare}
            className="text-gray-600 hover:text-green-600 transition-colors"
            aria-label="Share this post"
          >
            <span className="text-lg" aria-hidden="true">📤</span>
          </button>
        </div>
      </div>
    </article>
  );
};

export default Article;