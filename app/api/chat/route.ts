import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from '../../lib/firebase';
import { collection, addDoc } from "firebase/firestore";

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

// POST method to handle chat
export const POST = async (req, res) => {
  const { title, description, emotion, activity } = await req.json(); // Use await req.json() to parse JSON

  const inputText = `Based on the following journal entry, find related stoic quotes:\n${description}`;

  try {
    const chatSession = await model.startChat({
      generationConfig,
      history: [],
    });

    let currentMessages = [];

    const result = await chatSession.sendMessage(inputText);
    const responseText = await result.response.text();
    
    currentMessages.push({ role: "user", parts: [ { text: inputText}] });
    currentMessages.push({ role: "model", parts: [{ text: responseText}] });

    const journalRef = await addDoc(collection(db, "journals"), {
      title,
      description,
      emotion,
      activity,
      createdAt: new Date(),
      quotes: [responseText],
      history: currentMessages,
    });

    return new Response(JSON.stringify({ response: responseText, id: journalRef.id, history: currentMessages }), { status: 200 });
  } catch (error) {
    console.error('Error communicating with Gemini:', error);
    return new Response(JSON.stringify({ error: 'Error communicating with Gemini', details: error.message, stack: error.stack }), { status: 500 });
  }
};

// Method not allowed
export const GET = () => new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
