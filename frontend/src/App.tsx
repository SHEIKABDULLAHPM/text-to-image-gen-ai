import { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import PromptInput from './components/PromptInput';
import ImageDisplay from './components/ImageDisplay';
import ImageHistory from './components/ImageHistory';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorMessage from './components/ErrorMessage';
import { imageGenerationService } from './services/imageGenerationService';
import { GeneratedImage, ImageSize, ImageFormat, GenerationStatus } from './types';

function App() {
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [imageHistory, setImageHistory] = useState<GeneratedImage[]>([]);
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState<ImageSize>('512x512');
  const [format, setFormat] = useState<ImageFormat>('png');

  // Fetch history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const result = await imageGenerationService.getHistory();

        if (result.success) {
          type HistoryItem = {
            prompt: string;
            image?: string;
            timestamp?: number;
          };

          const history = result.history.map((item: HistoryItem, index: number): GeneratedImage => ({
            id: Date.now().toString() + index,
            prompt: item.prompt,
            imageUrl: item.image ? `data:image/png;base64,${item.image}` : '',
            timestamp: item.timestamp || Date.now(),
            size: '512x512',
            format: 'png',
          }));

          setImageHistory(history.reverse());
        } else {
          console.error('Failed to fetch history:', result.error);
        }
      } catch (err) {
        console.error('Unexpected error fetching history:', err);
      }
    };

    fetchHistory();
  }, []);

  const handleGenerateImage = useCallback(
    async (prompt: string) => {
      try {
        setStatus('generating');
        setError(null);

        const response = await imageGenerationService.generateImage({
          prompt,
          size,
          format,
        });

        if (response.success && response.imageUrl) {
          const newImage: GeneratedImage = {
            id: response.id,
            prompt,
            imageUrl: response.imageUrl,
            timestamp: Date.now(),
            size,
            format,
          };

          setCurrentImage(newImage);
          setImageHistory((prev) => [newImage, ...prev]);
          setStatus('success');
        } else {
          throw new Error(response.error || 'Failed to generate image');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        setStatus('error');
      }
    },
    [size, format]
  );

  const handleSelectImage = useCallback((image: GeneratedImage) => {
    setCurrentImage(image);
  }, []);

  const handleDeleteImage = useCallback(
    (id: string) => {
      setImageHistory((prev) => prev.filter((img) => img.id !== id));
      if (currentImage?.id === id) {
        setCurrentImage(null);
      }
    },
    [currentImage]
  );

  const handleDownloadImage = useCallback((image: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = image.imageUrl;
    link.download = `ai-generated-${image.id}.${image.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleDismissError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Header />

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {error && <ErrorMessage message={error} onDismiss={handleDismissError} />}

            {/* Format & Size Selectors */}
            <div className="flex gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium">Size</label>
                <select
                  className="p-2 border rounded"
                  value={size}
                  onChange={(e) => setSize(e.target.value as ImageSize)}
                >
                  <option value="512x512">512x512</option>
                  <option value="768x768">768x768</option>
                  <option value="1024x1024">1024x1024</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Format</label>
                <select
                  className="p-2 border rounded"
                  value={format}
                  onChange={(e) => setFormat(e.target.value as ImageFormat)}
                >
                  <option value="png">PNG</option>
                  <option value="jpeg">JPEG</option>
                  <option value="webp">WEBP</option>
                </select>
              </div>
            </div>

            <PromptInput
  onGenerate={handleGenerateImage}
  status={status}
  size={size}
  format={format}
  onSizeChange={setSize}
  onFormatChange={setFormat}
/>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
              <div className="lg:col-span-2">
                {status === 'generating' ? (
                  <div className="bg-white rounded-2xl shadow-xl">
                    <LoadingSpinner message="Creating your masterpiece..." />
                  </div>
                ) : (
                  <ImageDisplay image={currentImage} onDownload={handleDownloadImage} />
                )}
              </div>

              <div className="lg:col-span-1">
                <ImageHistory
                  images={imageHistory}
                  onSelectImage={handleSelectImage}
                  onDeleteImage={handleDeleteImage}
                  onDownloadImage={handleDownloadImage}
                  selectedImageId={currentImage?.id}
                />
              </div>
            </div>
          </div>
        </main>

        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="container mx-auto px-4 py-6">
            <p className="text-center text-gray-600">
              Built with React, TypeScript, and Tailwind CSS • AI Image Generation Demo
            </p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default App;
