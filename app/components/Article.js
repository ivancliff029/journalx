"use client";

import React, { useState } from 'react';

const Article = ({ article }) => {
  const {
    content,           // Always exists
    username = 'Anonymous', // ✅ Renamed from "author" → matches Post.js
    timestamp,         // Exists if saved
    type = 'user-post', // Default if not set
    imageUrl = '',     // Optional
  } = article;

  const [likes, setLikes] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);

  const handleLike = () => setLikes((prev) => prev + 1);
  const handleBookmark = () => setBookmarked((prev) => !prev);

  const handleShare = () => {
    const shareText = `${content} — ${username}${timestamp ? ` · ${new Date(timestamp).toLocaleDateString()}` : ''}`;
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
      {imageUrl && (
        <div className="h-40 sm:h-48 overflow-hidden relative">
          <img
            src={imageUrl}
            alt="Post visual"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        </div>
      )}

      {/* Content */}
      <div className={`p-5 ${!imageUrl ? 'bg-gradient-to-r from-amber-50 to-yellow-50' : ''}`}>
        {/* Type Badge */}
        <div className="mb-3">{getTypeBadge()}</div>

        {/* Content (no title support — Post.js doesn't save it) */}
        <blockquote className="text-gray-700 leading-relaxed mb-4 text-base">
          {content}
        </blockquote>

        {/* Author (username) + Timestamp */}
        <footer className="text-sm text-gray-500 font-medium flex flex-wrap items-center gap-x-2 gap-y-1 pt-2 border-t border-gray-100 mt-3">
          <span>— {username}</span>
          {timestamp && (
            <span className="text-gray-400">• {formatDate(timestamp)}</span>
          )}
        </footer>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center px-5 py-3 bg-gray-50 border-t border-gray-100">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${
            likes > 0
              ? 'bg-red-100 text-red-600'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          aria-label={`${likes} likes`}
        >
          <span aria-hidden="true">❤️</span>
          <span>{likes}</span>
        </button>

        <div className="flex gap-3">
          <button
            onClick={handleBookmark}
            className="text-gray-600 hover:text-yellow-600 transition-colors"
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark this post"}
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