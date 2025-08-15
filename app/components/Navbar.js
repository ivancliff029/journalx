"use client";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { useAuthState } from 'react-firebase-hooks/auth';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { FiHome, FiBook, FiPieChart, FiUser, FiSettings, FiLogOut, FiChevronDown, FiMenu, FiX } from 'react-icons/fi';

export default function Navbar() {
    const [user, loading] = useAuthState(auth);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const mobileMenuRef = useRef(null);
    
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && !event.target.closest('button[aria-label="Toggle menu"]')) {
                setIsMobileMenuOpen(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };
    
    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };
    
    const handleLogout = async (e) => {
        e.preventDefault();
        try {
            await signOut(auth);
            console.log("User signed out successfully");
        } catch (error) {
            console.error("Error signing out:", error);
        }
    }

    if (loading) {
        return (
            <nav className="bg-gray-900 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <Link href="/" className="text-xl font-bold flex items-center">
                            <span className="text-blue-400">FX</span> Journaler
                        </Link>
                        <div className="animate-pulse h-6 w-24 bg-gray-700 rounded"></div>
                    </div>
                </div>
            </nav>
        );
    }

    return (
        <nav className="bg-gray-900 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo/Brand */}
                    <Link href="/" className="text-xl font-bold flex items-center">
                        <span className="text-blue-400">FX</span> Journaler
                    </Link>
                    
                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-4">
                        <Link 
                            href="/" 
                            className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 flex items-center"
                        >
                            <FiHome className="mr-2" /> Home
                        </Link>
                        
                        {user && (
                            <>
                                <Link 
                                    href="/journals" 
                                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 flex items-center"
                                >
                                    <FiBook className="mr-2" /> Journals
                                </Link>
                                <Link 
                                    href="/dashboard" 
                                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 flex items-center"
                                >
                                    <FiPieChart className="mr-2" /> Dashboard
                                </Link>
                                
                                {/* Account dropdown */}
                                <div className="relative" ref={dropdownRef}>
                                    <button 
                                        onClick={toggleDropdown}
                                        className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 focus:outline-none"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                                            <FiUser className="text-white" />
                                        </div>
                                        <span>{user.displayName || 'Account'}</span>
                                        <FiChevronDown className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    
                                    {isDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-md shadow-lg z-50 border border-gray-700">
                                            <Link 
                                                href="/profile" 
                                                className="flex items-center px-4 py-3 hover:bg-gray-700 rounded-t-md text-sm"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                <FiUser className="mr-3" /> Profile
                                            </Link>
                                            <Link 
                                                href="/settings" 
                                                className="flex items-center px-4 py-3 hover:bg-gray-700 text-sm"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                <FiSettings className="mr-3" /> Settings
                                            </Link>
                                            <button 
                                                onClick={handleLogout}
                                                className="w-full text-left flex items-center px-4 py-3 hover:bg-gray-700 rounded-b-md text-sm"
                                            >
                                                <FiLogOut className="mr-3" /> Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                        
                        {!user && (
                            <Link 
                                href="/login" 
                                className="px-3 py-2 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-700 flex items-center"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                    
                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={toggleMobileMenu}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? (
                                <FiX className="h-6 w-6" />
                            ) : (
                                <FiMenu className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Mobile Navigation */}
            {isMobileMenuOpen && (
                <div ref={mobileMenuRef} className="md:hidden bg-gray-800 border-t border-gray-700">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <Link 
                            href="/" 
                            className="flex items-center px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <FiHome className="mr-3" /> Home
                        </Link>
                        
                        {user && (
                            <>
                                <Link 
                                    href="/journals" 
                                    className="flex items-center px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <FiBook className="mr-3" /> Journals
                                </Link>
                                <Link 
                                    href="/dashboard" 
                                    className="flex items-center px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <FiPieChart className="mr-3" /> Dashboard
                                </Link>
                                <Link 
                                    href="/profile" 
                                    className="flex items-center px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <FiUser className="mr-3" /> Profile
                                </Link>
                                <Link 
                                    href="/settings" 
                                    className="flex items-center px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <FiSettings className="mr-3" /> Settings
                                </Link>
                                <button 
                                    onClick={(e) => {
                                        handleLogout(e);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="w-full text-left flex items-center px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700"
                                >
                                    <FiLogOut className="mr-3" /> Logout
                                </button>
                            </>
                        )}
                        
                        {!user && (
                            <Link 
                                href="/login" 
                                className="flex items-center px-3 py-2 rounded-md text-base font-medium bg-blue-600 hover:bg-blue-700"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}