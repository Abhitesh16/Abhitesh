
import { GoogleGenAI } from "@google/genai";
import { type ChatMessage } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Fix: Refactored getChatResponse to align with Gemini API best practices.
// The previous implementation used a single large string for the prompt.
// This has been updated to use systemInstruction for persona/instructions and a
// structured 'contents' array for chat history and the user's question, and removed the unused formatChatHistory function.
export async function getChatResponse(
  pdfText: string,
  question: string,
  history: ChatMessage[]
): Promise<string> {
  const model = "gemini-2.5-flash";

  const systemInstruction = `You are a helpful AI assistant specialized in analyzing and answering questions about the content of a provided document.
If the question is unrelated to the document, politely decline to answer.`;

  const contents = history.map(message => ({
      role: message.sender === 'user' ? 'user' : 'model',
      parts: [{ text: message.text }]
  }));

  contents.push({ 
    role: 'user', 
    parts: [{ text: `
DOCUMENT CONTENT:
---
${pdfText.substring(0, 30000)}
---

USER'S QUESTION:
${question}` 
    }] 
  });

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
          systemInstruction,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get response from AI model.");
  }
}
