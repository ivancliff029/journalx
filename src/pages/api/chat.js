// pages/api/chat.js
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    const { description } = req.body;

    const inputText = `Based on the following journal entry, find related stoic quotes:\n${description}`;

    try {
      const chatSession = await model.startChat({
        generationConfig,
        history: [],
      });

      const result = await chatSession.sendMessage(inputText);
      const responseText = await result.response.text();
      res.status(200).json({ response: responseText });
    } catch (error) {
      console.error('Error communicating with Gemini:', error);
      res.status(500).json({ error: 'Error communicating with Gemini', details: error.message, stack: error.stack });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
