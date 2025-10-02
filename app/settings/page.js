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
  const [activeTab, setActiveTab] = useState('settings');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchSettings = async () => {
      const docRef = doc(db, "userSettings", user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({
          mousePsychologyAlerts: data.mousePsychologyAlerts ?? true,
          darkMode: data.darkMode ?? false,
          accountBalance: data.accountBalance ?? 0,
          blownAccounts: data.blownAccounts || [],
          depositHistory: data.depositHistory || []
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
      } else if (transactionType === 'withdrawal') {
        depositRecord = {
          date: new Date().toISOString(),
          amount: amount,
          type: 'withdrawal',
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
        depositHistory: transactionType === 'deposit' || transactionType === 'withdrawal'
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
    if (isNaN(value) || value < 0) {
      alert('Please enter a valid amount (0 or greater)');
      return;
    }
    const confirm = window.confirm(`Set your balance to $${value.toFixed(2)}?`);
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

      // Create a transaction record for the blown account
      const blownTransactionRecord = {
        date: new Date().toISOString(),
        amount: settings.accountBalance,
        type: 'blown',
        balanceAfter: 0,
        previousBalance: settings.accountBalance
      };

      await updateDoc(doc(db, "userSettings", user.uid), {
        accountBalance: 0,
        blownAccounts: arrayUnion(blownRecord),
        depositHistory: arrayUnion(blownTransactionRecord)
      });

      setSettings(prev => ({
        ...prev,
        accountBalance: 0,
        blownAccounts: [...(prev.blownAccounts || []), blownRecord],
        depositHistory: [...(prev.depositHistory || []), blownTransactionRecord]
      }));
      
      setShowBlownConfirm(false);
      alert('Account marked as blown. Balance set to $0. Your dashboard will now show fresh data.');
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
       <div className='container mx-auto px-4 py-8 text-center'>
        <div className="animate-spin inline-block mb-4">
          <FiRefreshCw className="text-4xl text-gray-400" />
        </div>
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
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
              <FiBarChart2 className="mr-2" /> Transaction History
            </button>
            <button
              onClick={() => setActiveTab('blown')}
              className={`flex items-center px-4 py-3 font-medium text-sm border-b-2 transition ${
                activeTab === 'blown'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <FiTrendingDown className="mr-2" /> 
              Blown Accounts
              {settings.blownAccounts && settings.blownAccounts.length > 0 && (
                <span className="ml-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 text-xs px-2 py-0.5 rounded-full">
                  {settings.blownAccounts.length}
                </span>
              )}
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
                  {settings.blownAccounts && settings.blownAccounts.length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Account has been reset {settings.blownAccounts.length} time{settings.blownAccounts.length > 1 ? 's' : ''}
                    </p>
                  )}
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
                  <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-lg">
                    <div className="flex items-start mb-2">
                      <FiAlertCircle className="text-orange-600 dark:text-orange-400 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-orange-900 dark:text-orange-200 mb-1">
                          Mark Account as Blown
                        </p>
                        <p className="text-xs text-orange-800 dark:text-orange-300">
                          Lost all your funds? This will reset your balance to $0 and clear your dashboard to start tracking fresh data. Your historical data will still be accessible.
                        </p>
                      </div>
                    </div>
                    {!showBlownConfirm ? (
                      <button
                        onClick={() => setShowBlownConfirm(true)}
                        disabled={loading || settings.accountBalance === 0}
                        className="w-full flex items-center justify-center px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition text-sm font-medium"
                      >
                        <FiTrendingDown className="mr-2" /> Mark as Blown
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <div className="bg-orange-100 dark:bg-orange-900/40 p-3 rounded-lg">
                          <p className="text-sm font-medium text-orange-900 dark:text-orange-200 mb-2">
                            ⚠️ Confirm Account Reset
                          </p>
                          <p className="text-xs text-orange-800 dark:text-orange-300 mb-1">
                            This will:
                          </p>
                          <ul className="text-xs text-orange-800 dark:text-orange-300 list-disc list-inside space-y-1">
                            <li>Set your balance to $0</li>
                            <li>Clear your dashboard data</li>
                            <li>Record this reset in your history</li>
                            <li>Allow you to start fresh with new trades</li>
                          </ul>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleMarkAsBlown}
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg transition text-sm font-medium"
                          >
                            {loading ? 'Processing...' : 'Yes, Mark as Blown'}
                          </button>
                          <button
                            onClick={() => setShowBlownConfirm(false)}
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-lg transition text-sm font-medium"
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

          {/* Transaction History Tab */}
          {activeTab === 'deposits' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                <FiBarChart2 className="mr-2" /> Transaction History & Analytics
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
                  <FiCalendar className="mr-2" /> All Transactions
                </h3>
                
                
                {settings.depositHistory && settings.depositHistory.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {settings.depositHistory.slice().reverse().map((record, index) => (
                      <div 
                        key={index}
                        className={`bg-white dark:bg-gray-800 p-4 rounded-lg border ${
                          record.type === 'blown' 
                            ? 'border-red-300 dark:border-red-700' 
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              record.type === 'deposit' 
                                ? 'bg-green-100 dark:bg-green-900' 
                                : record.type === 'blown'
                                ? 'bg-red-100 dark:bg-red-900'
                                : 'bg-orange-100 dark:bg-orange-900'
                            }`}>
                              {record.type === 'deposit' ? (
                                <FiPlus className="text-green-600 dark:text-green-400" />
                              ) : record.type === 'blown' ? (
                                <FiTrendingDown className="text-red-600 dark:text-red-400" />
                              ) : (
                                <FiMinus className="text-orange-600 dark:text-orange-400" />
                              )}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-800 dark:text-white capitalize">
                                {record.type === 'blown' ? 'Account Blown' : record.type}
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
                                : record.type === 'blown'
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-orange-600 dark:text-orange-400'
                            }`}>
                              {record.type === 'blown' 
                                ? `-${record.amount?.toFixed(2) || '0.00'}` 
                                : record.type === 'deposit' 
                                ? `+${record.amount.toFixed(2)}`
                                : `-${record.amount.toFixed(2)}`
                              }
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
          {activeTab === 'blown' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                <FiTrendingDown className="mr-2" /> Blown Account History
              </h1>
              
              {settings.blownAccounts && settings.blownAccounts.length > 0 ? (
                <>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-red-800 dark:text-red-300">
                          Total Account Resets
                        </p>
                        <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                          {settings.blownAccounts.length}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-red-700 dark:text-red-400">
                          Total Capital Lost
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
                        className="bg-white dark:bg-gray-800 p-5 rounded-lg border-2 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 transition"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mr-3">
                                <span className="text-red-600 dark:text-red-400 font-bold text-sm">
                                  #{settings.blownAccounts.length - index}
                                </span>
                              </div>
                              <div>
                                <p className="text-base font-semibold text-gray-800 dark:text-white">
                                  Account Reset #{settings.blownAccounts.length - index}
                                </p>
                                {record.markedManually && (
                                  <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-0.5 rounded">
                                    Manually Marked
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="ml-11">
                              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                                <FiCalendar className="mr-1.5" />
                                {formatDate(record.date)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Lost Balance</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                              ${record.previousBalance?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Learning Section */}
                  <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start">
                      <FiAlertCircle className="text-blue-600 dark:text-blue-400 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                          Learn from Your Journey
                        </p>
                        <p className="text-xs text-blue-800 dark:text-blue-300">
                          Each reset is an opportunity to improve your trading strategy. Review your historical data to identify patterns and avoid repeating mistakes.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiTrendingDown className="text-3xl text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                    No Blown Accounts Yet
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Keep up the good work! Your account is still active.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}