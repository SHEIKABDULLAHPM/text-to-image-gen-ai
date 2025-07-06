import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Generating your image...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <Loader2 className="w-16 h-16 text-purple-600 animate-spin" />
        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-purple-200 border-t-purple-600 animate-pulse"></div>
      </div>
      <p className="mt-4 text-gray-600 text-lg">{message}</p>
      <div className="mt-4 flex space-x-2">
        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;