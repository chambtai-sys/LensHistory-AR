import { GoogleGenAI, Modality } from "@google/genai";

// Initialize the Gemini client
// CRITICAL: Use process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface LandmarkInfo {
  name: string;
  description: string;
  groundingMetadata: any;
}

/**
 * Step 1: Identify the landmark using Gemini 3 Pro (Vision)
 */
export async function identifyLandmark(base64Image: string, mimeType: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          {
            text: "Identify the specific landmark or building in this image. Return ONLY the name of the landmark. If it's not a famous landmark, describe what it is briefly."
          }
        ]
      }
    });

    const text = response.text;
    if (!text) throw new Error("No identification returned");
    return text.trim();
  } catch (error) {
    console.error("Error identifying landmark:", error);
    throw error;
  }
}

/**
 * Step 2: Get historical info using Gemini 2.5 Flash with Search Grounding
 */
export async function getLandmarkHistory(landmarkName: string): Promise<LandmarkInfo> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Tell me a fascinating, short historical story (max 100 words) about "${landmarkName}". 
      Focus on interesting facts suitable for a tourist. 
      Write it as a script for a tour guide.`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "Could not retrieve history.";
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

    return {
      name: landmarkName,
      description: text,
      groundingMetadata
    };
  } catch (error) {
    console.error("Error fetching history:", error);
    throw error;
  }
}

/**
 * Step 3: Generate Audio Narration using Gemini 2.5 Flash TTS
 */
export async function generateNarration(text: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
}