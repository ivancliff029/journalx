export default function Dashboard(){
    const tradeData = [
        {label:"Total Trade", value: 23},
        {label:"Profits", value: 15},
        {label:"Losses", value: 8}
    ];
    return (
        <>
        <div>
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

                </div>
                <div className="w-2/5 bg-blue-200 p-4 rounded">
                    <h2 className="text-xl font-bold">Trade History</h2>
                </div>
            </div>
        </div>
        </>
    );
}