export interface GeneratedImage {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: number;
  size: ImageSize;
  format: ImageFormat;
}

export interface ImageGenerationRequest {
  prompt: string;
  size: ImageSize;
  format: ImageFormat;
  style?: string;
}

export interface ImageGenerationResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  id: string;
}

export type ImageSize = '512x512' | '768x768' | '1024x1024';
export type ImageFormat = 'png' | 'jpeg' | 'webp';

export type GenerationStatus = 'idle' | 'generating' | 'success' | 'error';

export interface ApiError {
  message: string;
  code?: string;
  details?: string;
}