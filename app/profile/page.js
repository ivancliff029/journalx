"use client";
import { useState, useEffect } from 'react';
import Navbar from "../components/Navbar";
import { auth, db } from "../lib/firebase";
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { FiUser, FiMail, FiImage, FiAlertCircle, FiDollarSign, FiEdit, FiPhone, FiInfo } from 'react-icons/fi';

export default function ProfilePage() {
  const [user] = useAuthState(auth);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    avatar: '',
    username: '',
    email: '',
    phone: '',
    overtradeAlert: true,
    exceedDailyLossAlert: true,
    dailyLossLimit: 500,
    receiveNewsletters: true,
    receiveAds: false,
    customOvertradeTerm: 'Overtrading',
    tradingExperience: 'Intermediate'
  });
  const [editData, setEditData] = useState({});

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setFormData(prev => ({
            ...prev,
            ...docSnap.data(),
            email: user.email || ''
          }));
        } else {
          // Initialize with default values if no document exists
          setFormData(prev => ({
            ...prev,
            username: user.displayName || '',
            email: user.email || '',
            avatar: user.photoURL || ''
          }));
        }
      }
    };

    fetchUserData();
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          avatar: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openEditModal = (field) => {
    setEditData({
      field,
      value: formData[field] || ''
    });
    setIsEditModalOpen(true);
  };

  const saveEdit = async () => {
    try {
      const updatedData = {
        ...formData,
        [editData.field]: editData.value
      };
      
      setFormData(updatedData);
      
      if (user) {
        await setDoc(doc(db, "users", user.uid), updatedData, { merge: true });
      }
      
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (user) {
        await setDoc(doc(db, "users", user.uid), formData, { merge: true });
        alert('Profile saved successfully!');
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert('Error saving profile. Please try again.');
    }
  };

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p>Please log in to access your profile</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
            <FiUser className="mr-2" /> Trading Profile
          </h1>
          
          {/* User Information Section */}
          <div className="mb-8 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Personal Information</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Username</p>
                  <p className="text-gray-800 dark:text-white">{formData.username || 'Not set'}</p>
                </div>
                <button 
                  onClick={() => openEditModal('username')}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <FiEdit />
                </button>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-gray-800 dark:text-white">{formData.email || 'Not set'}</p>
                </div>
                <span className="text-gray-400 text-sm">(Managed by auth provider)</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="text-gray-800 dark:text-white">{formData.phone || 'Not set'}</p>
                </div>
                <button 
                  onClick={() => openEditModal('phone')}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <FiEdit />
                </button>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Trading Experience</p>
                  <p className="text-gray-800 dark:text-white capitalize">{formData.tradingExperience || 'Not set'}</p>
                </div>
                <button 
                  onClick={() => openEditModal('tradingExperience')}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <FiEdit />
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Avatar Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">War Image (Avatar)</h2>
              <div className="flex items-center">
                <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mr-4 border-2 border-gray-300 dark:border-gray-600">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <FiImage size={28} />
                    </div>
                  )}
                </div>
                <label className="cursor-pointer">
                  <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                    Change Avatar
                  </span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAvatarUpload}
                  />
                </label>
              </div>
            </div>

            {/* Trade Plan Settings */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <FiAlertCircle className="mr-2" /> Trade Plan Settings
              </h2>
              
              <div className="space-y-4 pl-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="overtradeAlert"
                    name="overtradeAlert"
                    checked={formData.overtradeAlert}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="overtradeAlert" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                    Alert on {formData.customOvertradeTerm.toLowerCase()}
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="exceedDailyLossAlert"
                      name="exceedDailyLossAlert"
                      checked={formData.exceedDailyLossAlert}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="exceedDailyLossAlert" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                      Alert when exceeding daily loss limit
                    </label>
                  </div>
                  <button 
                    onClick={() => openEditModal('customOvertradeTerm')}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                  >
                    Edit term
                  </button>
                </div>

                <div className="mt-4 pl-1">
                  <label htmlFor="dailyLossLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <FiDollarSign className="mr-2" /> Daily Loss Limit ($)
                  </label>
                  <input
                    type="number"
                    id="dailyLossLimit"
                    name="dailyLossLimit"
                    value={formData.dailyLossLimit}
                    onChange={handleChange}
                    className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Communication Preferences */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <FiMail className="mr-2" /> Communication Preferences
              </h2>
              
              <div className="space-y-4 pl-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="receiveNewsletters"
                    name="receiveNewsletters"
                    checked={formData.receiveNewsletters}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="receiveNewsletters" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                    Receive newsletters
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="receiveAds"
                    name="receiveAds"
                    checked={formData.receiveAds}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="receiveAds" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                    Receive promotional offers
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
              >
                Save Profile
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                Edit {editData.field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              {editData.field === 'tradingExperience' ? (
                <select
                  value={editData.value}
                  onChange={handleEditChange}
                  name="value"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Professional">Professional</option>
                </select>
              ) : (
                <input
                  type={editData.field === 'phone' ? 'tel' : 'text'}
                  name="value"
                  value={editData.value}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              )}
            </div>

            {editData.field === 'customOvertradeTerm' && (
              <div className="flex items-start mb-4">
                <FiInfo className="text-blue-500 mt-1 mr-2 flex-shrink-0" />
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  This term will be used throughout the app to refer to overtrading behavior.
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}