"use client";
import Navbar from "../components/Navbar"
import { useState } from "react";
import { auth } from "../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from 'next/navigation';

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter(); 

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("User logged in:", userCredential.user);
            router.push("/journals");
        } catch (err) {
            setError(err.message);
        }
    };
    
    
    return (
        <>
        <Navbar />
        <div>
            <div>
                <h1 className="text-2xl font-bold mt-5">Login</h1>
            </div>
            <div>
                <form className="flex flex-col gap-4 mt-5" onSubmit={handleLogin}>
                    <h2 className="text-lg font-semibold">Login to Your Account</h2>
                    <input
                        type="email"
                        placeholder="Email"
                        className="border p-2 rounded dark:bg-gray-800 dark:text-white"
                        required 
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="border p-2 rounded dark:bg-gray-800 dark:text-white"
                        required 
                        onChange={(e) => setPassword(e.target.value)}
                        value={password}
                    />
                    <button
                        type="submit"
                        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
        </>
    )
}