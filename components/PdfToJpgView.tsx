import React, { useState } from 'react';
import { FileUpload } from './FileUpload';
import { ResultsView } from './ResultsView';
import { type ConvertedImage } from '../types';
import { BackArrowIcon } from './Icons';

declare const pdfjsLib: any;
declare const JSZip: any;

interface PdfToJpgViewProps {
  onGoHome: () => void;
}

const DownloadIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Zm-9 13.5a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
  </svg>
);

export const PdfToJpgView: React.FC<PdfToJpgViewProps> = ({ onGoHome }) => {
  const [file, setFile] = useState<File | null>(null);
  const [convertedImages, setConvertedImages] = useState<ConvertedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (uploadedFile: File) => {
    if (!uploadedFile || uploadedFile.type !== 'application/pdf') {
      setError("Please select a valid PDF file.");
      return;
    }
    setError(null);
    setIsProcessing(true);
    setFile(uploadedFile);

    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js`;
      
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const pageCount = pdf.numPages;

      const allImages: ConvertedImage[] = [];
      for (let i = 1; i <= pageCount; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Could not get canvas context');

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        await page.render(renderContext).promise;
        allImages.push({
          pageNumber: i,
          dataUrl: canvas.toDataURL('image/jpeg', 0.92),
        });
        canvas.remove();
      }
      setConvertedImages(allImages);
    } catch (err) {
      console.error("Failed to convert PDF:", err);
      setError("Could not convert the PDF. The file may be corrupt or invalid.");
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = () => {
    if (convertedImages.length === 0 || !file) return;

    const zip = new JSZip();
    convertedImages.forEach(image => {
      const base64Data = image.dataUrl.split(',')[1];
      zip.file(`${file.name.replace('.pdf', '')}-page-${image.pageNumber}.jpg`, base64Data, { base64: true });
    });

    zip.generateAsync({ type: 'blob' }).then(blob => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${file.name.replace('.pdf', '')}-images.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    });
  };

  const handleReset = () => {
    setFile(null);
    setConvertedImages([]);
    setIsProcessing(false);
    setError(null);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow-sm dark:border-b dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <button onClick={onGoHome} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                <BackArrowIcon className="h-6 w-6" />
                <span className="font-medium">Back to Tools</span>
            </button>
            <div className="flex items-center gap-3 min-w-0">
                <h1 className="text-xl font-semibold text-gray-800 dark:text-white truncate">PDF to JPG Converter</h1>
                {file && convertedImages.length > 0 && <span className="text-sm text-gray-500 dark:text-gray-400 truncate hidden sm:inline">{file.name}</span>}
            </div>
            {file && convertedImages.length > 0 && (
                <div className="flex items-center gap-2">
                    <button onClick={handleReset} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                        Convert Another
                    </button>
                    <button onClick={handleDownloadAll} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2">
                        <DownloadIcon className="w-5 h-5" />
                        Download All
                    </button>
                </div>
            )}
        </div>
      </header>
        
      <div className="flex-grow flex flex-col">
        {convertedImages.length > 0 && file ? (
            <ResultsView convertedImages={convertedImages} />
        ) : (
            <div className="flex-grow flex items-center justify-center p-4">
                <FileUpload
                    onFileUpload={handleFileUpload}
                    isProcessing={isProcessing}
                    error={error}
                />
            </div>
        )}
      </div>
    </div>
  );
};
