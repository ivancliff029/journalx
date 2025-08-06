"use client";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { useAuthState } from 'react-firebase-hooks/auth';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
    const [user, loading] = useAuthState(auth);
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };
    
    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };
    
    const handleLogout = (e) => {
        e.preventDefault();
        signOut(auth)
            .then(() => {
                console.log("User signed out successfully");
            })
            .catch((error) => {
                console.error("Error signing out;", error);
            });
    }

    if (loading) {
        return (
            <nav className="bg-gray-800 text-white p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <Link href="/" className="text-xl font-bold">FX Journaler</Link>
                    <div className="animate-pulse">Loading...</div>
                </div>
            </nav>
        );
    }

    return (
        <nav className="bg-gray-800 text-white p-4">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-xl font-bold">FX Journaler</Link>
                
                {/* Mobile menu button */}
                <button onClick={toggleMenu} className="md:hidden focus:outline-none">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                        )}
                    </svg>
                </button>
                
                {/* Desktop menu */}
                <div className={`md:flex ${isOpen ? 'block' : 'hidden'}`}>
                    {/* Always show Home */}
                    <Link href="/" className="block md:inline-block px-4 py-2 hover:bg-gray-700 rounded">Home</Link>
                    
                    {/* Show when logged in */}
                    {user ? (
                        <>
                            <Link href="/new-journal" className="block md:inline-block px-4 py-2 hover:bg-gray-700 rounded">New Journal</Link>
                            <Link href="/journals" className="block md:inline-block px-4 py-2 hover:bg-gray-700 rounded">Journals</Link>
                            <Link href="/dashboard" className="block md:inline-block px-4 py-2 hover:bg-gray-700 rounded">Dashboard</Link>
                            
                            {/* Account dropdown */}
                            <div className="relative inline-block" ref={dropdownRef}>
                                <button 
                                    onClick={toggleDropdown}
                                    className="block md:inline-block px-4 py-2 hover:bg-gray-700 rounded focus:outline-none flex items-center"
                                >
                                    <span className="mr-1">{user.displayName || 'Account'}</span>
                                    <svg 
                                        className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                
                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-10">
                                        <Link 
                                            href="/profile" 
                                            className="block px-4 py-2 hover:bg-gray-600 rounded-t-md"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            Profile
                                        </Link>
                                        <Link 
                                            href="/settings" 
                                            className="block px-4 py-2 hover:bg-gray-600"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            Settings
                                        </Link>
                                        <button 
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 hover:bg-gray-600 rounded-b-md"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        // Show when logged out
                        <Link href="/login" className="block md:inline-block px-4 py-2 hover:bg-gray-700 rounded">Login</Link>
                    )}
                </div>
            </div>
        </nav>
    );
}