"use client";
import { useState, useEffect } from 'react';
import Navbar from "../components/Navbar";
import { auth, db } from "../lib/firebase";
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { FiSettings, FiSun, FiMoon, FiDollarSign, FiPlus, FiMinus, FiAlertCircle } from 'react-icons/fi';

export default function SettingsPage() {
  const [user] = useAuthState(auth);
  const [formData, setFormData] = useState({
    mousePsychologyAlerts: true,
    darkMode: false,
    accountBalance: 100, // Current account balance
  });
  const [transactionAmount, setTransactionAmount] = useState(0);
  const [transactionType, setTransactionType] = useState('deposit');

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
        } else {
          // Initialize with default values if no settings exist
          await setDoc(docRef, {
            mousePsychologyAlerts: true,
            darkMode: false,
            accountBalance: 100
          });
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

  const handleTransaction = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      const amount = parseFloat(transactionAmount);
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid positive amount');
        return;
      }

      let newBalance = formData.accountBalance;
      
      if (transactionType === 'withdraw') {
        if (amount > formData.accountBalance) {
          alert('Insufficient funds for withdrawal');
          return;
        }
        newBalance = formData.accountBalance - amount;
      } else if (transactionType === 'deposit') {
        newBalance = formData.accountBalance + amount;
      } else { // set initial balance
        newBalance = amount;
      }

      await updateDoc(doc(db, "userSettings", user.uid), {
        accountBalance: newBalance
      });

      setFormData(prev => ({ ...prev, accountBalance: newBalance }));
      setTransactionAmount(0);
      alert(`Transaction successful! New balance: $${newBalance.toFixed(2)}`);
    } catch (error) {
      console.error("Error processing transaction:", error);
      alert('Error processing transaction. Please try again.');
    }
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
                <FiDollarSign className="mr-2" /> Account Management
              </h2>
              
              <div className="space-y-6 pl-2">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Balance</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">
                      ${formData.accountBalance.toFixed(2)}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="transactionType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Transaction Type
                      </label>
                      <select
                        id="transactionType"
                        value={transactionType}
                        onChange={(e) => setTransactionType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      >
                        <option value="deposit">Deposit</option>
                        <option value="withdraw">Withdraw</option>
                        <option value="setInitial">Set Initial Balance</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="transactionAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Amount (USD)
                      </label>
                      <input
                        type="number"
                        id="transactionAmount"
                        min="0"
                        step="0.01"
                        value={transactionAmount}
                        onChange={(e) => setTransactionAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                        placeholder="0.00"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleTransaction}
                      className={`w-full flex items-center justify-center px-4 py-2 rounded-md text-white ${transactionType === 'withdraw' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} transition`}
                    >
                      {transactionType === 'deposit' && <FiPlus className="mr-2" />}
                      {transactionType === 'withdraw' && <FiMinus className="mr-2" />}
                      {transactionType === 'setInitial' && <FiDollarSign className="mr-2" />}
                      {transactionType === 'deposit' ? 'Deposit' : 
                       transactionType === 'withdraw' ? 'Withdraw' : 'Set Initial Balance'}
                    </button>
                  </div>
                </div>
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