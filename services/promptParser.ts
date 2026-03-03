
import { PromptItem } from '../types';
import { README_URL, BLACKLIST_KEYWORDS, RAW_IMAGE_PREFIX } from '../constants';

/**
 * Transforma y limpia prompts.
 * Evita el Error #31 de React asegurando que promptText sea siempre un string simple o JSON stringificado.
 * Filtra prompts de baja calidad o que no son realmente prompts.
 */
const transformAndCleanup = (item: PromptItem): PromptItem | null => {
  let { title, content } = item;
  const cleanTitle = title.toUpperCase();

  // 1. Caso Específico: Google Stock Price
  if (cleanTitle.includes("GOOGLE") && (cleanTitle.includes("STOCK") || cleanTitle.includes("PRICE"))) {
    return {
      ...item,
      title: "GOOGLE (GOOG) TECH CITY 3D RENDER",
      content: "A vibrant, isometric 3D render depicts a charming miniature city centered around a Google building, surrounded by iconic Google product symbols like YouTube, Android, Maps, Gmail, Drive, and a self-driving car. Tiny diverse characters interact within this playful tech landscape, while an overlay shows Google's stock price range and an upward trend"
    };
  }

  // 1.1 Caso Específico: Leaf Dragon (Limpiar comentarios)
  if (cleanTitle.includes("LEAF DRAGON")) {
    const descriptiveMatch = content.match(/(?:prompt|is)[:\s]+["']?([^"']{50,})["']?/i);
    if (descriptiveMatch) {
      content = descriptiveMatch[1].trim();
    } else {
      content = content.replace(/#\w+/g, '').replace(/@\w+/g, '').trim();
    }
  }

  // 1.2 Caso Específico: Pepsi Miniature Crew
  if (cleanTitle.includes("PEPSI") && cleanTitle.includes("MINIATURE")) {
    return {
      ...item,
      title: "MINIATURE CONSTRUCTION CREW ON GIANT PEPSI CAN",
      content: "A hyper-realistic, macro photography shot of a miniature construction crew working on top of a giant, condensation-covered Pepsi can. The scene is set on a retro diner counter with a blurred background of neon lights and chrome. Tiny workers in orange vests and hard hats use miniature cranes and tools to 'repair' the pull-tab of the can. Dramatic cinematic lighting, 8k resolution, highly detailed textures."
    };
  }

  // 1.3 Eliminar "Meta-Talk" conversacional (comentarios confusos)
  const metaTalkPatterns = [
    /^i (?:used|built|created|made|figured out|experimented with|found|designed).+?[:.]\s*/i,
    /^here is (?:the|a) prompt.+?[:.]\s*/i,
    /^this prompt (?:is|will|was).+?[:.]\s*/i,
    /^you can use (?:this|the).+?[:.]\s*/i,
    /^start with.+?then prompt.+?[:.]\s*/i,
    /^shorthand prompt.+?[:.]\s*/i,
    /^a shorthand prompt.+?[:.]\s*/i,
    /^did some experimenting.+?[:.]\s*/i,
    /^droste effect without.+?[:.]\s*/i
  ];

  for (const pattern of metaTalkPatterns) {
    if (pattern.test(content)) {
      content = content.replace(pattern, '').trim();
    }
  }

  // 2. Limpieza de hashtags y metadatos basura
  content = content.replace(/#\w+/g, '').trim();
  content = content.replace(/@\w+/g, '').trim();
  content = content.replace(/^["']|["']$/g, '').trim(); // Quitar comillas externas

  // 3. Manejo de Estructuras JSON Complejas (Fix Error #31)
  try {
    const parsed = JSON.parse(content);

    // Si es un array directo de prompts
    if (Array.isArray(parsed)) {
      const first = parsed[0];
      content = typeof first === 'string' ? first : JSON.stringify(first, null, 2);
    } 
    else if (typeof parsed === 'object' && parsed !== null) {
      // Intentar encontrar campos comunes que contengan el prompt real
      const promptFields = ['visual_description', 'prompt', 'description', 'text', 'content'];
      let foundPrompt = false;
      
      for (const field of promptFields) {
        if (parsed[field] && typeof parsed[field] === 'string') {
          content = parsed[field];
          foundPrompt = true;
          break;
        }
      }

      if (!foundPrompt) {
        // Caso: Batch de múltiples requerimientos
        if (parsed.batch_generation_requests && Array.isArray(parsed.batch_generation_requests)) {
          const requests = parsed.batch_generation_requests;
          // Priorizar Pizza Hut o similares para marcas
          let selected = requests.find((r: any) => 
            JSON.stringify(r).toLowerCase().includes('pizza') || 
            JSON.stringify(r).toLowerCase().includes('hut')
          );
          if (!selected) selected = requests[0];
          
          // Si el seleccionado tiene visual_description o prompt, usarlo
          if (selected.visual_description) {
            content = String(selected.visual_description);
          } else if (selected.prompt) {
            content = String(selected.prompt);
          } else {
            content = JSON.stringify(selected, null, 2);
          }
        }
        // Caso: Objeto con propiedad 'prompts' o 'variants' que sea array
        else if (parsed.prompts && Array.isArray(parsed.prompts)) {
          content = typeof parsed.prompts[0] === 'string' ? parsed.prompts[0] : JSON.stringify(parsed.prompts[0], null, 2);
        }
        else if (parsed.variants && Array.isArray(parsed.variants)) {
          content = typeof parsed.variants[0] === 'string' ? parsed.variants[0] : JSON.stringify(parsed.variants[0], null, 2);
        }
        else {
          content = JSON.stringify(parsed, null, 2);
        }
      }
    }
  } catch (e) {
    // Si no es JSON, procedemos a limpiar texto plano de variantes
    // 1. Detectar si es una lista numerada (1., 2., 3.) o con letras (A., B., C.)
    // Si el texto contiene múltiples marcadores de lista, cortamos en el segundo
    const listMarkers = [
      /\n\s*2\s*[:.-]\s/i,
      /\n\s*Variant\s*2\s*[:.-]/i,
      /\n\s*Option\s*B\s*[:.-]/i,
      /\n\s*Prompt\s*2\s*[:.-]/i,
      /\n\s*\[2\]\s/i
    ];

    for (const marker of listMarkers) {
      if (marker.test(content)) {
        const parts = content.split(marker);
        content = parts[0].trim();
        break;
      }
    }

    // Limpiar prefijos del primer elemento si quedaron (ej: "1. ", "Variant 1: ")
    content = content.replace(/^(?:\d|[A-Z])\s*[:.-]\s*/i, '');
    content = content.replace(/^(?:Variant|Option|Prompt|Batch|Version)\s*(?:\d|[A-Z])\s*[:.-]\s*/i, '');
  }

  // 4. Validación de Calidad y "No es prompt"
  const lowerText = content.toLowerCase();
  const lowerTitle = title.toLowerCase();

  // Si es muy corto, probablemente no sea un prompt descriptivo
  if (content.length < 20) return null;

  // Si parece una lista de instrucciones técnicas sin descripción visual
  if (lowerText.includes("step 1") || lowerText.includes("step 2") || lowerText.includes("step 3") || lowerText.includes("how to") || lowerText.includes("click on")) return null;
  
  // Si contiene demasiados metadatos o parece un log/error/post de red social
  if (lowerText.includes("error:") || lowerText.includes("uncaught") || lowerText.includes("stack trace")) return null;
  if (lowerText.includes("follow, like, repost") || lowerText.includes("comment “prompt”") || lowerText.includes("want the prompt?")) return null;
  if (lowerText.includes("experimenting and figured out") || lowerText.includes("workflow for ai") || lowerText.includes("i built a prompt")) return null;
  if (lowerText.includes("claude.ai") || lowerText.includes("share/") || lowerText.includes("higgsfield")) return null;

  // Si el título indica que es un tutorial o guía
  if (lowerTitle.includes("tutorial") || lowerTitle.includes("guide") || lowerTitle.includes("readme") || lowerTitle.includes("inspiration")) return null;

  return { ...item, content };
};

export const parsePromptsFromMarkdown = async (): Promise<PromptItem[]> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout
    
    const response = await fetch(README_URL, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) throw new Error("Failed to fetch README");
    const text = await response.text();
    
    // Dividir por secciones ###
    const sections = text.split(/(?=### \d)/);
    const purifiedItems: PromptItem[] = [];

    sections.forEach((section, index) => {
      const titleMatch = section.match(/### (?:[0-9.]+\s+)?(.*)/);
      const imageMatch = section.match(/!\[.*\]\((.*?)\)/);
      
      if (titleMatch) {
        const title = titleMatch[1].trim();
        let imageUrl = "";
        
        if (imageMatch) {
          imageUrl = imageMatch[1].trim();
          if (!imageUrl.startsWith('http')) {
            const cleanPath = imageUrl.replace(/^\/+/, '');
            imageUrl = `${RAW_IMAGE_PREFIX}${cleanPath}`;
          }
        } else {
          // Fallback: Imagen temática basada en el título si no hay imagen en el README
          imageUrl = `https://picsum.photos/seed/${encodeURIComponent(title)}/800/600`;
        }

        let content = "";
        // Capturar bloque de código prioritario
        const promptBlockMatch = section.match(/\*\*Prompt:\*\*\s*(?:\n\s*)?```(?:\w+)?\n([\s\S]*?)```/);
        
        if (promptBlockMatch) {
          content = promptBlockMatch[1].trim();
        } else {
          const genericCodeBlock = section.match(/```(?:\w+)?\n([\s\S]*?)```/);
          if (genericCodeBlock) {
            content = genericCodeBlock[1].trim();
          }
        }

        const isBlacklisted = BLACKLIST_KEYWORDS.some(keyword => 
          title.toLowerCase().includes(keyword.toLowerCase())
        );

        if (!isBlacklisted && content.length > 5) {
          const newItem: PromptItem = {
            id: `prompt-${index}`,
            title: title.toUpperCase(),
            imageUrl,
            content,
            isCustom: false,
            category: title.split(':')[0] || 'GENERAL'
          };
          
          const cleaned = transformAndCleanup(newItem);
          if (cleaned) {
            purifiedItems.push(cleaned);
          }
        }
      }
    });

    return purifiedItems;
  } catch (error) {
    console.error("Error parsing prompts:", error);
    return [];
  }
};
