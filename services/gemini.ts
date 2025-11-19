import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage } from "../types";

const apiKey = import.meta.env.VITE_API_KEY;

// DIE RICHTIGEN MODELLE
const TEXT_MODEL = 'gemini-1.5-flash';
const IMAGE_MODEL = 'imagen-3.0-generate-001';

/**
 * Generates 3 distinct image prompts based on a theme for a coloring book.
 */
export const generatePagePrompts = async (theme: string): Promise<string[]> => {
  const prompt = `
    Create 3 distinct, creative scenes for a coloring book based on the theme: "${theme}".
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
          items: {
            type: Type.STRING
          }
        }
      }
    });
    
    const text = response.text; // Oder response.text() je nach SDK Version
    
    if (!text) throw new Error("No response from AI");
    
    // Manchmal packt die KI Markdown drumrum, das entfernen wir sicherheitshalber
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error generating prompts:", error);
    return [
      `${theme} - Scene 1`,
      `${theme} - Scene 2`,
      `${theme} - Scene 3`,
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
  return result.text || "Thinking...";
};