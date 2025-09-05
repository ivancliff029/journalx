"use client"

import React, { useState } from 'react';

const Article = ({ article }) => {
  const {
    title,
    content,
    imageUrl,
    type = 'quote', // 'quote', 'tip', 'info', 'motivation'
    author,
  } = article;

  const [likes, setLikes] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);

  const handleLike = () => setLikes((prev) => prev + 1);
  const handleBookmark = () => setBookmarked((prev) => !prev);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: title || 'Forex Wisdom',
        text: `${content} — ${author || 'Unknown Trader'}`,
        url: window.location.href,
      }).catch(() => alert('Share failed.'));
    } else {
      navigator.clipboard
        .writeText(`${content} — ${author || 'Unknown Trader'}\n\nShared via your Forex Journal`)
        .then(() => alert('Quote copied to clipboard!'))
        .catch(() => alert('Failed to copy.'));
    }
  };

  // Map type to badge color and label
  const getTypeBadge = () => {
    switch (type) {
      case 'tip':
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
            💡 Tip of the Day
          </span>
        );
      case 'info':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
            📊 Trading Insight
          </span>
        );
      case 'motivation':
        return (
          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
            🔥 Motivation
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
            📜 Quote
          </span>
        );
    }
  };

  return (
    <article
      className={`max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-100`}
    >
      {/* Optional Image */}
      {imageUrl && (
        <div className="h-40 sm:h-48 overflow-hidden relative">
          <img
            src={imageUrl}
            alt={title || 'Forex inspiration'}
            className="w-full h-full object-cover"
          />
          {/* Overlay gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>
      )}

      {/* Content */}
      <div className={`p-5 ${!imageUrl ? 'bg-gradient-to-r from-amber-50 to-yellow-50' : ''}`}>
        {/* Type Badge */}
        <div className="mb-3">{getTypeBadge()}</div>

        {/* Title (optional) */}
        {title && (
          <h2 className="text-xl font-bold text-gray-800 mb-2 leading-tight">{title}</h2>
        )}

        {/* Quote/Content */}
        <blockquote className="text-gray-700 leading-relaxed mb-4 italic">
          "{content}"
        </blockquote>

        {/* Author */}
        {author && (
          <footer className="text-sm text-gray-500 font-medium border-t pt-3 border-gray-200">
            — {author}
          </footer>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center px-5 py-3 bg-gray-50 border-t border-gray-100">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${
            likes > 0
              ? 'bg-red-100 text-red-600'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span>❤️</span> {likes} Like{likes !== 1 ? 's' : ''}
        </button>

        <button
          onClick={handleBookmark}
          className="text-gray-600 hover:text-blue-600 transition-colors"
          title="Bookmark"
        >
          <span className="text-xl">{bookmarked ? '⭐' : '✩'}</span>
        </button>

        <button
          onClick={handleShare}
          className="text-gray-600 hover:text-green-600 transition-colors"
          title="Share"
        >
          <span className="text-lg">📤</span>
        </button>
      </div>
    </article>
  );
};

export default Article;