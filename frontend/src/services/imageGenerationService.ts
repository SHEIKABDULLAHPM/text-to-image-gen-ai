// src/services/imageGenerationService.ts
import axios from 'axios';
import { ImageSize, ImageFormat } from '../types';

// Use environment variable for both dev/prod
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
      const res = await axios.post(`${baseURL}/generate`, {
        prompt,
        size,
        format
      });

      if (res.data.image) {
        return {
          success: true,
          id: Date.now().toString(),
          imageUrl: `data:image/${format};base64,${res.data.image}`
        };
      }

      return { success: false, error: 'No image received' };
    } catch (err: unknown) {
      if (err instanceof Error) {
        return { success: false, error: err.message };
      } else {
        return { success: false, error: 'Unknown error occurred' };
      }
    }
  },

  getHistory: async () => {
    try {
      const res = await axios.get(`${baseURL}/history`);
      return { success: true, history: res.data };
    } catch (err: unknown) {
      if (err instanceof Error) {
        return { success: false, error: err.message };
      } else {
        return { success: false, error: 'Unknown error occurred' };
      }
    }
  }
};
