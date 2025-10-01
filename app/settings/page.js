"use client";
import { useState, useEffect } from 'react';
import Navbar from "../components/Navbar";
import { auth, db } from "../lib/firebase";
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { FiSettings, FiSun, FiMoon, FiDollarSign, FiPlus, FiMinus, FiAlertCircle, FiRefreshCw, FiTrendingDown } from 'react-icons/fi';

export default function SettingsPage() {
  const [user] = useAuthState(auth);
  const [settings, setSettings] = useState({
    mousePsychologyAlerts: true,
    darkMode: false,
    accountBalance: 0,
    blownAccounts: []
  });
  const [amount, setAmount] = useState('');
  const [showBlownConfirm, setShowBlownConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchSettings = async () => {
      const docRef = doc(db, "userSettings", user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Ensure blownAccounts exists and is an array
        setSettings({
          mousePsychologyAlerts: data.mousePsychologyAlerts ?? true,
          darkMode: data.darkMode ?? false,
          accountBalance: data.accountBalance ?? 0,
          blownAccounts: data.blownAccounts || [] // Fallback to empty array if missing
        });
      } else {
        await setDoc(docRef, settings);
      }
    };
    
    fetchSettings();
  }, [user]);

  const updateBalance = async (newBalance) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "userSettings", user.uid), { accountBalance: newBalance });
      setSettings(prev => ({ ...prev, accountBalance: newBalance }));
      setAmount('');
      return true;
    } catch (error) {
      console.error("Error:", error);
      alert('Transaction failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    await updateBalance(settings.accountBalance + value);
  };

  const handleWithdraw = async () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (value > settings.accountBalance) {
      alert('Insufficient funds');
      return;
    }
    await updateBalance(settings.accountBalance - value);
  };

  const handleSetBalance = async () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      alert('Please enter a valid positive amount');
      return;
    }
    const confirm = window.confirm(`Set your starting balance to $${value.toFixed(2)}?`);
    if (confirm) {
      await updateBalance(value);
    }
  };

  const handleMarkAsBlown = async () => {
    setLoading(true);
    try {
      const blownRecord = {
        date: new Date().toISOString(),
        previousBalance: settings.accountBalance,
        markedManually: true
      };

      await updateDoc(doc(db, "userSettings", user.uid), {
        accountBalance: 0,
        blownAccounts: arrayUnion(blownRecord)
      });

      setSettings(prev => ({
        ...prev,
        accountBalance: 0,
        blownAccounts: [...(prev.blownAccounts || []), blownRecord] // Safe spread with fallback
      }));
      
      setShowBlownConfirm(false);
      alert('Account marked as blown. Balance set to $0.');
    } catch (error) {
      console.error("Error:", error);
      alert('Failed to mark account as blown. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      const value = parseFloat(amount);
      if (isNaN(value) || value <= 0) {
        alert('Please enter a valid positive amount to reset');
        setLoading(false);
        return;
      }

      await updateDoc(doc(db, "userSettings", user.uid), {
        accountBalance: value
      });

      setSettings(prev => ({
        ...prev,
        accountBalance: value
      }));
      
      setShowResetConfirm(false);
      setAmount('');
      alert(`Account reset to $${value.toFixed(2)}. Start trading fresh!`);
    } catch (error) {
      console.error("Error:", error);
      alert('Failed to reset account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "userSettings", user.uid), settings, { merge: true });
      alert('Settings saved!');
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Please log in to access settings</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
            <FiSettings className="mr-2" /> Settings
          </h1>
          
          {/* Trading Psychology */}
          <section className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
              <FiAlertCircle className="mr-2" /> Trading Psychology
            </h2>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.mousePsychologyAlerts}
                onChange={(e) => setSettings(prev => ({ ...prev, mousePsychologyAlerts: e.target.checked }))}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                Enable mouse psychology notifications
              </span>
            </label>
          </section>

          {/* Appearance */}
          <section className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
              <FiSun className="mr-2" /> Appearance
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => setSettings(prev => ({ ...prev, darkMode: false }))}
                className={`flex items-center px-4 py-2 rounded-lg transition ${
                  !settings.darkMode 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <FiSun className="mr-2" /> Light
              </button>
              <button
                onClick={() => setSettings(prev => ({ ...prev, darkMode: true }))}
                className={`flex items-center px-4 py-2 rounded-lg transition ${
                  settings.darkMode 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <FiMoon className="mr-2" /> Dark
              </button>
            </div>
          </section>

          {/* Account Management */}
          <section className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
              <FiDollarSign className="mr-2" /> Account Balance
            </h2>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-750 p-6 rounded-lg mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Balance</p>
              <p className={`text-4xl font-bold ${settings.accountBalance === 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                ${settings.accountBalance.toFixed(2)}
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-lg"
                disabled={loading}
              />
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleDeposit}
                  disabled={loading}
                  className="flex items-center justify-center px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition font-medium"
                >
                  <FiPlus className="mr-1.5" /> Deposit
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={loading}
                  className="flex items-center justify-center px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg transition font-medium"
                >
                  <FiMinus className="mr-1.5" /> Withdraw
                </button>
                <button
                  onClick={handleSetBalance}
                  disabled={loading}
                  className="flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition font-medium"
                >
                  <FiDollarSign className="mr-1.5" /> Set
                </button>
              </div>

              {/* Mark as Blown Button */}
              <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <p className="text-xs text-orange-800 dark:text-orange-300 mb-2">
                  Lost all your money through trading? Mark your account as blown to track your resets.
                </p>
                {!showBlownConfirm ? (
                  <button
                    onClick={() => setShowBlownConfirm(true)}
                    disabled={loading || settings.accountBalance === 0}
                    className="flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg transition text-sm font-medium"
                  >
                    <FiTrendingDown className="mr-2" /> Mark Account as Blown
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
                      This will set your balance to $0 and record this in your history. Continue?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleMarkAsBlown}
                        disabled={loading}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg transition text-sm font-medium"
                      >
                        Yes, Mark as Blown
                      </button>
                      <button
                        onClick={() => setShowBlownConfirm(false)}
                        className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Blown Accounts History */}
          {settings.blownAccounts && settings.blownAccounts.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                <FiTrendingDown className="mr-2" /> Account Blown History
              </h2>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Total Blown Accounts: <span className="font-bold text-red-600">{settings.blownAccounts.length}</span>
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {settings.blownAccounts.slice().reverse().map((record, index) => (
                    <div 
                      key={index}
                      className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-white">
                            Blown Account #{settings.blownAccounts.length - index}
                            {record.markedManually && (
                              <span className="ml-2 text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-0.5 rounded">
                                Manual
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {formatDate(record.date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Lost Balance</p>
                          <p className="text-sm font-bold text-red-600">
                            ${record.previousBalance?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition font-medium"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}