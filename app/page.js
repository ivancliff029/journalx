import Image from "next/image";
import Navbar from "./components/Navbar";

export default function Home() {
  return (
    <>
    <Navbar />
    <div>
      <div className="h-screen flex items-center justify-center">
        <h1 className="text-4xl font-bold text-center">
          Welcome to FX Journaler
        </h1>
      </div>
    </div>
    </>
  );
}
