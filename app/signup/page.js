"use client";
import Navbar from "../components/Navbar";
import { useState } from "react";
import { auth } from "../lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from 'next/navigation';


export default function Signup(){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignup = async (e) =>{
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(
              auth,
              email,
              password  
            );
            console.log("User signed up:",userCredential.user);
            alert("Account created successfully!");
            router.push("/login"); 
        }catch(err){
            setError(err.message);
        }finally{
            setLoading(false);
        }
    };
    return(
        <>
        <Navbar />
        <div>
            <div>
                <h1 className="text-2xl font-bold mt-5">Sign Up</h1>
            </div>
            <div>
                <form onSubmit={handleSignup} className="flex flex-col gap-4 mt-5">
                    <h2 className="text-lg font-semibold">Create an Account</h2>
                    <div className="bg-orange-100 p-4 rounded mb-4">
                        {error && <p className="text-red-500">{error}</p>}
                    </div>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border p-2 rounded dark:bg-gray-800 dark:text-white"
                        required 
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border p-2 rounded dark:bg-dark-800 dark:text-white"
                        required    
                    />
                    <button
                        type="submit"
                        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                        disabled={loading}
                    >
                        {loading ? "Creating Account..." : "Sign Up"}
                    </button>
                </form>
            </div>
        </div>
        </>
    )
}