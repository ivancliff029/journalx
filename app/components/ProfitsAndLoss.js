"use client";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useEffect, useState } from 'react';
import { db } from "../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth } from "../lib/firebase";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ProfitsAndLoss() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const q = query(collection(db, "journals"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        
        // Initialize monthly data
        const monthlyData = Array(12).fill(0).map(() => ({ profits: 0, losses: 0 }));
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const date = new Date(data.createdAt);
          const month = date.getMonth();
          const profitLoss = parseFloat(data.profitloss) || 0;
          
          if (profitLoss >= 0) {
            monthlyData[month].profits += profitLoss;
          } else {
            monthlyData[month].losses += Math.abs(profitLoss);
          }
        });

        const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        setChartData({
          labels,
          datasets: [
            {
              label: 'Profits',
              data: monthlyData.map(month => month.profits),
              backgroundColor: '#4FD1C5',
              borderRadius: 4,
            },
            {
              label: 'Losses',
              data: monthlyData.map(month => month.losses),
              backgroundColor: '#F87171',
              borderRadius: 4,
            }
          ]
        });
      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Profits & Losses',
        font: {
          size: 16
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value;
          }
        }
      }
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center">Loading chart data...</div>;
  if (!chartData) return <div className="h-64 flex items-center justify-center">No data available</div>;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <Bar data={chartData} options={options} />
    </div>
  );
}