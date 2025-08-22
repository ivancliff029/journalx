import Navbar from "@/app/components/Navbar";

export default async function RecentTradesDetails({ params }) {
  const { journalId } = await params;
  
  // Fetch journal data
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/journals/${journalId}`, {
    cache: 'no-store'
  });
  
  if (!res.ok) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500 text-xl">Journal Not Found</div>
      </div>
    );
  }
  
  const journal = await res.json();

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-white">
            Trade Details
          </h1>
          
          {/* Display trade information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Symbol</h2>
              <p className="text-lg text-gray-800 dark:text-white">
                {journal.symbol || 'Not specified'}
              </p>
            </div>
            
            <div>
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Entry Setup</h2>
              <p className="text-lg text-gray-800 dark:text-white">
                {journal.entrySetup || 'Not specified'}
              </p>
            </div>
            
            <div>
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Profit/Loss</h2>
              <p className={`text-lg font-semibold ${journal.profitloss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                ${journal.profitloss || 0}
              </p>
            </div>
            
            <div>
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</h2>
              <p className="text-lg text-gray-800 dark:text-white">
                {new Date(journal.createdAt?.seconds * 1000 || journal.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          {/* Display notes if available */}
          {journal.notes && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Trade Notes</h2>
              <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                {journal.notes}
              </p>
            </div>
          )}
          
          {/* Display analysis if available */}
          {journal.analysis && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">AI Analysis</h2>
              <div className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg whitespace-pre-line">
                {journal.analysis}
              </div>
            </div>
          )}
          
          {/* Display image if available */}
          {journal.screenshot && (
            <div>
              <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Trade Screenshot</h2>
              <img 
                src={journal.screenshot} 
                alt="Trade screenshot" 
                className="rounded-lg shadow-md max-w-full h-auto"
              />
            </div>
          )}
        </div>
      </div>
    </>  
  );
}