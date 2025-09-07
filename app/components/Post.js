export default function Post() {
  return (
    <div className="w-full mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-4">
          <textarea
            className="w-full p-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 
                     bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 
                     rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 
                     focus:border-transparent transition-all duration-200 text-base leading-relaxed
                     min-h-[120px] sm:min-h-[100px]"
            rows="4"
            placeholder="What's on your mind?"
          />
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Post options - could add emoji, image upload, etc. */}
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                📷
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                😊
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                📍
              </button>
            </div>
            
            <button className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 
                           hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg 
                           transition-all duration-200 transform hover:scale-105 active:scale-95
                           shadow-md hover:shadow-lg focus:outline-none focus:ring-2 
                           focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
              Share Post
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}