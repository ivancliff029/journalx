"use client";

import Link from 'next/link';
import { useState} from 'react';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    
    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };
    
    const handleLogout = (e) => {
        e.preventDefault();
    }
    
    return (
        <nav className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="text-xl font-bold">FX Journaler</Link>
            <button onClick={toggleMenu} className="md:hidden focus:outline-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                )}
            </svg>
            </button>
            <div className={`md:flex ${isOpen ? 'block' : 'hidden'}`}>
            <Link href="/" className="block md:inline-block px-4 py-2">Home</Link>
            <Link href="/new-journal" className="block md:inline-block px-4 py-2">New Journal</Link>
            <Link href="/journals" className="block md:inline-block px-4 py-2">Journals</Link>
            <Link href="/dashboard" className="block md:inline-block px-4 py-2">Dashboard</Link>
            </div>
        </div>
        </nav>
    );
}