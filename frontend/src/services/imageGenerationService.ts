// src/services/imageGenerationService.ts

import axios from 'axios';
import { ImageGenerationRequest } from '../types';

// Read backend URL from environment variable and default to nginx-routed path.
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

export const imageGenerationService = {
  generateImage: async (payload: ImageGenerationRequest) => {
    try {
      const response = await axios.post(
        `${baseURL}/generate`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data.image) {
        return {
          success: true,
          id: Date.now().toString(),
          imageUrl: `data:image/${payload.format};base64,${response.data.image}`,
          enhancedPrompt: response.data.enhancedPrompt,
          seed: response.data.seed,
          model: response.data.model,
        };
      }

      return { success: false, error: 'No image received' };
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const backendError = err.response?.data?.error;
        const backendDetails = err.response?.data?.details;
        return {
          success: false,
          error: backendError || backendDetails || err.message,
        };
      }
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
