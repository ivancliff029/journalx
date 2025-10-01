"use client";
import Navbar from "../components/Navbar";
import { useState } from "react";
import { auth } from "../lib/firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from 'next/navigation';
import { FiMail, FiLock, FiLogIn, FiEye, FiEyeOff, FiArrowRight, FiAlertCircle } from 'react-icons/fi';

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetSent, setResetSent] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const router = useRouter(); 

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("User logged in:", userCredential.user);
            router.push("/dashboard");
        } catch (err) {
            let errorMessage = "Failed to log in. Please try again.";
            switch (err.code) {
                case 'auth/invalid-email':
                    errorMessage = "Please enter a valid email address.";
                    break;
                case 'auth/user-disabled':
                    errorMessage = "This account has been disabled.";
                    break;
                case 'auth/user-not-found':
                    errorMessage = "No account found with this email.";
                    break;
                case 'auth/wrong-password':
                    errorMessage = "Incorrect password. Please try again.";
                    break;
                case 'auth/too-many-requests':
                    errorMessage = "Too many failed attempts. Please try again later.";
                    break;
                case 'auth/network-request-failed':
                    errorMessage = "Network error. Please check your connection.";
                    break;
                default:
                    errorMessage = err.message;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setResetLoading(true);
        setError("");
        
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            setResetSent(true);
        } catch (err) {
            let errorMessage = "Failed to send reset email.";
            switch (err.code) {
                case 'auth/user-not-found':
                    errorMessage = "No account found with this email.";
                    break;
                case 'auth/invalid-email':
                    errorMessage = "Please enter a valid email address.";
                    break;
                default:
                    errorMessage = err.message;
            }
            setError(errorMessage);
        } finally {
            setResetLoading(false);
        }
    };

    const closeResetModal = () => {
        setShowResetModal(false);
        setResetEmail("");
        setResetSent(false);
        setError("");
    };

    return (
        <>
            <Navbar />
            
            {/* Reset Password Modal */}
            {showResetModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-md w-full">
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FiLock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                                Reset Password
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                {resetSent 
                                    ? "Check your email for a password reset link"
                                    : "Enter your email to receive a password reset link"
                                }
                            </p>
                        </div>

                        {!resetSent ? (
                            <form onSubmit={handlePasswordReset} className="space-y-4">
                                <div>
                                    <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        id="resetEmail"
                                        type="email"
                                        placeholder="Enter your email"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-200"
                                        required
                                    />
                                </div>
                                
                                {error && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start">
                                        <FiAlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                                        <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={closeResetModal}
                                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={resetLoading}
                                        className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-lg transition duration-200 flex items-center justify-center"
                                    >
                                        {resetLoading ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            "Send Reset Link"
                                        )}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FiMail className="w-8 h-8 text-green-600 dark:text-green-400" />
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                                    We've sent a password reset link to <span className="font-medium text-gray-800 dark:text-white">{resetEmail}</span>
                                </p>
                                <button
                                    onClick={closeResetModal}
                                    className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition duration-200"
                                >
                                    Return to Login
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Main Login Content */}
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-8">
                <div className="max-w-md w-full">
                    {/* Card Container */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FiLogIn className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                                Welcome Back
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Sign in to your trading journal
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-start">
                                <FiAlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleLogin} className="space-y-6">
                            {/* Email Input */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiMail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                                        required 
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiLock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                                        required 
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                                    </button>
                                </div>
                                
                                {/* Forgot Password */}
                                <div className="flex justify-end mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowResetModal(true)}
                                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition duration-200"
                                    >
                                        Forgot your password?
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Signing In...
                                    </>
                                ) : (
                                    <>
                                        Sign In
                                        <FiArrowRight className="ml-2 w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Signup Link */}
                        <div className="text-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-gray-600 dark:text-gray-400">
                                Don't have an account?{" "}
                                <button
                                    onClick={() => router.push("/signup")}
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition duration-200"
                                >
                                    Create one here
                                </button>
                            </p>
                        </div>

                        {/* Demo Features */}
                        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Track Trades</p>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                                <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Analyze Performance</p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                                <p className="text-xs font-medium text-green-600 dark:text-green-400">Improve Strategy</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}