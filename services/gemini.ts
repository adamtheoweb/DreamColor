import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage } from "../types";

// WICHTIG: Bei Vite Apps muss es import.meta.env.VITE_... heißen
const apiKey = import.meta.env.VITE_API_KEY;

if (!apiKey) {
  console.error("API Key fehlt! Bitte in .env oder Vercel eintragen.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "dummy-key" });

// KORRIGIERTE MODELLE (Die existieren wirklich)
const TEXT_MODEL = 'gemini-1.5-flash'; 
const IMAGE_MODEL = 'imagen-3.0-generate-001';

/**
* Generates 5 distinct image prompts based on a theme for a coloring book.
*/
export const generatePagePrompts = async (theme: string): Promise<string[]> => {
  const prompt = `
  Create 5 distinct, creative scenes for a coloring book based on the theme: "${theme}".
  The scenes should be suitable for black and white line art.
  Return ONLY a JSON array of strings, where each string is a detailed description of a scene.
  Do not include markdown formatting like \`\`\`json.
  `;

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text()); // Beachte: im neuen SDK ist text() oft eine Funktion oder Property, hier sicherheitshalber angepasst
  } catch (error) {
    console.error("Error generating prompts:", error);
    return [
      `${theme} - Scene 1`,
      `${theme} - Scene 2`,
      `${theme} - Scene 3`,
      `${theme} - Scene 4`,
      `${theme} - Scene 5`,
    ];
  }
};

/**
* Generates a single image using Imagen based on a prompt.
*/
export const generateColoringImage = async (sceneDescription: string): Promise<string> => {
  const enhancedPrompt = `
  A high-quality coloring book page of ${sceneDescription}.
  Strictly black and white line art.
  Clean, distinct black outlines.
  White background.
  No shading, no greyscale, no colors.
  Vector style illustration.
  Detailed enough to be interesting to color.
  `;

  try {
    const response = await ai.models.generateImages({
      model: IMAGE_MODEL,
      prompt: enhancedPrompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '3:4', 
        outputMimeType: 'image/jpeg',
      },
    });

    // Pfad im neuen SDK prüfen
    const base64Image = response.generatedImages?.[0]?.image?.imageBytes;
    if (!base64Image) throw new Error("No image generated");
    
    return `data:image/jpeg;base64,${base64Image}`;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

/**
* Chat helper function
*/
export const sendChatMessage = async (history: ChatMessage[], newMessage: string): Promise<string> => {
  const chat = ai.chats.create({
    model: TEXT_MODEL,
    config: {
      systemInstruction: "You are a creative assistant for a coloring book app. Help users brainstorm creative themes. Keep responses short.",
    },
    history: history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }))
  });

  const result = await chat.sendMessage({ message: newMessage });
  return result.text() || "Thinking...";
};
