import Navbar from "../components/Navbar";

export default function NewJournalPage() {
  return (
    <>
      <Navbar />
      <div className="p-4 bg-gray-100 min-h-screen dark:bg-gray-800 dark:text-white item-center justify-center">
      <h1 className="text-4xl font-bold">New Journal Entry</h1>
      <form>
        <label>
          Entry Setup:
          <input type="text" name="title" required className="w-full border border-gray-300 p-2 rounded" />
        </label>
        <br />
        <label>
          Journal Content:
          <textarea name="content" required className="w-full border border-gray-300 p-2 rounded"></textarea>
        </label>
        <br />
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label>Mood Before Entry:</label>
            <select name="mood" required className="w-full border border-gray-300 p-2 rounded dark:bg-gray-700 dark:text-white">
              <option value="">Select Mood</option>
              <option value="happy">Happy</option>
              <option value="sad">Sad</option>
              <option value="neutral">Neutral</option>
              <option value="excited">Excited</option>
              <option value="anxious">Anxious</option>
            </select>
          </div>
          
        <div>
            <label>Mood After Entry:</label>
            <select name="moodAfter" required className="w-full border border-gray-300 p-2 rounded dark:bg-gray-700 dark:text-white">
              <option value="">Select Mood</option>
              <option value="happy">Happy</option>
              <option value="sad">Sad</option>
              <option value="neutral">Neutral</option>
              <option value="excited">Excited</option>
              <option value="anxious">Anxious</option>
            </select>
        </div>
      
       <div>
        <label>Profit/Loss:</label>
        <input type="number" name="profitLoss" required className="w-full border border-gray-300 p-2 rounded dark:bg-gray-700 dark:text-white" />
       </div>
       <div>
        <h2 className="text-sm font-semibold">Screenshot</h2>
        <input type="file" name="screenshot" accept="image/*" className="w-full border border-gray-300 p-2 rounded dark:bg-gray-700 dark:text-white" />
       </div>
        </div>
        <button type="submit" className="mt-4 bg-blue-500 text-white p-2 rounded">Save Entry</button>
      </form>
    </div>
    </>
    
  );
}       