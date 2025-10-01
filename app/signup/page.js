"use client";
import Navbar from "../components/Navbar";
import { useState } from "react";
import { auth, db } from "../lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import { FiMail, FiLock, FiUser, FiArrowRight, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password  
      );
      
      // Create user settings document in Firestore
      const userSettings = {
        mousePsychologyAlerts: true,
        darkMode: false,
        accountBalance: 0,
        blownAccounts: [],
        depositHistory: [],
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, "userSettings", userCredential.user.uid), userSettings);
      
      console.log("User signed up:", userCredential.user);
      router.push("/dashboard"); 
    } catch (err) {
      let errorMessage = "Failed to create account. Please try again.";
      switch (err.code) {
        case 'auth/email-already-in-use':
          errorMessage = "This email is already registered. Please use a different email or try logging in.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Please enter a valid email address.";
          break;
        case 'auth/weak-password':
          errorMessage = "Password is too weak. Please choose a stronger password.";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Network error. Please check your connection and try again.";
          break;
        default:
          errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.match(/[a-z]+/)) strength += 1;
    if (password.match(/[A-Z]+/)) strength += 1;
    if (password.match(/[0-9]+/)) strength += 1;
    if (password.match(/[$@#&!]+/)) strength += 1;
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    checkPasswordStrength(newPassword);
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0: return 'bg-gray-200';
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-blue-500';
      case 5: return 'bg-green-500';
      default: return 'bg-gray-200';
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0: return 'Very Weak';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      case 5: return 'Very Strong';
      default: return '';
    }
  };

  const passwordRequirements = [
    { text: "At least 6 characters", met: password.length >= 6 },
    { text: "Contains lowercase letter", met: /[a-z]/.test(password) },
    { text: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    { text: "Contains number", met: /[0-9]/.test(password) },
    { text: "Contains special character", met: /[$@#&!]/.test(password) },
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full">
          {/* Card Container */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUser className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                Create Account
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Join thousands of traders tracking their performance
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-start">
                <FiAlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Signup Form */}
            <form onSubmit={handleSignup} className="space-y-6">
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
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={handlePasswordChange}
                    className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    required    
                  />
                </div>

                {/* Password Strength Meter */}
                {password && (
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Password strength</span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Password Requirements */}
                {password && (
                  <div className="mt-3 space-y-2">
                    {passwordRequirements.map((req, index) => (
                      <div key={index} className="flex items-center">
                        {req.met ? (
                          <FiCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-gray-300 rounded-full mr-2"></div>
                        )}
                        <span className={`text-xs ${req.met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password Input */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`block w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ${
                      confirmPassword && password !== confirmPassword
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required    
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    Passwords do not match
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || password !== confirmPassword || password.length < 6}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <FiArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="text-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
                <button
                  onClick={() => router.push("/login")}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition duration-200"
                >
                  Sign in here
                </button>
              </p>
            </div>

            {/* Features List */}
            <div className="mt-8 grid grid-cols-2 gap-4 text-center">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-2">
                  <FiCheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Track Performance</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center mx-auto mb-2">
                  <FiCheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Analyze Trades</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}