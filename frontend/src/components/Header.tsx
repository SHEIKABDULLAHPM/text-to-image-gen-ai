import React from 'react';
import { Sparkles } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center space-x-3">
          <Sparkles className="w-8 h-8 text-yellow-300" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
            AI Image Generator
          </h1>
        </div>
        <p className="text-center mt-2 text-purple-100">
          Transform your ideas into stunning visuals with artificial intelligence
        </p>
      </div>
    </header>
  );
};

export default Header;