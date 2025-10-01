"use client";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  orderBy,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { useState, useEffect, useRef } from 'react';
import { serverTimestamp } from 'firebase/firestore';
import { 
  FiHeart, 
  FiMessageCircle, 
  FiShare2, 
  FiBookmark, 
  FiMoreHorizontal,
  FiCalendar,
  FiUser,
  FiSend,
  FiX
} from 'react-icons/fi';
import { 
  FaHeart, 
  FaRegHeart, 
  FaBookmark, 
  FaRegBookmark,
  FaShare,
  FaChartLine,
  FaLightbulb,
  FaFire,
  FaQuoteRight
} from 'react-icons/fa';

const Article = ({ article, imgURL }) => {
  const {
    content,
    username = 'Anonymous Trader',
    timestamp,
    type = 'user-post',
    imageUrl = '',
    id: articleId
  } = article;

  const [user] = useAuthState(auth);
  const userId = user ? user.uid : null;
  const [likes, setLikes] = useState(0);
  const [userHasLiked, setUserHasLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const commentsEndRef = useRef(null);

  // Fetch likes count and check if current user has liked
  useEffect(() => {
    if (!articleId) return;

    const likesCollectionRef = collection(db, 'posts', articleId, 'likes');

    // Set up real-time listener for likes
    const unsubscribeLikes = onSnapshot(likesCollectionRef, (snapshot) => {
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

    // Cleanup listeners on unmount
    return () => {
      unsubscribeLikes();
    };
  }, [articleId, userId]);

  // Fetch comments when comments section is opened
  useEffect(() => {
    if (!articleId || !showComments) return;

    const commentsCollectionRef = collection(db, 'posts', articleId, 'comments');
    const commentsQuery = query(commentsCollectionRef, orderBy('timestamp', 'asc'));

    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(commentsData);
    }, (error) => {
      console.error('Error fetching comments:', error);
    });

    return () => unsubscribeComments();
  }, [articleId, showComments]);

  // Scroll to bottom when new comments are added
  useEffect(() => {
    if (showComments && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, showComments]);

  const handleLike = async () => {
    if (!userId || !articleId || loading) {
      if (!userId) {
        console.log('Please sign in to like posts');
      }
      return;
    }

    setLoading(true);

    try {
      // Double-check to prevent race conditions
      const likesRef = collection(db, 'posts', articleId, 'likes');
      const userLikeQuery = query(likesRef, where('userId', '==', userId));
      const existingLikes = await getDocs(userLikeQuery);

      if (!existingLikes.empty) {
        setUserHasLiked(true);
        return;
      }

      // Add like to subcollection
      await addDoc(collection(db, 'posts', articleId, 'likes'), {
        userId,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error adding like:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!userId) {
      console.log('Please sign in to bookmark posts');
      return;
    }
    setBookmarked(prev => !prev);
    // TODO: Implement actual bookmark functionality with Firestore
  };

  const handleShare = async () => {
    const shareText = `${content} — ${username}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Trading Insight',
          text: shareText,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        console.log('Copied to clipboard!');
      }
    } catch (error) {
      console.log('Share cancelled or failed');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!userId || !newComment.trim() || commentLoading) return;

    setCommentLoading(true);

    try {
      await addDoc(collection(db, 'posts', articleId, 'comments'), {
        userId,
        userEmail: user.email,
        username: user.displayName || 'Anonymous',
        content: newComment.trim(),
        timestamp: serverTimestamp(),
      });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!userId) return;

    try {
      const commentRef = doc(db, 'posts', articleId, 'comments', commentId);
      await deleteDoc(commentRef);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - d);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)}w ago`;
    
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCommentDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Map type to badge configuration
  const getTypeConfig = () => {
    const configs = {
      'tip': {
        label: 'Trading Tip',
        icon: FaLightbulb,
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        textColor: 'text-blue-600 dark:text-blue-400',
        borderColor: 'border-blue-200 dark:border-blue-800'
      },
      'info': {
        label: 'Market Insight',
        icon: FaChartLine,
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        textColor: 'text-green-600 dark:text-green-400',
        borderColor: 'border-green-200 dark:border-green-800'
      },
      'motivation': {
        label: 'Motivation',
        icon: FaFire,
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        textColor: 'text-purple-600 dark:text-purple-400',
        borderColor: 'border-purple-200 dark:border-purple-800'
      },
      'quote': {
        label: 'Wisdom',
        icon: FaQuoteRight,
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        textColor: 'text-amber-600 dark:text-amber-400',
        borderColor: 'border-amber-200 dark:border-amber-800'
      },
      'user-post': {
        label: 'Community Post',
        icon: FiUser,
        bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
        textColor: 'text-indigo-600 dark:text-indigo-400',
        borderColor: 'border-indigo-200 dark:border-indigo-800'
      }
    };

    return configs[type] || configs['user-post'];
  };

  const typeConfig = getTypeConfig();
  const TypeIcon = typeConfig.icon;

  return (
    <article className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden group">
      
      {/* Header with User Info and Type Badge */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={imgURL || "https://img.icons8.com/?size=100&id=4lGHVfnlCeBX&format=png&color=000000"}
                alt={`${username}'s avatar`}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-gray-700 shadow-sm"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
            </div>
            
            <div className="flex flex-col">
              <span className="font-semibold text-gray-900 dark:text-white text-sm">
                {username}
              </span>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <FiCalendar className="w-3 h-3" />
                <span>{formatDate(timestamp)}</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiMoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <blockquote className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg font-light mb-2">
          {content}
        </blockquote>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Like Button */}
            <button
              onClick={handleLike}
              disabled={loading}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 ${
                userHasLiked
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {userHasLiked ? (
                <FaHeart className="w-4 h-4 fill-current" />
              ) : (
                <FaRegHeart className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{likes}</span>
            </button>

            {/* Comment Button */}
            <button 
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 ${
                showComments
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <FiMessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{comments.length}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Bookmark Button */}
            <button
              onClick={handleBookmark}
              className={`p-2 rounded-lg transition-all duration-200 ${
                bookmarked
                  ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {bookmarked ? (
                <FaBookmark className="w-4 h-4 fill-current" />
              ) : (
                <FaRegBookmark className="w-4 h-4" />
              )}
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            >
              <FaShare className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          {/* Comments List */}
          <div className="max-h-80 overflow-y-auto">
            {comments.length > 0 ? (
              <div className="p-4 space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 group">
                    <img
                      src={imgURL || "https://img.icons8.com/?size=100&id=4lGHVfnlCeBX&format=png&color=000000"}
                      alt={`${comment.username}'s avatar`}
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl rounded-tl-none px-4 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-gray-900 dark:text-white">
                            {comment.username}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatCommentDate(comment.timestamp?.toDate())}
                            </span>
                            {userId === comment.userId && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all duration-200"
                              >
                                <FiX className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={commentsEndRef} />
              </div>
            ) : (
              <div className="p-8 text-center">
                <FiMessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No comments yet. Be the first to comment!
                </p>
              </div>
            )}
          </div>

          {/* Add Comment Form */}
          {userId ? (
            <form onSubmit={handleAddComment} className="p-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex gap-3">
                <img
                  src={imgURL || "https://img.icons8.com/?size=100&id=4lGHVfnlCeBX&format=png&color=000000"}
                  alt="Your avatar"
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    disabled={commentLoading}
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || commentLoading}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-full transition-colors duration-200 flex items-center gap-2 text-sm"
                  >
                    {commentLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FiSend className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Please sign in to comment
              </p>
            </div>
          )}
        </div>
      )}

      {/* Engagement Metrics */}
      <div className="px-6 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-750 dark:to-gray-800 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{likes} likes • {comments.length} comments</span>
          <span className="text-gray-400 dark:text-gray-500">•</span>
        </div>
      </div>
    </article>
  );
};

export default Article;