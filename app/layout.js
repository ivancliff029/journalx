
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Journal X",
  description: "AI powered Journaling App",
};

export default function RootLayout({ children }) {
  return (
    <>
    
      <html lang="en">
        <body className="bg-white">
          <Navbar />
          <div>
          {children}
          </div>
        </body>
      </html>
    </>
  );
}
