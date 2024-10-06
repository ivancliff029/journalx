import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI, GenerationConfig } from "@google/generative-ai";
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not defined');
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig= {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

// Correctly typed API handler for POST requests
export async function POST(req, res) {
  try {
    const { input, journalId } = req.body;

    if (typeof input !== 'string' || typeof journalId !== 'string') {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    const journalRef = doc(db, "journals", journalId);
    const journalDoc = await getDoc(journalRef);

    if (!journalDoc.exists()) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    const journalData = journalDoc.data();
    const chatSession = await model.startChat({
      generationConfig,
      history: journalData.history || [],
    });
    const result = await chatSession.sendMessage(input);
    const responseText = await result.response.text();

    await updateDoc(journalRef, {
      history: arrayUnion({ role: "user", parts: [{ text: input }] }, { role: "model", parts: [{ text: responseText }] }),
      quotes: arrayUnion(responseText),
    });

    res.status(200).json({
      response: responseText,
      history: journalData.history || [],
    });
  } catch (error) {
    console.error('Error communicating with Gemini:', error);
    res.status(500).json({ error: 'Error communicating with Gemini', details: error.message, stack: error.stack });
  }
}

// Explicitly handle GET requests with a 405 Method Not Allowed response
export async function GET(req, res) {
  res.status(405).json({ error: 'Method not allowed' });
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    return POST(req, res);
  } else {
    return GET(req, res);
  }
}
