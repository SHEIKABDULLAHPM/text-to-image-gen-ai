// src/services/imageGenerationService.ts
import axios from 'axios';
import { ImageSize, ImageFormat } from '../types';

const API_BASE = 'http://localhost:5000';

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
      const res = await axios.post(`${API_BASE}/generate`, {
        prompt,
        size,
        format
      });

      if (res.data.image) {
        return {
          success: true,
          id: Date.now().toString(), // Temporary ID
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
      const res = await axios.get(`${API_BASE}/history`);
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
