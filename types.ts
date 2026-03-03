
export interface PromptItem {
  id: string;
  title: string;
  content: string; // The main prompt text
  enhancedContent?: string; // AI optimized version
  imageUrl: string;
  isCustom: boolean;
  category?: string;
  tags?: string[];
  engine?: string; // e.g., "Midjourney", "DALL-E", "Stable Diffusion"
  createdAt?: number;
  updatedAt?: number;
}

export interface AIEditResponse {
  questions: string[];
  editedPrompt: string;
  changesMade: string[];
  assumptions: string[];
}

export enum TabType {
  LIBRARY = 'LIBRARY',
  FAVORITES = 'FAVORITES',
  EDITOR = 'EDITOR'
}
