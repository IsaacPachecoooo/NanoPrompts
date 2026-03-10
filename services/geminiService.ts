import { GoogleGenAI, Type } from "@google/genai";
import { AIEditResponse } from "../types";

/**
 * Detecta si un string es JSON válido
 */
const isValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

/**
 * Intenta extraer JSON de un string que pueda contener markdown o explicaciones
 */
const extractJSON = (text: string): string => {
  // Intentar encontrar JSON entre llaves
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch && isValidJSON(jsonMatch[0])) {
    return jsonMatch[0];
  }
  return text;
}

export const editPromptWithAI = async (originalPrompt: string, userInstruction: string): Promise<AIEditResponse> => {
  const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not configured.");
  }
  const ai = new GoogleGenAI({ apiKey });

  // Detectar si el prompt original es JSON
  let isJsonPrompt = false;
  let originalJsonStructure: any = null;
  try {
    originalJsonStructure = JSON.parse(originalPrompt);
    isJsonPrompt = true;
  } catch (e) {
    isJsonPrompt = false;
  }

  // Preparar instrucción del sistema según el formato
  const systemInstruction = isJsonPrompt
    ? "Eres un editor experto de prompts en formato JSON. Tu objetivo es aplicar los cambios solicitados por el usuario MANTENIENDO la estructura JSON original. Solo modifica los valores de los campos, no la estructura. Responde SOLO con el objeto JSON modificado, sin markdown ni explicaciones."
    : "Eres un editor de prompts experto. Tu objetivo es aplicar cambios solicitados por el usuario sin alterar el estilo, calidad, estetica, motor de render ni iluminacion del original. Detecta placeholders. Si faltan datos, pregunta. No inventes detalles criticos. Responde SOLO con un objeto JSON valido sin markdown ni explicaciones adicionales.";

  const promptText = isJsonPrompt
    ? `Original JSON Prompt:\n${originalPrompt}\n\nUser Instruction: "${userInstruction}"\n\nRespond with the modified JSON maintaining the same structure.`
    : `Original Prompt: "${originalPrompt}"\n\nUser Instruction: "${userInstruction}"`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: promptText,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      temperature: 0.7,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          editedPrompt: {
            type: Type.STRING,
            description: isJsonPrompt ? "El JSON del prompt final editado." : "El prompt final editado."
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
    
    // Si el prompt original era JSON, asegurar que la respuesta también sea JSON válido
    let editedPrompt = result.editedPrompt || originalPrompt;
    if (isJsonPrompt) {
      try {
        // Validar que sea JSON válido
        JSON.parse(editedPrompt);
      } catch (e) {
        // Si no es JSON válido, intentar parsearlo
        console.warn("Edited prompt is not valid JSON, attempting to fix...");
        editedPrompt = originalPrompt; // Fallback al original
      }
    }
    
    return {
      questions: result.questions || [],
      editedPrompt: editedPrompt,
      changesMade: result.changesMade || [],
      assumptions: result.assumptions || []
    };
  } catch (e) {
    console.error("Failed to parse AI response:", e);
    throw new Error("AI Service returned an invalid format.");
  }
};
