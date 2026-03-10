import { GoogleGenAI, Type } from "@google/genai";
import { AIEditResponse } from "../types";

export const editPromptWithAI = async (originalPrompt: string, userInstruction: string): Promise<AIEditResponse> => {
  const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not configured.");
  }
  const ai = new GoogleGenAI({ apiKey });

  const promptText = `Original Prompt: "${originalPrompt}"\n\nUser Instruction: "${userInstruction}"`;

  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: promptText,
    config: {
      systemInstruction: "Eres un editor de prompts experto. Tu objetivo es aplicar cambios solicitados por el usuario sin alterar el estilo, calidad, estetica, motor de render ni iluminacion del original. Detecta placeholders. Si faltan datos, pregunta. No inventes detalles criticos. Responde SOLO con un objeto JSON valido sin markdown ni explicaciones adicionales.",
      responseMimeType: "application/json",
      temperature: 0.7,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          editedPrompt: {
            type: Type.STRING,
            description: "El prompt final editado."
          },
          changesMade: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Lista de cambios especificos realizados."
          },
          questions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Preguntas pendientes si el input es ambiguo."
          },
          assumptions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Suposiciones hechas para completar el prompt."
          }
        },
        required: ["editedPrompt", "changesMade"]
      }
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("Empty response from AI.");
    const result = JSON.parse(text);
    return {
      questions: result.questions || [],
      editedPrompt: result.editedPrompt || originalPrompt,
      changesMade: result.changesMade || [],
      assumptions: result.assumptions || []
    };
  } catch (e) {
    console.error("Failed to parse AI response:", e);
    throw new Error("AI Service returned an invalid format.");
  }
};
