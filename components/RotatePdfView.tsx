
import React, { useState, useCallback } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { BackArrowIcon, RotateIcon, FilePdfIcon } from './Icons';

interface RotatePdfViewProps {
  onGoHome: () => void;
}

const LoadingSpinner: React.FC = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 dark:border-gray-400"></div>
);

export const RotatePdfView: React.FC<RotatePdfViewProps> = ({ onGoHome }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [rotations, setRotations] = useState<number[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFileChange = async (selectedFile: File | null) => {
    if (!selectedFile || selectedFile.type !== 'application/pdf') {
        setError("Please select a valid PDF file.");
        return;
    }
    setError(null);
    setIsProcessing(true);
    setFile(selectedFile);

    try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const doc = await PDFDocument.load(arrayBuffer);
        const count = doc.getPageCount();
        setPageCount(count);
        setRotations(Array(count).fill(0));
    } catch (err) {
        console.error("Failed to load PDF:", err);
        setError("Could not load the PDF. The file may be corrupt or invalid.");
        resetState();
    } finally {
        setIsProcessing(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setPageCount(0);
    setRotations([]);
    setIsProcessing(false);
    setIsSaving(false);
    setError(null);
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
       handleFileChange(e.dataTransfer.files[0]);
    }
  }, []);
  
  const handleDragEvents = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDraggingOver(true);
    } else if (e.type === 'dragleave') {
      setIsDraggingOver(false);
    }
  }, []);
  
  const handleRotate = (index: number, angle: 90 | -90) => {
      setRotations(prev => {
          const newRotations = [...prev];
          newRotations[index] = (newRotations[index] + angle + 360) % 360;
          return newRotations;
      });
  };

  const handleRotateAll = (angle: 90 | -90) => {
      setRotations(prev => prev.map(rot => (rot + angle + 360) % 360));
  }
  
  const handleSave = async () => {
    if (!file) return;
    setIsSaving(true);
    setError(null);
    
    try {
        const existingPdfBytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        
        pdfDoc.getPages().forEach((page, index) => {
            const currentRotation = page.getRotation().angle;
            const additionalRotation = rotations[index];
            if (additionalRotation !== 0) {
              page.setRotation(degrees(currentRotation + additionalRotation));
            }
        });

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${file.name.replace('.pdf', '')}-rotated.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

    } catch (err) {
        console.error("Failed to rotate and save PDF:", err);
        setError("An error occurred while saving the PDF.");
    } finally {
        setIsSaving(false);
    }
  };

  const renderContent = () => {
    if (isProcessing) {
      return (
        <div className="text-center p-8">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600 dark:text-gray-300">Processing your PDF...</p>
        </div>
      );
    }
    if (!file) {
      return (
         <div 
            className={`flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-8 border-2 border-dashed rounded-lg transition-colors duration-300 ${isDraggingOver ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'}`}
            onDrop={handleDrop}
            onDragEnter={handleDragEvents}
            onDragLeave={handleDragEvents}
            onDragOver={handleDragEvents}
        >
            <input
                type="file"
                id="file-upload"
                className="hidden"
                accept="application/pdf"
                onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center text-center">
                 <RotateIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-gray-700 dark:text-gray-200"><span className="font-semibold text-red-600">Click to upload a PDF</span> or drag and drop</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Rotate pages to the correct orientation</p>
            </label>
        </div>
      );
    }

    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <FilePdfIcon className="h-8 w-8 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{pageCount} pages</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-gray-700 dark:text-gray-300">
                        <button onClick={() => handleRotateAll(-90)} className="px-3 py-1 text-sm border dark:border-gray-600 rounded-l-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Rotate All Left</button>
                        <button onClick={() => handleRotateAll(90)} className="px-3 py-1 text-sm border-t border-b border-r dark:border-gray-600 rounded-r-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Rotate All Right</button>
                    </div>
                    <button onClick={resetState} className="text-sm font-medium text-red-600 hover:text-red-800">
                        Choose another file
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: pageCount }, (_, i) => i).map(index => (
                    <div 
                        key={index}
                        className="relative aspect-[3/4] flex flex-col items-center justify-center border-2 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm p-2"
                    >
                        <span className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-2">
                            Page {index + 1}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                           Rotation: {rotations[index]}&deg;
                        </span>
                        <div className="flex text-gray-600 dark:text-gray-300">
                           <button onClick={() => handleRotate(index, -90)} title="Rotate Left" className="p-2 rounded-l-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
                           </button>
                           <button onClick={() => handleRotate(index, 90)} title="Rotate Right" className="p-2 rounded-r-md border-t border-b border-r dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                               <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" /></svg>
                           </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow-sm dark:border-b dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button onClick={onGoHome} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
            <BackArrowIcon className="h-6 w-6" />
            <span className="font-medium">Back to Tools</span>
          </button>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Rotate PDF File</h1>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 flex items-center">
        {renderContent()}
      </main>
      
      {error && (
            <div className="fixed bottom-20 right-8 bg-red-100 border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-600 dark:text-red-300 px-4 py-3 rounded-lg shadow-lg z-20" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
      )}

      {file && (
        <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 sticky bottom-0 z-10">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-end">
            <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-all duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {isSaving ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Applying Rotation...
                </>
                ) : (
                    'Apply Changes & Download'
                )}
            </button>
            </div>
        </footer>
      )}
    </div>
  );
};
