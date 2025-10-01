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
    currentBalance: 0
  });
  const [recentTrades, setRecentTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [journals, setJournals] = useState([]);
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

        // Fetch initial balance from user settings
        const settingsRef = doc(db, "userSettings", userId);
        const settingsSnap = await getDoc(settingsRef);
        let initialBalance = 0; // Default fallback

        if (settingsSnap.exists()) {
          const settingsData = settingsSnap.data();
          initialBalance = settingsData.accountBalance || 0;
        }

        // Fetch all trades
        const q = query(collection(db, "journals"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);

        let total = 0;
        let profitable = 0;
        let losing = 0;
        let netProfit = 0;
        const trades = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const profitLoss = parseFloat(data.profitloss) || 0;

          total++;
          netProfit += profitLoss;

          if (profitLoss >= 0) {
            profitable++;
          } else {
            losing++;
          }

          // Get recent trades for timeline
          trades.push({
            id: doc.id,
            label: data.entrySetup || "Trade",
            time: new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            profit: profitLoss,
            createdAt: data.createdAt,
            // Add more fields for search functionality
            symbol: data.symbol || '',
            notes: data.notes || ''
          });
        });

        // Sort trades by creation date (most recent first)
        trades.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setRecentTrades(trades);
        setFilteredTrades(trades);

        // Calculate current balance = initial balance + net profit/loss
        const currentBalance = initialBalance + netProfit;

        setStats({
          totalTrades: total,
          profitableTrades: profitable,
          losingTrades: losing,
          netProfit: netProfit,
          initialBalance: initialBalance,
          currentBalance: currentBalance
        });
      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
    setCurrentPage(1); // Reset to first page when search changes
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
      // Sort by date (newest first)
      journalData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setJournals(journalData);
    } catch (error) {
      console.error("Error fetching journals: ", error);
    }
  };

  // Pagination logic
  const indexOfLastTrade = currentPage * tradesPerPage;
  const indexOfFirstTrade = indexOfLastTrade - tradesPerPage;
  const currentTrades = filteredTrades.slice(indexOfFirstTrade, indexOfLastTrade);
  const totalPages = Math.ceil(filteredTrades.length / tradesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const statCards = [
    { label: "Total Trades", value: stats.totalTrades, color: "bg-indigo-100 dark:bg-indigo-900/30", textColor: "text-indigo-600 dark:text-indigo-400" },
    { label: "Profitable Trades", value: stats.profitableTrades, color: "bg-green-100 dark:bg-green-900/30", textColor: "text-green-600 dark:text-green-400" },
    { label: "Losing Trades", value: stats.losingTrades, color: "bg-red-100 dark:bg-red-900/30", textColor: "text-red-600 dark:text-red-400" },
    { label: "Net Profit/Loss", value: `$${stats.netProfit.toFixed(2)}`, color: "bg-blue-100 dark:bg-blue-900/30", textColor: stats.netProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400" },
    { label: "Starting Balance", value: `$${stats.initialBalance.toFixed(2)}`, color: "bg-purple-100 dark:bg-purple-900/30", textColor: "text-purple-600 dark:text-purple-400" },
    { label: "Current Balance", value: `$${stats.currentBalance.toFixed(2)}`, color: "bg-yellow-100 dark:bg-yellow-900/30", textColor: stats.currentBalance >= stats.initialBalance ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400" }
  ];

  return (
    <>
      <Navbar />
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-6">Trading Dashboard</h1>

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
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Account Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Starting Balance</p>
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
              <p className={`text-2xl font-bold ${stats.currentBalance >= stats.initialBalance ? 'text-green-600 dark:text-green-400' : 'text-green-600 dark:text-green-400'}`}>
                ${stats.currentBalance.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Performance indicator */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Return:
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
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Performance Overview</h2>
              <ProfitsAndLoss />
            </div>
          </div>

          {/* Recent Trades */}
          <div className="lg:w-1/3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 h-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Trades</h2>
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
                    xmlns="http://www.w3.org/2000/svg"
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
                            <p className="text-xs text-gray-500 dark:text-gray-400">{trade.time}</p>
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
                  
                  {/* Pagination Controls */}
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
    </>
  );
}