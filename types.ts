export interface ColoringPage {
  id: string;
  prompt: string;
  imageUrl: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
}

export interface GenerationState {
  theme: string;
  pages: ColoringPage[];
  isGenerating: boolean;
  currentStep: number; // 0 = input, 1 = generating, 2 = result
  error: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}