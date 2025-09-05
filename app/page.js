import Navbar from "./components/Navbar";
import Article from "./components/Article";

export default function Home() {
  const posts = [
    {
      type: "quote",
      content:
        "The goal of a successful trader is to make the best trades. Money is a consequence.",
      author: "Paul Tudor Jones",
      imageUrl:
        "https://via.placeholder.com/400x200/1e40af/ffffff?text=Forex+Mastery",
    },
    {
      type: "tip",
      title: "Risk Management Tip",
      content:
        "Never risk more than 1-2% of your trading capital on a single trade. Protect your account first.",
      author: "Pro Trader Rule",
    },
    {
      type: "motivation",
      content:
        "Losses are tuition. Every losing trade teaches you something. Stay disciplined.",
      author: "Anonymous",
      imageUrl:
        "https://via.placeholder.com/400x200/7c3aed/ffffff?text=Stay+Strong",
    },
    {
      type: "info",
      title: "Did You Know?",
      content:
        "Over 90% of retail traders lose money. The top 10% win by having a journal, plan, and discipline.",
    },
  ];
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Stay Inspired. Stay Disciplined.
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, index) => (
              <Article key={index} article={post} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
