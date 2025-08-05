import ProfitsAndLoss from "../components/ProfitsAndLoss";
import Navbar from "../components/Navbar";

export default function Dashboard(){
    const tradeData = [
        {label:"Total Trade", value: 23},
        {label:"Profits", value: 15},
        {label:"Losses", value: 8}
    ];
    const tradeTimeline = [
        {label: "Sell XAUUSD", time:"2:23pm", profit:12},
        {label: "Buy EURUSD", time:"1:45pm", profit:-5},
        {label: "Sell GBPUSD", time:"12:30pm", profit:8},
        {label: "Buy USDJPY", time:"11:15am", profit:3}
    ]
    return (
        <>
        <Navbar />
        <div className="p-10"> 
            <div className="grid grid-cols-3">
                {
                    tradeData.map((trade, index) => (
                        <div key={index} className="p-4 m-2 rounded bg-blue-500 shadow">
                            <h3 className="text-lg font-semibold">{trade.label}</h3>
                            <p className="text-2xl">{trade.value}</p>
                        </div>
                    ))
                }
            </div>
            <div className="flex gap-4 p-4">
                <div className="w-3/5 bg-blue-200 p-4 rounded">
                    <h2 className="text-xl font-bold">Profits and Loss Charts</h2>
                    <ProfitsAndLoss />
                </div>
                <div className="w-2/5 bg-blue-200 p-4 rounded">
                    <h2 className="text-xl font-bold">Trade History</h2>
                    {
                        tradeTimeline.map((trade, index) => (
                            <div key={index} className="p-4 m-2 rounded bg-blue-500 shadow">
                                <h3 className="text-lg font-semibold">{trade.label}</h3>
                                <p className="text-sm">{trade.time}</p>
                                <p className={`text-sm ${trade.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {trade.profit >= 0 ? `+${trade.profit}` : trade.profit}
                                </p>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
        </>
    );
}