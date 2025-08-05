"use client"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],      
    datasets: [
        {
            label: 'Profits',
            data: [12, 15, 10, 20, 25, 30, 28, 35, 40, 45, 50, 55],
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
        },
        {
            label: 'Losses',
            data: [5, 8, 6, 10, 12, 15, 14, 18, 20, 22, 25, 30],
            backgroundColor: 'rgba(255, 99, 132, 0.6                    )',
        }
    ]
};          

export default function ProfitsAndLoss() {
    return (
        <div>
            <Bar data={chartData} />
        </div>
    );
}