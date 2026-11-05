
import { GoogleGenAI } from "@google/genai";

export const generateAIResponse = async (messages) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API key is not configured");
  }

  const ai = new GoogleGenAI({
    apiKey,
  });

  const contents = messages.map((message) => ({
    role: message.role === "user" ? "user" : "model",
    parts: [{ text: message.content }],
  }));

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-3.8-flash",

    contents,

    config: {
      systemInstruction: `
        You are ReplyMate AI, a helpful and professional
        customer support assistant.

        Your responsibilities:
        - Answer customer questions clearly and politely.
        - Be friendly, patient, and professional.
        - Keep responses concise and useful.
        - Ask follow-up questions when necessary.
        - Never invent order details, payment information,
          or company policies.
        - If you cannot resolve an issue, recommend
          speaking with a human support agent.
      `,
      temperature: 0.7,
      maxOutputTokens: 500,
    },
  });

  const aiResponse = response.text?.trim();

  if (!aiResponse) {
    throw new Error("Gemini returned an empty response");
  }

  return aiResponse;
};
