"use client";
import ProfitsAndLoss from "../components/ProfitsAndLoss";
import Navbar from "../components/Navbar";
import { useEffect, useState } from 'react';
import { db } from "../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth } from "../lib/firebase";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalTrades: 0,
    profitableTrades: 0,
    losingTrades: 0,
    netProfit: 0
  });
  const [recentTrades, setRecentTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

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
          if (trades.length < 5) {
            trades.push({
              id: doc.id,
              label: data.entrySetup || "Trade",
              time: new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              profit: profitLoss
            });
          }
        });

        setStats({
          totalTrades: total,
          profitableTrades: profitable,
          losingTrades: losing,
          netProfit: netProfit
        });

        setRecentTrades(trades);
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
    { label: "Net Profit", value: `$${stats.netProfit.toFixed(2)}`, color: "bg-blue-100 dark:bg-blue-900/30", textColor: stats.netProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400" }
  ];

  return (
    <>
      <Navbar />
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-6">Trading Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card, index) => (
            <div key={index} className={`${card.color} p-5 rounded-xl shadow-sm`}>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</h3>
              <p className={`text-2xl font-semibold mt-2 ${card.textColor}`}>{card.value}</p>
            </div>
          ))}
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
                <div className="flex items-center justify-center h-32">Loading...</div>
              ) : recentTrades.length > 0 ? (
                <div className="space-y-3">
                  {recentTrades.map((trade, index) => (
                    <div key={index} className="border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-800 dark:text-white">{trade.label}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{trade.time}</p>
                        </div>
                        <p className={`font-medium ${trade.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {trade.profit >= 0 ? `+$${trade.profit.toFixed(2)}` : `-$${Math.abs(trade.profit).toFixed(2)}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">No recent trades found</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}