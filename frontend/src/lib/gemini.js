import { GoogleGenerativeAI } from '@google/generative-ai';

export const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';

function normalizeApiKey(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/^['"`]+|['"`]+$/g, '');
}

const apiKey = normalizeApiKey(import.meta.env.VITE_GEMINI_API_KEY);

export const hasGeminiApiKey = Boolean(
  apiKey &&
  !/^your[_-]?/i.test(apiKey) &&
  !/placeholder/i.test(apiKey)
);

if (!hasGeminiApiKey) {
  console.warn('Missing Gemini API Key. Please check your .env.local file.');
}

export function getGeminiClient() {
  if (!hasGeminiApiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

export function getGeminiModel(model = DEFAULT_GEMINI_MODEL) {
  const client = getGeminiClient();
  if (!client) return null;
  return client.getGenerativeModel({ model });
}

// You can use this instance later to get specific models, e.g.:
// const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
