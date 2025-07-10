// src/services/imageGenerationService.ts

import axios from 'axios';
import { ImageSize, ImageFormat } from '../types';

// Read the backend URL from environment variable
const baseURL = import.meta.env.VITE_API_BASE_URL;

export const imageGenerationService = {
  generateImage: async ({
    prompt,
    size,
    format
  }: {
    prompt: string;
    size: ImageSize;
    format: ImageFormat;
  }) => {
    try {
      const response = await axios.post(
        `${baseURL}/generate`,
        { prompt, size, format },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data.image) {
        return {
          success: true,
          id: Date.now().toString(),
          imageUrl: `data:image/${format};base64,${response.data.image}`
        };
      }

      return { success: false, error: 'No image received' };
    } catch (err: unknown) {
      if (err instanceof Error) {
        return { success: false, error: err.message };
      }
      return { success: false, error: 'Unknown error occurred' };
    }
  },

  getHistory: async () => {
    try {
      const response = await axios.get(`${baseURL}/history`);
      return { success: true, history: response.data };
    } catch (err: unknown) {
      if (err instanceof Error) {
        return { success: false, error: err.message };
      }
      return { success: false, error: 'Unknown error occurred' };
    }
  }
};
