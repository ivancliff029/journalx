"use client";
import { useState, useEffect } from 'react';
import Navbar from "../components/Navbar";
import { auth, db } from "../lib/firebase";
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { FiSettings, FiSun, FiMoon, FiDollarSign, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';

export default function SettingsPage() {
  const [user] = useAuthState(auth);
  const [formData, setFormData] = useState({
    mousePsychologyAlerts: true,
    darkMode: false,
    initialAccountBalance: 100, // Default set to $100
    withdrawalAmount: 0, // USD amount instead of percentage
    withdrawalEnabled: false
  });

  useEffect(() => {
    const fetchUserSettings = async () => {
      if (user) {
        const docRef = doc(db, "userSettings", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setFormData(prev => ({
            ...prev,
            ...docSnap.data()
          }));
        }
      }
    };

    fetchUserSettings();
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (user) {
        await setDoc(doc(db, "userSettings", user.uid), formData, { merge: true });
        alert('Settings saved successfully!');
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert('Error saving settings. Please try again.');
    }
  };

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p>Please log in to access settings</p>
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
            <FiSettings className="mr-2" /> Application Settings
          </h1>
          
          <form onSubmit={handleSubmit}>
            {/* Trading Psychology */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <FiAlertCircle className="mr-2" /> Trading Psychology
              </h2>
              
              <div className="flex items-center pl-2">
                <input
                  type="checkbox"
                  id="mousePsychologyAlerts"
                  name="mousePsychologyAlerts"
                  checked={formData.mousePsychologyAlerts}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="mousePsychologyAlerts" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                  Enable mouse psychology notifications
                </label>
              </div>
            </div>

            {/* Appearance */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <FiSun className="mr-2" /> Appearance
              </h2>
              
              <div className="flex items-center space-x-4 pl-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, darkMode: false }))}
                  className={`flex items-center px-4 py-2 rounded-md ${!formData.darkMode ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} transition`}
                >
                  <FiSun className="mr-2" /> Light Mode
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, darkMode: true }))}
                  className={`flex items-center px-4 py-2 rounded-md ${formData.darkMode ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} transition`}
                >
                  <FiMoon className="mr-2" /> Dark Mode
                </button>
              </div>
            </div>

            {/* Account Management */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <FiTrendingUp className="mr-2" /> Account Management
              </h2>
              
              <div className="space-y-4 pl-2">
                <div>
                  <label htmlFor="initialAccountBalance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <FiDollarSign className="mr-2" /> Initial Account Balance ($)
                  </label>
                  <input
                    type="number"
                    id="initialAccountBalance"
                    name="initialAccountBalance"
                    min="0"
                    step="0.01"
                    value={formData.initialAccountBalance}
                    onChange={handleChange}
                    className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Set your starting trading balance (default: $100)
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="withdrawalEnabled"
                    name="withdrawalEnabled"
                    checked={formData.withdrawalEnabled}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="withdrawalEnabled" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                    Enable automatic profit withdrawals
                  </label>
                </div>

                {formData.withdrawalEnabled && (
                  <div>
                    <label htmlFor="withdrawalAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Withdrawal Amount ($)
                    </label>
                    <input
                      type="number"
                      id="withdrawalAmount"
                      name="withdrawalAmount"
                      min="0"
                      step="0.01"
                      value={formData.withdrawalAmount}
                      onChange={handleChange}
                      className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Amount to withdraw when profit target is reached
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}