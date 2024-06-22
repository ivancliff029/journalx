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
    const { input } = req.body;

    try {
      const chatSession = model.startChat({
        generationConfig,
        history: [],
      });

      const result = await chatSession.sendMessage(input);
      res.status(200).json({ response: result.response.text() });
    } catch (error) {
      res.status(500).json({ error: 'Error communicating with Gemini' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
