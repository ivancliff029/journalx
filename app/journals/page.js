"use client";
import Navbar from "../components/Navbar"
import { useState, useEffect } from "react";
import { db,auth } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Journals() {
    const [journals, setJournals] = useState([]);
    useEffect(() => {
        const fetchJournals = async () => {
            const querySnapshot = await getDocs(collection(db, "journals"));
            const journalData = querySnapshot.docs.map( doc=>({
                id: doc.id,
                ...doc.data()
            }))
            setJournals(journalData);
        }
        fetchJournals();
    }, []);

    const handleEdit =  (id) => {
        alert(`Id {id} was selected`);
    }
    const handleDelete = (id) => {
        alert(`Id {id} was selected`);
    }

    return(
    <>
    <Navbar />
        <div>
            <div>
                <h1 className="text-3xl mt-3">All Journals</h1>
            </div>
            <div className="">
                {journals.map((journal) => (
                    <div key={journal.id} className="border p-4 mb-4 rounded">
                        <h2 className="text-xl font-bold">{journal.entrySetup}</h2>
                        <p>{journal.journalContent}</p>
                        <p>Mood Before: {journal.moodBefore}</p>
                        <p>Mood After: {journal.moodAfter}</p>
                        <p>Profit/Loss: {journal.profitloss}</p>
                        {journal.screenshot && (
                            <img src={journal.screenshot} alt="Screenshot" className="w-full h-auto mt-2" />
                        )}
                        <div>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <button onClick={() => handleEdit(journal.id)} className="bg-blue-500 text-white p-2 rounded">Edit</button>
                                </div>
                                <div>
                                    <button onClick={() => handleDelete(journal.id)} className="bg-red-500 text-white p-2 rounded">Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </>
    );
}