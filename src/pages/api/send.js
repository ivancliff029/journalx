
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";


const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};


export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { input, journalId } = req.body;
    
    try {
      const journalRef = doc(db, "journals", journalId);
      const journalDoc = await getDoc(journalRef);

      if (!journalDoc.exists()) {
        return res.status(404).json({ error: 'Journal entry not found' });
      }

      const journalData = journalDoc.data();
      const chatSession = await model.startChat({
        generationConfig,
        history: journalData.history,
      });
      const result = await chatSession.sendMessage(input);
      const responseText = await result.response.text();

      journalData.history.push({ role: "user", parts: [ { text: input}] });
      journalData.history.push({ role: "model", parts: [ { text: responseText}] });

      await updateDoc(journalRef, {
        history: journalData.history,
        quotes: arrayUnion(responseText)
      });

      res.status(200).json({
        response: responseText,
        sessionId: chatSession.id,
        history: chatSession.history
      });
    } catch (error) {
      console.error('Error communicating with Gemini:', error);
      res.status(500).json({ error: 'Error communicating with Gemini', details: error.message, stack: error.stack });
    } 
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
