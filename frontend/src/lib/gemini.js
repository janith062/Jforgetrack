import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.warn('Missing Gemini API Key. Please check your .env.local file.');
}

// Initialize the Gemini client
export const genAI = new GoogleGenerativeAI(apiKey || 'placeholder-api-key');

// You can use this instance later to get specific models, e.g.:
// const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
