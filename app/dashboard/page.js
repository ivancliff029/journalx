"use client";
import ProfitsAndLoss from "../components/ProfitsAndLoss";
import Navbar from "../components/Navbar";
import { useEffect, useState } from 'react';
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { auth } from "../lib/firebase";

export default function Dashboard() {
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        // Fetch initial balance from user settings
        const settingsRef = doc(db, "userSettings", userId);
        const settingsSnap = await getDoc(settingsRef);
        let initialBalance = 100; // Default fallback
        
        if (settingsSnap.exists()) {
          const settingsData = settingsSnap.data();
          initialBalance = settingsData.accountBalance || 100;
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
            createdAt: data.createdAt
          });
        });

        // Sort trades by creation date (most recent first) and take top 5
        trades.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const recentFiveTrades = trades.slice(0, 5);

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

        setRecentTrades(recentFiveTrades);
      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    { label: "Total Trades", value: stats.totalTrades, color: "bg-indigo-100 dark:bg-indigo-900/30", textColor: "text-indigo-600 dark:text-indigo-400" },
    { label: "Profitable Trades", value: stats.profitableTrades, color: "bg-green-100 dark:bg-green-900/30", textColor: "text-green-600 dark:text-green-400" },
    { label: "Losing Trades", value: stats.losingTrades, color: "bg-red-100 dark:bg-red-900/30", textColor: "text-red-600 dark:text-red-400" },
    { label: "Net Profit/Loss", value: `$${stats.netProfit.toFixed(2)}`, color: "bg-blue-100 dark:bg-blue-900/30", textColor: stats.netProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400" },
    { label: "Initial Balance", value: `$${stats.initialBalance.toFixed(2)}`, color: "bg-purple-100 dark:bg-purple-900/30", textColor: "text-purple-600 dark:text-purple-400" },
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
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Trades</h2>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : recentTrades.length > 0 ? (
                <div className="space-y-3">
                  {recentTrades.map((trade, index) => (
                    <div key={index} className="border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-800 dark:text-white">{trade.label}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{trade.time}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Created at {trade.createdAt}</p>
                        </div>
                        <p className={`font-medium ${trade.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {trade.profit >= 0 ? `+$${trade.profit.toFixed(2)}` : `-$${Math.abs(trade.profit).toFixed(2)}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No recent trades found</p>
                  <p className="text-sm mt-2">Start trading to see your activity here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}