"use client";
import { useState, useEffect } from 'react';
import Navbar from "../components/Navbar";
import { auth, db } from "../lib/firebase";
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { FiSettings, FiSun, FiMoon, FiDollarSign, FiPlus, FiMinus, FiAlertCircle, FiRefreshCw, FiTrendingDown, FiCalendar, FiBarChart2 } from 'react-icons/fi';

export default function SettingsPage() {
  const [user] = useAuthState(auth);
  const [settings, setSettings] = useState({
    mousePsychologyAlerts: true,
    darkMode: false,
    accountBalance: 0,
    blownAccounts: [],
    depositHistory: []
  });
  const [amount, setAmount] = useState('');
  const [showBlownConfirm, setShowBlownConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchSettings = async () => {
      const docRef = doc(db, "userSettings", user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Ensure all fields exist with proper fallbacks
        setSettings({
          mousePsychologyAlerts: data.mousePsychologyAlerts ?? true,
          darkMode: data.darkMode ?? false,
          accountBalance: data.accountBalance ?? 0,
          blownAccounts: data.blownAccounts || [],
          depositHistory: data.depositHistory || [] // Fallback to empty array if missing
        });
      } else {
        await setDoc(docRef, settings);
      }
    };
    
    fetchSettings();
  }, [user]);

  const updateBalance = async (newBalance, transactionType, amount) => {
    setLoading(true);
    try {
      let depositRecord = null;
      
      if (transactionType === 'deposit') {
        depositRecord = {
          date: new Date().toISOString(),
          amount: amount,
          type: 'deposit',
          balanceAfter: newBalance
        };
        
        await updateDoc(doc(db, "userSettings", user.uid), { 
          accountBalance: newBalance,
          depositHistory: arrayUnion(depositRecord)
        });
      } else {
        await updateDoc(doc(db, "userSettings", user.uid), { 
          accountBalance: newBalance 
        });
      }

      setSettings(prev => ({
        ...prev,
        accountBalance: newBalance,
        depositHistory: transactionType === 'deposit' 
          ? [...(prev.depositHistory || []), depositRecord]
          : prev.depositHistory
      }));
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
    await updateBalance(settings.accountBalance + value, 'deposit', value);
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
    await updateBalance(settings.accountBalance - value, 'withdrawal', value);
  };

  const handleSetBalance = async () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      alert('Please enter a valid positive amount');
      return;
    }
    const confirm = window.confirm(`Set your starting balance to $${value.toFixed(2)}?`);
    if (confirm) {
      await updateBalance(value, 'set', value);
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
        blownAccounts: [...(prev.blownAccounts || []), blownRecord]
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

  // Calculate deposit statistics
  const getDepositStats = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const allDeposits = (settings.depositHistory || []).filter(record => record.type === 'deposit');
    const totalDeposits = allDeposits.reduce((sum, record) => sum + record.amount, 0);
    
    const monthlyDeposits = allDeposits.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    }).reduce((sum, record) => sum + record.amount, 0);
    
    const totalWithdrawals = (settings.depositHistory || [])
      .filter(record => record.type === 'withdrawal')
      .reduce((sum, record) => sum + record.amount, 0);
    
    const largestDeposit = allDeposits.length > 0 
      ? Math.max(...allDeposits.map(record => record.amount))
      : 0;

    return {
      totalDeposits,
      monthlyDeposits,
      totalWithdrawals,
      largestDeposit,
      totalTransactions: allDeposits.length
    };
  };

  const depositStats = getDepositStats();

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
        <div className="max-w-4xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center px-4 py-3 font-medium text-sm border-b-2 transition ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <FiSettings className="mr-2" /> Settings
            </button>
            <button
              onClick={() => setActiveTab('deposits')}
              className={`flex items-center px-4 py-3 font-medium text-sm border-b-2 transition ${
                activeTab === 'deposits'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <FiBarChart2 className="mr-2" /> Deposit History
            </button>
            <button
              onClick={() => setActiveTab('blown')}
              className={`flex items-center px-4 py-3 font-medium text-sm border-b-2 transition ${
                activeTab === 'blown'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <FiTrendingDown className="mr-2" /> Blown Accounts
            </button>
          </div>

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
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
          )}

          {/* Deposit History Tab */}
          {activeTab === 'deposits' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                <FiBarChart2 className="mr-2" /> Deposit History & Analytics
              </h1>

              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-750 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Deposits</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${depositStats.totalDeposits.toFixed(2)}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-700 dark:to-gray-750 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">This Month</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${depositStats.monthlyDeposits.toFixed(2)}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-gray-700 dark:to-gray-750 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Withdrawals</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${depositStats.totalWithdrawals.toFixed(2)}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-gray-700 dark:to-gray-750 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Largest Deposit</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${depositStats.largestDeposit.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Transaction History */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                  <FiCalendar className="mr-2" /> Transaction History
                </h3>
                
                {settings.depositHistory && settings.depositHistory.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {settings.depositHistory.slice().reverse().map((record, index) => (
                      <div 
                        key={index}
                        className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              record.type === 'deposit' 
                                ? 'bg-green-100 dark:bg-green-900' 
                                : 'bg-orange-100 dark:bg-orange-900'
                            }`}>
                              {record.type === 'deposit' ? (
                                <FiPlus className={`text-green-600 dark:text-green-400`} />
                              ) : (
                                <FiMinus className={`text-orange-600 dark:text-orange-400`} />
                              )}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-800 dark:text-white capitalize">
                                {record.type}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {formatDate(record.date)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${
                              record.type === 'deposit' 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-orange-600 dark:text-orange-400'
                            }`}>
                              {record.type === 'deposit' ? '+' : '-'}${record.amount.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Balance: ${record.balanceAfter?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FiBarChart2 className="mx-auto text-4xl text-gray-400 mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">No transaction history yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      Make your first deposit to see it here
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Blown Accounts Tab */}
          {activeTab === 'blown' && settings.blownAccounts && settings.blownAccounts.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                <FiTrendingDown className="mr-2" /> Account Blown History
              </h1>
              
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">
                      Total Blown Accounts
                    </p>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {settings.blownAccounts.length}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-red-700 dark:text-red-400">
                      Total Lost
                    </p>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">
                      ${settings.blownAccounts.reduce((sum, record) => sum + (record.previousBalance || 0), 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {settings.blownAccounts.slice().reverse().map((record, index) => (
                  <div 
                    key={index}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
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
                        <p className="text-lg font-bold text-red-600">
                          ${record.previousBalance?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}