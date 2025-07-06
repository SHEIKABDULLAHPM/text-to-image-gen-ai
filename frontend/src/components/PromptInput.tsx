import React, { useState } from 'react';
import { Send, Wand2, Settings as SettingsIcon } from 'lucide-react';
import { GenerationStatus, ImageFormat, ImageSize } from '../types';

interface PromptInputProps {
  onGenerate: (prompt: string) => void;
  status: GenerationStatus;
  size: ImageSize;
  format: ImageFormat;
  onSizeChange: (size: ImageSize) => void;
  onFormatChange: (format: ImageFormat) => void;
}

const PromptInput: React.FC<PromptInputProps> = ({
  onGenerate,
  status,
  size,
  format,
  onSizeChange,
  onFormatChange
}) => {
  const [prompt, setPrompt] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && status !== 'generating') {
      onGenerate(prompt.trim());
      setPrompt('');
    }
  };

  const isGenerating = status === 'generating';

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your image idea..."
            className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
            rows={3}
            maxLength={500}
            disabled={isGenerating}
          />
          <div className="absolute bottom-2 right-2 text-sm text-gray-400">
            {prompt.length}/500
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="text-sm text-purple-600 hover:underline flex items-center gap-1"
        >
          <SettingsIcon className="w-4 h-4" />
          {showSettings ? 'Hide Settings' : 'Show Settings'}
        </button>

        {showSettings && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Image Size</label>
              <select
                className="w-full p-2 border rounded"
                value={size}
                onChange={(e) => onSizeChange(e.target.value as ImageSize)}
              >
                <option value="512x512">512x512</option>
                <option value="768x768">768x768</option>
                <option value="1024x1024">1024x1024</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Image Format</label>
              <select
                className="w-full p-2 border rounded"
                value={format}
                onChange={(e) => onFormatChange(e.target.value as ImageFormat)}
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="webp">WEBP</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              !prompt.trim() || isGenerating
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
            }`}
          >
            {isGenerating ? (
              <>
                <Wand2 className="w-5 h-5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Generate Image</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PromptInput;
