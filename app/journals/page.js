"use client";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { db, storage, auth } from "../lib/firebase";
import { collection, addDoc, getDocs, doc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';

export default function Journals() {
  const [journals, setJournals] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    entrySetup: "",
    journalContent: "",
    moodBefore: "",
    moodAfter: "",
    profitloss: "",
    screenshot: "",
    createdAt: new Date().toISOString(),
    userId: auth.currentUser?.uid || ""
  });

  useEffect(() => {
    const fetchJournals = async () => {
      const querySnapshot = await getDocs(collection(db, "journals"));
      const journalData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setJournals(journalData);
    };
    fetchJournals();
  }, []);

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
    setIsLoading(true);

    try {
      let imageUrl = "";
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const docRef = await addDoc(collection(db, "journals"), {
        ...formData,
        screenshot: imageUrl,
        createdAt: new Date().toISOString(),
        userId: auth.currentUser?.uid
      });

      setJournals(prev => [...prev, {
        id: docRef.id,
        ...formData,
        screenshot: imageUrl
      }]);

      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding document: ", error);
    } finally {
      setIsLoading(false);
    }
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

  const resetForm = () => {
    setFormData({
      entrySetup: "",
      journalContent: "",
      moodBefore: "",
      moodAfter: "",
      profitloss: "",
      screenshot: "",
      createdAt: new Date().toISOString(),
      userId: auth.currentUser?.uid || ""
    });
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Trading Journals</h1>
          <button
            onClick={() => setIsModalOpen(true)}
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
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">New Journal Entry</h2>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
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
                      <select
                        name="moodBefore"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.moodBefore}
                        onChange={handleChange}
                      >
                        <option value="">Select Mood</option>
                        <option value="happy">Happy</option>
                        <option value="sad">Sad</option>
                        <option value="neutral">Neutral</option>
                        <option value="excited">Excited</option>
                        <option value="anxious">Anxious</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Mood After Entry
                      </label>
                      <select
                        name="moodAfter"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.moodAfter}
                        onChange={handleChange}
                      >
                        <option value="">Select Mood</option>
                        <option value="happy">Happy</option>
                        <option value="sad">Sad</option>
                        <option value="neutral">Neutral</option>
                        <option value="excited">Excited</option>
                        <option value="anxious">Anxious</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Profit/Loss ($)
                      </label>
                      <input
                        type="number"
                        name="profitloss"
                        required
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
                      {isLoading ? "Saving..." : "Save Entry"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Journals List */}
        <div className="space-y-6">
          {journals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No journal entries yet. Create your first one!</p>
            </div>
          ) : (
            journals.map((journal) => (
              <div
                key={journal.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                      {journal.entrySetup}
                    </h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(journal.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-gray-600 dark:text-gray-300 mb-4 whitespace-pre-line">
                    {journal.journalContent}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Mood Before</span>
                      <p className="capitalize">{journal.moodBefore}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Mood After</span>
                      <p className="capitalize">{journal.moodAfter}</p>
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

                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleDelete(journal.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/40"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}