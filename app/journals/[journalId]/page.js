export default async function RecentTradesDetails({ params }) {
  const { journalId } = await params;
  const res = await  fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/journals/${journalId}`, {
    cache: 'no-store'
  });
  if(!res.ok) {
    return <div className="flex items-center justify-center h-full">
      <div className="text-red-500 text-xl">Journal Not Found</div>
    </div>;
  }
  const journal = await res.json(); 

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">
          Recent Trade Details
        </h1>
        <h2 className="text-2xl text-gray-600 mb-4">Journal ID: {journal.id}</h2>
        <h2 className="text-2xl text-gray-600 mb-4">{journal.title}</h2>
        <p className="text-gray-700">{journal.content}</p>
      </div>
    </div>
  );
}
