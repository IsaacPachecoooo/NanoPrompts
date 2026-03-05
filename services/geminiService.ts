import { GoogleGenAI, Type } from "@google/genai";
import { AIEditResponse } from "../types";

export const editPromptWithAI = async (originalPrompt: string, userInstruction: string): Promise<AIEditResponse> => {
  const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not configured.");
  }
  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `Original Prompt: "${originalPrompt}"\n\nUser Instruction: "${userInstruction}"`,
    config: {
      systemInstruction: "Eres un editor de prompts experto. Tu objetivo es aplicar cambios solicitados por el usuario sin alterar el estilo, calidad, estética, motor de render ni iluminación del original. Detecta placeholders. Si faltan datos, pregunta. No inventes detalles críticos. La respuesta debe ser un objeto JSON válido.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Preguntas pendientes si el input es ambiguo."
          },
          editedPrompt: {
            type: Type.STRING,
            description: "El prompt final editado."
          },
          changesMade: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Lista de cambios específicos realizados."
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
    const result = JSON.parse(response.text || "{}");
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
