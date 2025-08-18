"use client";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { db, storage, auth } from "../lib/firebase";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function Journals() {
  const [user, loadingAuth] = useAuthState(auth);
  const [journals, setJournals] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [expandedJournalId, setExpandedJournalId] = useState(null);
  const [editingJournalId, setEditingJournalId] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [newComment, setNewComment] = useState("");

  const [formData, setFormData] = useState({
    entrySetup: "",
    journalContent: "",
    moodBefore: "",
    moodAfter: "",
    profitloss: "",
    screenshot: "",
    comments: [],
    createdAt: new Date().toISOString(),
    userId: user?.uid || ""
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        userId: user.uid
      }));
      fetchJournals();
    }
  }, [user]);

  const fetchJournals = async () => {
    if (!user) return;
    
    try {
      const q = query(
        collection(db, "journals"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const journalData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by date (newest first)
      journalData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setJournals(journalData);
    } catch (error) {
      console.error("Error fetching journals: ", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const previewURL = URL.createObjectURL(file);
      setImagePreview(previewURL);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    
    const storageRef = ref(storage, `journal-screenshots/${uuidv4()}`);
    await uploadBytes(storageRef, imageFile);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);

    try {
      let imageUrl = formData.screenshot;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const journalData = {
        ...formData,
        screenshot: imageUrl,
        createdAt: editingJournalId ? formData.createdAt : new Date().toISOString(),
        userId: user.uid,
        comments: formData.comments || []
      };

      if (editingJournalId) {
        // Update existing journal
        await updateDoc(doc(db, "journals", editingJournalId), journalData);
        setJournals(prev => prev.map(journal => 
          journal.id === editingJournalId 
            ? { id: editingJournalId, ...journalData }
            : journal
        ));
      } else {
        // Create new journal
        const docRef = await addDoc(collection(db, "journals"), journalData);
        setJournals(prev => [{
          id: docRef.id,
          ...journalData
        }, ...prev]);
      }

      resetForm();
      setIsModalOpen(false);
      setEditingJournalId(null);
    } catch (error) {
      console.error("Error saving document: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (journal) => {
    setFormData({
      entrySetup: journal.entrySetup,
      journalContent: journal.journalContent,
      moodBefore: journal.moodBefore,
      moodAfter: journal.moodAfter,
      profitloss: journal.profitloss,
      screenshot: journal.screenshot,
      comments: journal.comments || [],
      createdAt: journal.createdAt,
      userId: journal.userId
    });
    setEditingJournalId(journal.id);
    setImagePreview(journal.screenshot);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this journal entry?")) {
      try {
        await deleteDoc(doc(db, "journals", id));
        setJournals(prev => prev.filter(journal => journal.id !== id));
      } catch (error) {
        console.error("Error deleting document: ", error);
      }
    }
  };

  const handleAddComment = async (journalId) => {
    if (!newComment.trim()) return;

    try {
      const journal = journals.find(j => j.id === journalId);
      const updatedComments = [...(journal.comments || []), {
        id: uuidv4(),
        text: newComment,
        createdAt: new Date().toISOString()
      }];

      await updateDoc(doc(db, "journals", journalId), {
        comments: updatedComments
      });

      setJournals(prev => prev.map(j => 
        j.id === journalId 
          ? { ...j, comments: updatedComments }
          : j
      ));

      setNewComment("");
    } catch (error) {
      console.error("Error adding comment: ", error);
    }
  };

  const handleDeleteComment = async (journalId, commentId) => {
    try {
      const journal = journals.find(j => j.id === journalId);
      const updatedComments = journal.comments.filter(c => c.id !== commentId);

      await updateDoc(doc(db, "journals", journalId), {
        comments: updatedComments
      });

      setJournals(prev => prev.map(j => 
        j.id === journalId 
          ? { ...j, comments: updatedComments }
          : j
      ));
    } catch (error) {
      console.error("Error deleting comment: ", error);
    }
  };

  const resetForm = () => {
    setFormData({
      entrySetup: "",
      journalContent: "",
      moodBefore: "",
      moodAfter: "",
      profitloss: "",
      screenshot: "",
      comments: [],
      createdAt: new Date().toISOString(),
      userId: user?.uid || ""
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const toggleJournalExpand = (id) => {
    setExpandedJournalId(expandedJournalId === id ? null : id);
  };

  if (loadingAuth) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <p>Loading user data...</p>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <p>Please log in to view your journals</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Your Trading Journals</h1>
          <button
            onClick={() => {
              resetForm();
              setEditingJournalId(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
          >
            + New Entry
          </button>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {editingJournalId ? 'Edit Journal Entry' : 'New Journal Entry'}
                  </h2>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                      setEditingJournalId(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Entry Setup
                    </label>
                    <input
                      type="text"
                      name="entrySetup"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={formData.entrySetup}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Journal Content
                    </label>
                    <textarea
                      name="journalContent"
                      required
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={formData.journalContent}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Mood Before Entry
                      </label>
                      <input
                        type="text"
                        name="moodBefore"
                        required
                        placeholder="How did you feel before the trade?"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.moodBefore}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Mood After Entry
                      </label>
                      <input
                        type="text"
                        name="moodAfter"
                        required
                        placeholder="How did you feel after the trade?"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.moodAfter}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Profit/Loss ($)
                      </label>
                      <input
                        type="number"
                        name="profitloss"
                        required
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.profitloss}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Screenshot
                      </label>
                      <input
                        type="file"
                        name="screenshot"
                        accept="image/*"
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-600 dark:file:text-gray-100"
                        onChange={handleImageChange}
                      />
                      {imagePreview && (
                        <div className="mt-2">
                          <img src={imagePreview} alt="Preview" className="h-32 rounded-md object-cover" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        resetForm();
                        setEditingJournalId(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white dark:border-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isLoading ? "Saving..." : editingJournalId ? "Update Entry" : "Save Entry"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Journals List */}
        <div className="space-y-3">
          {journals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No journal entries yet. Create your first one!</p>
            </div>
          ) : (
            journals.map((journal) => (
              <div
                key={journal.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-200"
              >
                <div 
                  className="p-4 cursor-pointer flex justify-between items-center"
                  onClick={() => toggleJournalExpand(journal.id)}
                >
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                      {journal.entrySetup}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(journal.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${journal.profitloss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {journal.profitloss >= 0 ? '+' : ''}${journal.profitloss}
                    </span>
                    <div className="text-gray-500 dark:text-gray-400">
                      {expandedJournalId === journal.id ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>

                {expandedJournalId === journal.id && (
                  <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="pt-4">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Journal Content</h3>
                      <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line mb-4">
                        {journal.journalContent}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Mood Before</span>
                          <p className="text-gray-800 dark:text-gray-200">{journal.moodBefore}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Mood After</span>
                          <p className="text-gray-800 dark:text-gray-200">{journal.moodAfter}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Profit/Loss</span>
                          <p className={journal.profitloss >= 0 ? "text-green-600" : "text-red-600"}>
                            ${journal.profitloss}
                          </p>
                        </div>
                      </div>

                      {journal.screenshot && (
                        <div className="mb-4">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-2">Screenshot</span>
                          <img
                            src={journal.screenshot}
                            alt="Trade screenshot"
                            className="max-w-full h-auto rounded-md border border-gray-200 dark:border-gray-700"
                          />
                        </div>
                      )}

                      {/* Comments Section */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Comments</h4>
                        
                        {/* Existing Comments */}
                        {journal.comments && journal.comments.length > 0 && (
                          <div className="space-y-2 mb-3">
                            {journal.comments.map((comment) => (
                              <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                                <p className="text-gray-700 dark:text-gray-300 text-sm">{comment.text}</p>
                                <div className="flex justify-between items-center mt-2">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(comment.createdAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteComment(journal.id, comment.id);
                                    }}
                                    className="text-red-500 hover:text-red-700 text-xs"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add New Comment */}
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddComment(journal.id);
                              }
                            }}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddComment(journal.id);
                            }}
                            className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition duration-200"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(journal);
                          }}
                          className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-md text-sm hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/40 transition duration-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(journal.id);
                          }}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/40 transition duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}