"use client";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { db, storage, auth } from "../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { useAuthState } from "react-firebase-hooks/auth";
import { FaChartLine, FaPen, FaBook } from "react-icons/fa";
import { useRouter } from "next/navigation";

const initialFormData = {
  entrySetup: "",
  journalContent: "",
  moodBefore: "",
  moodAfter: "",
  profitloss: "",
  screenshot: "",
  comments: [],
  createdAt: new Date().toISOString(),
  userId: "",
};

export default function Journals() {
  const [user, loadingAuth] = useAuthState(auth);
  const [journals, setJournals] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [expandedJournalId, setExpandedJournalId] = useState(null);
  const [editingJournalId, setEditingJournalId] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [message, setIsMessage] = useState(true);
  const [expandedImage, setExpandedImage] = useState(null);
  const [accountBalance, setAccountBalance] = useState();
  const router = useRouter();
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    const hasClosedMessage = localStorage.getItem("statusMessageClosed");
    if (hasClosedMessage) setIsMessage(false);

    if (user) {
      setFormData((prev) => ({ ...prev, userId: user.uid }));
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    await Promise.all([fetchJournals(), fetchAccountBalance()]);
  };

  const fetchAccountBalance = async () => {
    try {
      const q = query(collection(db, "userSettings"), where("uid", "==", user.uid));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        const balance = parseFloat(data.accountBalance);
        if (!isNaN(balance) && balance > 0) {
          setAccountBalance(balance);
        }
      }
    } catch (error) {
      console.error("Error fetching account balance: ", error);
    }
  };

  const fetchJournals = async () => {
    try {
      const q = query(collection(db, "journals"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setJournals(data);
    } catch (error) {
      console.error("Error fetching journals: ", error);
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
      const imageUrl = imageFile ? await uploadImage() : formData.screenshot;
      const journalData = {
        ...formData,
        screenshot: imageUrl,
        createdAt: editingJournalId ? formData.createdAt : new Date().toISOString(),
        userId: user.uid,
        comments: formData.comments || [],
      };

      if (editingJournalId) {
        await updateDoc(doc(db, "journals", editingJournalId), journalData);
        setJournals((prev) =>
          prev.map((j) => (j.id === editingJournalId ? { id: editingJournalId, ...journalData } : j))
        );
      } else {
        const docRef = await addDoc(collection(db, "journals"), journalData);
        setJournals((prev) => [{ id: docRef.id, ...journalData }, ...prev]);
      }

      closeModal();
    } catch (error) {
      console.error("Error saving document: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (journal) => {
    setFormData({ ...journal });
    setEditingJournalId(journal.id);
    setImagePreview(journal.screenshot);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this journal entry?")) return;
    try {
      await deleteDoc(doc(db, "journals", id));
      setJournals((prev) => prev.filter((j) => j.id !== id));
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  const handleAddComment = async (journalId) => {
    if (!newComment.trim()) return;
    try {
      const journal = journals.find((j) => j.id === journalId);
      const updatedComments = [
        ...(journal.comments || []),
        { id: uuidv4(), text: newComment, createdAt: new Date().toISOString() },
      ];

      await updateDoc(doc(db, "journals", journalId), { comments: updatedComments });
      setJournals((prev) =>
        prev.map((j) => (j.id === journalId ? { ...j, comments: updatedComments } : j))
      );
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment: ", error);
    }
  };

  const handleDeleteComment = async (journalId, commentId) => {
    try {
      const journal = journals.find((j) => j.id === journalId);
      const updatedComments = journal.comments.filter((c) => c.id !== commentId);
      await updateDoc(doc(db, "journals", journalId), { comments: updatedComments });
      setJournals((prev) =>
        prev.map((j) => (j.id === journalId ? { ...j, comments: updatedComments } : j))
      );
    } catch (error) {
      console.error("Error deleting comment: ", error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ ...initialFormData, userId: user?.uid || "" });
    setImageFile(null);
    setImagePreview(null);
    setEditingJournalId(null);
  };

  const calculatePercentage = (profitLoss) => {
    const pl = parseFloat(profitLoss);
    if (isNaN(pl) || !accountBalance || accountBalance === 0) return "0.00";
    return ((pl / accountBalance) * 100).toFixed(2);
  };

  if (loadingAuth) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
          <p>Loading user data...</p>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
          <p>Please log in to view your journals</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <FaBook className="mr-2" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Journals</h2>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            <FaPen className="mr-2" />
            New Journal
          </button>
        </div>

        {/* Alert Message */}
        {message && (
          <div className="m-2 flex bg-green-500 rounded p-2 max-w-xl mx-auto items-center">
            <p className="text-sm sm:text-base flex-1 text-center">
              You can now view Profit/Loss in the Status Bar
            </p>
            <button
              onClick={() => {
                setIsMessage(false);
                localStorage.setItem("statusMessageClosed", "true");
              }}
              className="ml-2 text-white font-bold hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {editingJournalId ? "Edit" : "New"} Journal Entry
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-300 text-2xl"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Journal Title / Entry Setup
                    </label>
                    <input
                      type="text"
                      name="entrySetup"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={formData.entrySetup}
                      onChange={(e) => setFormData((prev) => ({ ...prev, entrySetup: e.target.value }))}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={formData.journalContent}
                      onChange={(e) => setFormData((prev) => ({ ...prev, journalContent: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Mood Before
                      </label>
                      <input
                        type="text"
                        name="moodBefore"
                        placeholder="How did you feel before?"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.moodBefore}
                        onChange={(e) => setFormData((prev) => ({ ...prev, moodBefore: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Mood After
                      </label>
                      <input
                        type="text"
                        name="moodAfter"
                        placeholder="How did you feel after?"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.moodAfter}
                        onChange={(e) => setFormData((prev) => ({ ...prev, moodAfter: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Profit/Loss ($)
                      </label>
                      <input
                        type="number"
                        name="profitloss"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.profitloss}
                        onChange={(e) => setFormData((prev) => ({ ...prev, profitloss: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Screenshot
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setImageFile(file);
                            setImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                      {imagePreview && (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="mt-2 h-32 rounded-md object-cover cursor-pointer hover:opacity-80"
                          onClick={() => setExpandedImage(imagePreview)}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-600 dark:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoading ? "Saving..." : editingJournalId ? "Update" : "Save"} Entry
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Image Expanded Modal */}
        {expandedImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center p-4 z-50"
            onClick={() => setExpandedImage(null)}
          >
            <button
              className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-10"
              onClick={() => setExpandedImage(null)}
            >
              ✕
            </button>
            <img
              src={expandedImage}
              alt="Expanded view"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}

        {/* Journals List */}
        <div className="space-y-3">
          {journals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No journal entries yet. Create your first one!
              </p>
            </div>
          ) : (
            journals.map((journal) => {
              const pl = parseFloat(journal.profitloss) || 0;
              const isExpanded = expandedJournalId === journal.id;
              
              return (
                <div
                  key={journal.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
                >
                  {/* Journal Header */}
                  <div
                    className="p-4 cursor-pointer flex justify-between items-center"
                    onClick={() => setExpandedJournalId(isExpanded ? null : journal.id)}
                  >
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {journal.entrySetup}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(journal.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${pl >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {pl >= 0 ? "+" : ""}${journal.profitloss}
                      </span>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        ({calculatePercentage(journal.profitloss)}%)
                      </span>
                      <svg
                        className="h-5 w-5 text-gray-500 dark:text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d={isExpanded ? "M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" : "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"}
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Journal Content
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line mb-4">
                        {journal.journalContent}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Mood Before
                          </span>
                          <p className="text-gray-800 dark:text-gray-200">{journal.moodBefore || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Mood After
                          </span>
                          <p className="text-gray-800 dark:text-gray-200">{journal.moodAfter || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Profit/Loss
                          </span>
                          <p className={pl >= 0 ? "text-green-600" : "text-red-600"}>
                            ${journal.profitloss}
                          </p>
                        </div>
                      </div>

                      {journal.screenshot && (
                        <div className="mb-4">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-2">
                            Screenshot
                          </span>
                          <img
                            src={journal.screenshot}
                            alt="Trade screenshot"
                            className="w-40 h-40 object-cover rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-80 transition"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedImage(journal.screenshot);
                            }}
                          />
                        </div>
                      )}

                      {/* Comments */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                          Comments
                        </h4>

                        {journal.comments?.length > 0 && (
                          <div className="space-y-2 mb-3">
                            {journal.comments.map((comment) => (
                              <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                                <p className="text-gray-700 dark:text-gray-300 text-sm">{comment.text}</p>
                                <div className="flex justify-between items-center mt-2">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(comment.createdAt).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
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

                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
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
                            className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-2">
                        <button
                          className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/journals/analyze/${journal.id}`);
                          }}
                        >
                          <FaChartLine size={18} />
                          Analyze
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(journal);
                          }}
                          className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-md text-sm hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(journal.id);
                          }}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}