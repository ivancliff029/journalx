"use client";
import { useState } from "react";
import Navbar from "../components/Navbar";
import { db } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function NewJournalPage() {

  const[formData, setFormData] = useState({
    entrySetup:"",
    journalContent:"",
    moodBefore:"",
    moodAfter:"",
    profitloss:"",
    screenshot:"",
  })
  const handleChange = (e) => {
    const{name, value} = e.target;
    setFormData((prev) =>({
      ...prev,
      [name]: value
    }));
    console.log(formData);
  };
  const handleSubmit = async (e) => {
    try{
      e.preventDefault();
      const docRef = await addDoc(collection(db,"journals"), formData);
      console.log("Document written with ID: ", docRef.id);
    }catch(error){
      console.error("Error adding document: ", error);
    }
  };
  return (
    <>
      <Navbar />
      <div className="p-4 bg-gray-100 min-h-screen dark:bg-gray-800 dark:text-white item-center justify-center">
      <h1 className="text-4xl font-bold">New Journal Entry</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Entry Setup:
          <input 
            type="text" 
            name="entrySetup" required 
            className="w-full border border-gray-300 p-2 rounded dark:bg-gray-700 dark:text-white"
            value={formData.entrySetup}
            onChange={handleChange}
            />
        </label>
        <br />
        <label>
          Journal Content:
          <textarea 
            name="journalContent" required 
            className="w-full border border-gray-300 p-2 rounded dark:bg-gray-700 dark:text-white"
            value={formData.journalContent}
            onChange={handleChange}
            ></textarea>
        </label>
        <br />
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label>Mood Before Entry:</label>
            <select 
              name="moodBefore" required 
              className="w-full border border-gray-300 p-2 rounded dark:bg-gray-700 dark:text-white"
              value={formData.moodBefore}
              onChange={handleChange}
            >
                <option value="">Select Mood</option>
                <option value="happy">Happy</option>
                <option value="sad">Sad</option>
                <option value="neutral">Neutral</option>
                <option value="excited">Excited</option>
                <option value="anxious">Anxious</option>
            </select>
          </div>
          
        <div>
            <label>Mood After Entry:</label>
            <select 
              name="moodAfter" required 
              className="w-full border border-gray-300 p-2 rounded dark:bg-gray-700 dark:text-white"
              value={formData.moodAfter}
              onChange={handleChange}  
            >
              <option value="">Select Mood</option>
              <option value="happy">Happy</option>
              <option value="sad">Sad</option>
              <option value="neutral">Neutral</option>
              <option value="excited">Excited</option>
              <option value="anxious">Anxious</option>
            </select>
        </div>
      
       <div>
        <label>Profit/Loss:</label>
        <input 
          type="number" 
          name="profitloss" required 
          className="w-full border border-gray-300 p-2 rounded dark:bg-gray-700 dark:text-white" 
          value={formData.profitloss}
          onChange={handleChange}
        />
       </div>
       <div>
        <h2 className="text-sm font-semibold">Screenshot</h2>
        <input 
          type="file" 
          name="screenshot" 
          accept="image/*" 
          className="w-full border border-gray-300 p-2 rounded dark:bg-gray-700 dark:text-white" 
          value={formData.screenshot}
          onChange={handleChange}
        />
       </div>
        </div>
        <button type="submit" className="mt-4 bg-blue-500 text-white p-2 rounded">Save Entry</button>
      </form>
    </div>
    </>
    
  );
}       