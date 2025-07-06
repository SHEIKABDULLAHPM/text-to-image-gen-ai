import React from 'react';
import { History, Trash2, Download } from 'lucide-react';
import { GeneratedImage } from '../types';

interface ImageHistoryProps {
  images: GeneratedImage[];
  onSelectImage: (image: GeneratedImage) => void;
  onDeleteImage: (id: string) => void;
  onDownloadImage: (image: GeneratedImage) => void;
  selectedImageId?: string;
}

const ImageHistory: React.FC<ImageHistoryProps> = ({
  images,
  onSelectImage,
  onDeleteImage,
  onDownloadImage,
  selectedImageId
}) => {
  if (images.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center space-x-2 mb-4">
          <History className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Generation History</h3>
        </div>
        <p className="text-gray-500 text-center py-8">
          No images generated yet. Create your first image to see it here!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="flex items-center space-x-2 mb-6">
        <History className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-800">Generation History</h3>
        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
          {images.length}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
              selectedImageId === image.id
                ? 'border-purple-500 ring-2 ring-purple-200'
                : 'border-gray-200 hover:border-purple-300'
            }`}
            onClick={() => onSelectImage(image)}
          >
            <div className="aspect-square">
              <img
                src={image.imageUrl}
                alt={image.prompt}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownloadImage(image);
                  }}
                  className="p-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-all"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteImage(image.id);
                  }}
                  className="p-2 bg-red-500 bg-opacity-80 text-white rounded-lg hover:bg-opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
              <p className="text-white text-sm truncate">{image.prompt}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-300">{image.size}</span>
                <span className="text-xs text-gray-300">•</span>
                <span className="text-xs text-gray-300">
                  {new Date(image.timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageHistory;