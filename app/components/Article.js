"use client";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { 
  addDoc, 
  collection, 
  onSnapshot, 
  orderBy, 
  deleteDoc, 
  doc, 
  query 
} from 'firebase/firestore';
import { useState, useEffect, useRef } from 'react';
import { serverTimestamp } from 'firebase/firestore';
import { FiMessageCircle, FiSend, FiX, FiCalendar, FiUser } from 'react-icons/fi';
import { FaHeart, FaRegHeart, FaBookmark, FaRegBookmark, FaShare } from 'react-icons/fa';

const Article = ({ article, imgURL }) => {
  const { content, username = 'Anonymous Trader', timestamp, type = 'user-post', id: articleId } = article;
  const [user] = useAuthState(auth);
  const [likes, setLikes] = useState(0);
  const [userHasLiked, setUserHasLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState({ like: false, comment: false });
  const commentsEndRef = useRef(null);

  // Default avatar URL
  const defaultAvatar = "https://img.icons8.com/?size=100&id=32439&format=png&color=000000";
  const safeImgURL = imgURL || defaultAvatar;

  // Real-time listeners for likes and comments
  useEffect(() => {
    if (!articleId) return;

    const likesUnsubscribe = onSnapshot(
      collection(db, 'posts', articleId, 'likes'),
      (snapshot) => {
        setLikes(snapshot.size);
        if (user) {
          const userLike = snapshot.docs.find(doc => doc.data().userId === user.uid);
          setUserHasLiked(!!userLike);
        }
      }
    );

    const commentsUnsubscribe = onSnapshot(
      query(collection(db, 'posts', articleId, 'comments'), orderBy('timestamp', 'asc')),
      (snapshot) => setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );

    return () => {
      likesUnsubscribe();
      commentsUnsubscribe();
    };
  }, [articleId, user]);

  useEffect(() => {
    if (showComments && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, showComments]);

  const handleLike = async () => {
    if (!user || !articleId || loading.like) return;

    setLoading(prev => ({ ...prev, like: true }));
    try {
      await addDoc(collection(db, 'posts', articleId, 'likes'), {
        userId: user.uid,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error adding like:', error);
    } finally {
      setLoading(prev => ({ ...prev, like: false }));
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user || !newComment.trim() || loading.comment) return;

    setLoading(prev => ({ ...prev, comment: true }));
    try {
      await addDoc(collection(db, 'posts', articleId, 'comments'), {
        userId: user.uid,
        username: user.displayName || user.email?.split('@')[0] || 'Trader',
        content: newComment.trim(),
        timestamp: serverTimestamp(),
      });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(prev => ({ ...prev, comment: false }));
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'posts', articleId, 'comments', commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
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

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((now - d) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)}w ago`;
    
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatCommentDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeConfig = () => {
    const configs = {
      'tip': { label: 'Trading Tip', bgColor: 'bg-blue-50', darkBgColor: 'dark:bg-blue-900/20', textColor: 'text-blue-600', darkTextColor: 'dark:text-blue-400', borderColor: 'border-blue-200', darkBorderColor: 'dark:border-blue-800' },
      'info': { label: 'Market Insight', bgColor: 'bg-green-50', darkBgColor: 'dark:bg-green-900/20', textColor: 'text-green-600', darkTextColor: 'dark:text-green-400', borderColor: 'border-green-200', darkBorderColor: 'dark:border-green-800' },
      'motivation': { label: 'Motivation', bgColor: 'bg-purple-50', darkBgColor: 'dark:bg-purple-900/20', textColor: 'text-purple-600', darkTextColor: 'dark:text-purple-400', borderColor: 'border-purple-200', darkBorderColor: 'dark:border-purple-800' },
      'quote': { label: 'Wisdom', bgColor: 'bg-amber-50', darkBgColor: 'dark:bg-amber-900/20', textColor: 'text-amber-600', darkTextColor: 'dark:text-amber-400', borderColor: 'border-amber-200', darkBorderColor: 'dark:border-amber-800' },
      'user-post': { label: 'Community Post', bgColor: 'bg-indigo-50', darkBgColor: 'dark:bg-indigo-900/20', textColor: 'text-indigo-600', darkTextColor: 'dark:text-indigo-400', borderColor: 'border-indigo-200', darkBorderColor: 'dark:border-indigo-800' }
    };
    
    return configs[type] || configs['user-post'];
  };

  const typeConfig = getTypeConfig();

  return (
    <article className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden">
      
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <img
              src={safeImgURL}
              alt={`${username}'s avatar`}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-gray-700 shadow-sm"
            />
            <div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">{username}</div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <FiCalendar className="w-3 h-3" />
                <span>{formatDate(timestamp)}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Content */}
        <blockquote className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg font-light">
          {content}
        </blockquote>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              disabled={loading.like}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 ${
                userHasLiked
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              } disabled:opacity-50`}
            >
              {userHasLiked ? <FaHeart className="w-4 h-4 fill-current" /> : <FaRegHeart className="w-4 h-4" />}
              <span className="text-sm font-medium">{likes}</span>
            </button>

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
            <button
              onClick={() => setBookmarked(!bookmarked)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                bookmarked
                  ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {bookmarked ? <FaBookmark className="w-4 h-4 fill-current" /> : <FaRegBookmark className="w-4 h-4" />}
            </button>

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
          <div className="max-h-80 overflow-y-auto">
            {comments.length > 0 ? (
              <div className="p-4 space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 group">
                    <img 
                      src={safeImgURL} 
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
                            {user?.uid === comment.userId && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                              >
                                <FiX className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={commentsEndRef} />
              </div>
            ) : (
              <div className="p-8 text-center">
                <FiMessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>

          {/* Comment Form */}
          {user ? (
            <form onSubmit={handleAddComment} className="p-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex gap-3">
                <img 
                  src={safeImgURL} 
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
                    disabled={loading.comment}
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || loading.comment}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-full transition-colors flex items-center gap-2 text-sm"
                  >
                    {loading.comment ? (
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
              <p className="text-gray-500 dark:text-gray-400 text-sm">Please sign in to comment</p>
            </div>
          )}
        </div>
      )}
    </article>
  );
};

export default Article;