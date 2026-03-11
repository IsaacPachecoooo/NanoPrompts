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

/**
 * Detecta si la instrucción del usuario menciona usar una foto/imagen de referencia
 */
const detectsFaceReference = (instruction: string): boolean => {
  const lower = instruction.toLowerCase();
  const keywords = [
    'mi foto', 'my photo', 'my face', 'mi cara', 'mi rostro',
    'reference image', 'imagen de referencia', 'foto de referencia',
    'face reference', 'referencia de cara', 'referencia facial',
    'use my', 'usa mi', 'con mi foto', 'with my photo',
    'my reference', 'mi referencia', 'uploaded image', 'uploaded photo',
    'imagen subida', 'foto subida', 'face identity', 'identidad facial',
    'preserve my face', 'mantener mi cara', 'keep my face',
    'use reference', 'usa referencia', 'usar referencia'
  ];
  return keywords.some(kw => lower.includes(kw));
};

/**
 * Inyecta el bloque de referencia facial en un JSON de prompt
 */
const injectFaceReference = (jsonObj: any): any => {
  const referenceBlock = {
    face_identity: "uploaded reference image",
    identity_lock: true,
    face_preservation: "100% identical facial structure, proportions, eyes, nose, lips, brows, skin texture, moles, and expression"
  };

  // Si ya existe image_prompt en el objeto
  if (jsonObj.image_prompt) {
    jsonObj.image_prompt.reference = referenceBlock;
  } else {
    // Buscar el primer objeto anidado que parezca ser el prompt principal
    const topLevelKeys = Object.keys(jsonObj);
    if (topLevelKeys.length > 0) {
      // Intentar agregar reference al nivel raiz
      jsonObj.reference = referenceBlock;
    }
  }
  return jsonObj;
};

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

  // Detectar si el usuario quiere usar foto de referencia
  const usesFaceReference = detectsFaceReference(userInstruction);

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
        let parsedEdited = JSON.parse(editedPrompt);

        // Si el usuario mencionó foto de referencia, inyectar el bloque
        if (usesFaceReference) {
          parsedEdited = injectFaceReference(parsedEdited);
          editedPrompt = JSON.stringify(parsedEdited, null, 2);
        }
      } catch (e) {
        // Si no es JSON válido, intentar parsearlo
        console.warn("Edited prompt is not valid JSON, attempting to fix...");
        editedPrompt = originalPrompt; // Fallback al original
      }
    }
    
    const changesMadeList = result.changesMade || [];
    if (usesFaceReference && isJsonPrompt) {
      changesMadeList.push("Bloque 'reference' de identidad facial añadido al JSON");
    }

    return {
      questions: result.questions || [],
      editedPrompt: editedPrompt,
      changesMade: changesMadeList,
      assumptions: result.assumptions || []
    };
  } catch (e) {
    console.error("Failed to parse AI response:", e);
    throw new Error("AI Service returned an invalid format.");
  }
};
