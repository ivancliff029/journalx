"use client";
import ProfitsAndLoss from "../components/ProfitsAndLoss";
import Navbar from "../components/Navbar";
import { useEffect, useState } from 'react';
import { db, auth } from "../lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [user, loadingAuth] = useAuthState(auth);
  const [stats, setStats] = useState({
    totalTrades: 0,
    profitableTrades: 0,
    losingTrades: 0,
    netProfit: 0,
    initialBalance: 0,
    currentBalance: 0,
    isBlownAccount: false,
    lastBlownDate: null
  });
  const [recentTrades, setRecentTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [journals, setJournals] = useState([]);
  const [userSettings, setUserSettings] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryPeriod, setSelectedHistoryPeriod] = useState(null);
  const [historicalTrades, setHistoricalTrades] = useState([]);
  const router = useRouter();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [tradesPerPage] = useState(5);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTrades, setFilteredTrades] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        // Fetch user settings including blown accounts history
        const settingsRef = doc(db, "userSettings", userId);
        const settingsSnap = await getDoc(settingsRef);
        
        let initialBalance = 0;
        let blownAccounts = [];
        let lastBlownDate = null;
        let isBlownAccount = false;

        if (settingsSnap.exists()) {
          const settingsData = settingsSnap.data();
          initialBalance = settingsData.accountBalance || 0;
          blownAccounts = settingsData.blownAccounts || [];
          setUserSettings(settingsData);
          
          // Check if there are any blown accounts
          if (blownAccounts.length > 0) {
            // Sort blown accounts by date to get the most recent one
            const sortedBlownAccounts = [...blownAccounts].sort((a, b) => 
              new Date(b.date) - new Date(a.date)
            );
            lastBlownDate = sortedBlownAccounts[0].date;
            isBlownAccount = true;
          }
        }

        // Fetch all trades
        const q = query(collection(db, "journals"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);

        let total = 0;
        let profitable = 0;
        let losing = 0;
        let netProfit = 0;
        const trades = [];

        // Filter trades based on blown account status
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const profitLoss = parseFloat(data.profitloss) || 0;
          const tradeDate = new Date(data.createdAt);

          // If account has been blown, ONLY show trades AFTER the last blown date
          let shouldInclude = false;
          
          if (isBlownAccount && lastBlownDate) {
            const blownDateTime = new Date(lastBlownDate);
            // Only include trades that happened AFTER the account was blown
            shouldInclude = tradeDate > blownDateTime;
          } else {
            // If never blown, include all trades
            shouldInclude = true;
          }

          if (shouldInclude) {
            total++;
            netProfit += profitLoss;

            if (profitLoss >= 0) {
              profitable++;
            } else {
              losing++;
            }

            trades.push({
              id: doc.id,
              label: data.entrySetup || "Trade",
              time: tradeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              profit: profitLoss,
              createdAt: data.createdAt,
              symbol: data.symbol || '',
              notes: data.notes || '',
              date: tradeDate
            });
          }
        });

        // Sort trades by creation date (most recent first)
        trades.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setRecentTrades(trades);
        setFilteredTrades(trades);

        // Calculate current balance
        const currentBalance = initialBalance + netProfit;

        setStats({
          totalTrades: total,
          profitableTrades: profitable,
          losingTrades: losing,
          netProfit: netProfit,
          initialBalance: initialBalance,
          currentBalance: currentBalance,
          isBlownAccount: isBlownAccount,
          lastBlownDate: lastBlownDate,
          totalBlownAccounts: blownAccounts.length
        });
      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchJournals();
    } else {
      setJournals([]);
    }
  }, [user]);

  // Filter trades based on search term
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredTrades(recentTrades);
    } else {
      const filtered = recentTrades.filter(trade => 
        trade.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (trade.notes && trade.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredTrades(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, recentTrades]);

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
      journalData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setJournals(journalData);
    } catch (error) {
      console.error("Error fetching journals: ", error);
    }
  };

  // Fetch historical data for a specific period
  const fetchHistoricalData = async (startDate, endDate) => {
    if (!user) return;

    try {
      const q = query(
        collection(db, "journals"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      
      const trades = [];
      let total = 0;
      let profitable = 0;
      let losing = 0;
      let netProfit = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const tradeDate = new Date(data.createdAt);
        
        // Filter trades within the date range
        if (tradeDate >= startDate && tradeDate <= endDate) {
          const profitLoss = parseFloat(data.profitloss) || 0;
          
          total++;
          netProfit += profitLoss;
          
          if (profitLoss >= 0) {
            profitable++;
          } else {
            losing++;
          }

          trades.push({
            id: doc.id,
            label: data.entrySetup || "Trade",
            time: tradeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            profit: profitLoss,
            createdAt: data.createdAt,
            symbol: data.symbol || '',
            notes: data.notes || '',
            date: tradeDate
          });
        }
      });

      trades.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setHistoricalTrades(trades);
      setSelectedHistoryPeriod({
        startDate,
        endDate,
        stats: { total, profitable, losing, netProfit }
      });
    } catch (error) {
      console.error("Error fetching historical data: ", error);
    }
  };

  const viewHistoricalPeriod = (blownAccount, index) => {
    const blownAccounts = userSettings?.blownAccounts || [];
    const sortedBlownAccounts = [...blownAccounts].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
    
    const blownDate = new Date(blownAccount.date);
    
    // Determine the start date (either account creation or previous blown date)
    let startDate;
    if (index < sortedBlownAccounts.length - 1) {
      // There's a previous blown account
      startDate = new Date(sortedBlownAccounts[index + 1].date);
    } else {
      // This is the first account, use a very early date
      startDate = new Date('2000-01-01');
    }
    
    fetchHistoricalData(startDate, blownDate);
    setShowHistoryModal(true);
  };

  // Pagination logic
  const indexOfLastTrade = currentPage * tradesPerPage;
  const indexOfFirstTrade = indexOfLastTrade - tradesPerPage;
  const currentTrades = filteredTrades.slice(indexOfFirstTrade, indexOfLastTrade);
  const totalPages = Math.ceil(filteredTrades.length / tradesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Stats cards
  const statCards = [
    { 
      label: "Total Trades", 
      value: stats.totalTrades, 
      color: "bg-indigo-100 dark:bg-indigo-900/30", 
      textColor: "text-indigo-600 dark:text-indigo-400" 
    },
    { 
      label: "Profitable Trades", 
      value: stats.profitableTrades, 
      color: "bg-green-100 dark:bg-green-900/30", 
      textColor: "text-green-600 dark:text-green-400" 
    },
    { 
      label: "Losing Trades", 
      value: stats.losingTrades, 
      color: "bg-red-100 dark:bg-red-900/30", 
      textColor: "text-red-600 dark:text-red-400" 
    },
    { 
      label: "Net Profit/Loss", 
      value: `$${stats.netProfit.toFixed(2)}`, 
      color: "bg-blue-100 dark:bg-blue-900/30", 
      textColor: stats.netProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400" 
    },
    { 
      label: stats.isBlownAccount ? "Reset Balance" : "Starting Balance", 
      value: `$${stats.initialBalance.toFixed(2)}`, 
      color: "bg-purple-100 dark:bg-purple-900/30", 
      textColor: "text-purple-600 dark:text-purple-400" 
    },
    { 
      label: "Current Balance", 
      value: `$${stats.currentBalance.toFixed(2)}`, 
      color: "bg-yellow-100 dark:bg-yellow-900/30", 
      textColor: stats.currentBalance >= stats.initialBalance ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400" 
    }
  ];

  const formatBlownDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Navbar />
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-6">Trading Dashboard</h1>

        {/* Blown Account Banner with History Access */}
        {stats.isBlownAccount && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">
                    Fresh Start - Account Reset
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    Last reset on {formatBlownDate(stats.lastBlownDate)}. 
                    Dashboard shows only new data.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <p className="text-sm text-red-700 dark:text-red-400">Total Resets</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {stats.totalBlownAccounts}
                  </p>
                </div>
                <button
                  onClick={() => setShowHistoryModal(true)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition"
                >
                  View Past Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {statCards.map((card, index) => (
            <div key={index} className={`${card.color} p-5 rounded-xl shadow-sm`}>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</h3>
              <p className={`text-xl font-semibold mt-2 ${card.textColor}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Balance Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 mb-8 border border-blue-200 dark:border-blue-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            {stats.isBlownAccount ? 'Current Period Summary' : 'Account Summary'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stats.isBlownAccount ? 'Reset Balance' : 'Starting Balance'}
              </p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">${stats.initialBalance.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total P&L</p>
              <p className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {stats.netProfit >= 0 ? '+' : ''}${stats.netProfit.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Balance</p>
              <p className={`text-2xl font-bold ${stats.currentBalance >= stats.initialBalance ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                ${stats.currentBalance.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Performance indicator */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {stats.isBlownAccount ? 'Return since reset:' : 'Return:'}
              <span className={`ml-1 font-semibold ${stats.currentBalance >= stats.initialBalance ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {stats.initialBalance > 0 ? (((stats.currentBalance - stats.initialBalance) / stats.initialBalance) * 100).toFixed(2) : '0.00'}%
              </span>
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Chart Section */}
          <div className="lg:w-2/3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 h-full">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                {stats.isBlownAccount ? 'Performance Since Reset' : 'Performance Overview'}
              </h2>
              <ProfitsAndLoss 
                blownAccount={stats.isBlownAccount} 
                lastBlownDate={stats.lastBlownDate} 
              />
            </div>
          </div>

          {/* Recent Trades */}
          <div className="lg:w-1/3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 h-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {stats.isBlownAccount ? 'New Trades' : 'Recent Trades'}
                </h2>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search trades..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-3 pr-10 py-1.5 text-sm border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <svg
                    className="w-4 h-4 absolute right-2.5 top-2.5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : currentTrades.length > 0 ? (
                <>
                  <div className="space-y-3 mb-4">
                    {currentTrades.map((trade) => (
                      <div
                        key={trade.id}
                        className="border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0 last:pb-0"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3
                              className="font-medium text-gray-800 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                              onClick={() => router.push(`/journals/${trade.id}`)}
                            >
                              {trade.label}
                            </h3>
                            {trade.symbol && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {trade.symbol}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(trade.createdAt).toLocaleDateString()} • {trade.time}
                            </p>
                          </div>
                          <p
                            className={`font-medium ${trade.profit >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                              }`}
                          >
                            {trade.profit >= 0
                              ? `+$${trade.profit.toFixed(2)}`
                              : `-$${Math.abs(trade.profit).toFixed(2)}`}
                          </p>
                        </div>
                        {trade.notes && searchTerm && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                            {trade.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4">
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 text-sm rounded-md ${currentPage === 1
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                          }`}
                      >
                        Previous
                      </button>
                      
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Page {currentPage} of {totalPages}
                      </span>
                      
                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 text-sm rounded-md ${currentPage === totalPages
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                          }`}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {searchTerm ? (
                    <>
                      <p>No trades match your search</p>
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Clear search
                      </button>
                    </>
                  ) : stats.isBlownAccount ? (
                    <>
                      <p>No trades since reset</p>
                      <p className="text-sm mt-2">Start fresh with new trades!</p>
                    </>
                  ) : (
                    <>
                      <p>No recent trades found</p>
                      <p className="text-sm mt-2">Start trading to see your activity here</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Historical Data Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Historical Account Data
                </h2>
                <button
                  onClick={() => {
                    setShowHistoryModal(false);
                    setSelectedHistoryPeriod(null);
                    setHistoricalTrades([]);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {!selectedHistoryPeriod ? (
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Select a period to view historical trading data:
                  </p>
                  <div className="space-y-3">
                    {userSettings?.blownAccounts
                      ?.slice()
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((blownAccount, index) => (
                        <button
                          key={index}
                          onClick={() => viewHistoricalPeriod(blownAccount, index)}
                          className="w-full bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 p-4 rounded-lg text-left transition"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-800 dark:text-white">
                                Account Period #{userSettings.blownAccounts.length - index}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Ended: {formatBlownDate(blownAccount.date)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500 dark:text-gray-400">Final Balance</p>
                              <p className="text-lg font-bold text-red-600">
                                ${blownAccount.previousBalance?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => {
                      setSelectedHistoryPeriod(null);
                      setHistoricalTrades([]);
                    }}
                    className="mb-4 text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to periods
                  </button>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Trades</p>
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {selectedHistoryPeriod.stats.total}
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Profitable</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {selectedHistoryPeriod.stats.profitable}
                      </p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Losing</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {selectedHistoryPeriod.stats.losing}
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Net P&L</p>
                      <p className={`text-2xl font-bold ${selectedHistoryPeriod.stats.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {selectedHistoryPeriod.stats.netProfit >= 0 ? '+' : ''}${selectedHistoryPeriod.stats.netProfit.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Historical Trades List */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                      Trade History ({historicalTrades.length} trades)
                    </h3>
                    {historicalTrades.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {historicalTrades.map((trade) => (
                          <div
                            key={trade.id}
                            className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-800 dark:text-white">
                                  {trade.label}
                                </h4>
                                {trade.symbol && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {trade.symbol}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(trade.createdAt).toLocaleDateString()} • {trade.time}
                                </p>
                              </div>
                              <p
                                className={`font-medium ${trade.profit >= 0
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                  }`}
                              >
                                {trade.profit >= 0
                                  ? `+${trade.profit.toFixed(2)}`
                                  : `-${Math.abs(trade.profit).toFixed(2)}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                        No trades found for this period
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
                    