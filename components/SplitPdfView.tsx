
import React, { useState, useCallback, useMemo } from 'react';
import { PDFDocument } from 'pdf-lib';
import { BackArrowIcon, CheckCircleIcon, FilePdfIcon } from './Icons';

// Make JSZip available from the global scope where it's loaded via CDN
declare const JSZip: any;

interface SplitPdfViewProps {
  onGoHome: () => void;
}

type SplitMode = 'all' | 'select';

const LoadingSpinner: React.FC = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 dark:border-gray-400"></div>
);


export const SplitPdfView: React.FC<SplitPdfViewProps> = ({ onGoHome }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [splitMode, setSplitMode] = useState<SplitMode>('all');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
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
        setPdfDoc(doc);
        const count = doc.getPageCount();
        setPageCount(count);
        // By default, select all pages
        setSelectedPages(new Set(Array.from({ length: count }, (_, i) => i + 1)));
        setSplitMode('all');
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
    setPdfDoc(null);
    setPageCount(0);
    setSelectedPages(new Set());
    setIsProcessing(false);
    setIsSplitting(false);
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
  
  const handleSplitModeChange = (mode: SplitMode) => {
    setSplitMode(mode);
    if (mode === 'all') {
      setSelectedPages(new Set(Array.from({ length: pageCount }, (_, i) => i + 1)));
    } else {
      setSelectedPages(new Set());
    }
  }
  
  const togglePageSelection = (pageNumber: number) => {
    if (splitMode !== 'select') return;
    const newSelection = new Set(selectedPages);
    if (newSelection.has(pageNumber)) {
      newSelection.delete(pageNumber);
    } else {
      newSelection.add(pageNumber);
    }
    setSelectedPages(newSelection);
  };
  
  const handleSplitPdf = async () => {
    if (!pdfDoc || selectedPages.size === 0) {
      setError("Please select at least one page to extract.");
      return;
    }
    setError(null);
    setIsSplitting(true);
    
    try {
        const zip = new JSZip();
        const sortedPages = Array.from(selectedPages).sort((a,b) => a - b);

        for (const pageNum of sortedPages) {
            const newDoc = await PDFDocument.create();
            const [copiedPage] = await newDoc.copyPages(pdfDoc, [pageNum - 1]);
            newDoc.addPage(copiedPage);
            const pdfBytes = await newDoc.save();
            zip.file(`${file?.name.replace('.pdf', '')}-page-${pageNum}.pdf`, pdfBytes);
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(zipBlob);
        link.download = `${file?.name.replace('.pdf', '')}-split.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

    } catch (err) {
        console.error("Failed to split PDF:", err);
        setError("An error occurred while splitting the PDF.");
    } finally {
        setIsSplitting(false);
    }
  };

  const pagesToRender = useMemo(() => Array.from({ length: pageCount }, (_, i) => i + 1), [pageCount]);

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
            className={`flex flex-col items-center justify-center w-full max-w-4xl mx-auto p-8 border-2 border-dashed rounded-lg transition-colors duration-300 ${isDraggingOver ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'}`}
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
                <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <p className="text-gray-700 dark:text-gray-200"><span className="font-semibold text-red-600">Click to upload a PDF</span> or drag and drop</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Split one PDF into multiple files</p>
            </label>
        </div>
      );
    }

    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <FilePdfIcon className="h-8 w-8 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{pageCount} pages</p>
                  </div>
                </div>
                <button onClick={resetState} className="text-sm font-medium text-red-600 hover:text-red-800">
                    Choose another file
                </button>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Split Mode</h3>
                <div className="flex items-center gap-6 text-gray-800 dark:text-gray-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="split-mode" checked={splitMode === 'all'} onChange={() => handleSplitModeChange('all')} className="form-radio h-4 w-4 text-red-600 focus:ring-red-500 bg-gray-600 border-gray-500"/>
                        <span className="text-sm font-medium">Extract all pages</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="split-mode" checked={splitMode === 'select'} onChange={() => handleSplitModeChange('select')} className="form-radio h-4 w-4 text-red-600 focus:ring-red-500 bg-gray-600 border-gray-500"/>
                        <span className="text-sm font-medium">Select pages to extract</span>
                    </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {splitMode === 'all' 
                        ? 'Every page will be saved as a separate PDF file.'
                        : 'Click on the pages you want to extract.'
                    }
                </p>
            </div>
            
            <div className="mt-6 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
                {pagesToRender.map(pageNum => (
                    <button 
                        key={pageNum}
                        onClick={() => togglePageSelection(pageNum)}
                        disabled={splitMode !== 'select'}
                        className={`relative aspect-square flex flex-col items-center justify-center border-2 rounded-lg transition-all duration-200 ${
                            selectedPages.has(pageNum)
                                ? 'border-red-500 bg-red-50 dark:bg-red-900/40'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-red-400 dark:hover:border-red-500'
                        } ${splitMode !== 'select' ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                    >
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                            {pageNum}
                        </span>
                        {selectedPages.has(pageNum) && (
                            <CheckCircleIcon className="absolute top-1 right-1 h-5 w-5 text-red-600" />
                        )}
                    </button>
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
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Split PDF File</h1>
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
                onClick={handleSplitPdf}
                disabled={selectedPages.size === 0 || isSplitting}
                className="px-8 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-all duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {isSplitting ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Splitting...
                </>
                ) : (
                    `Split PDF (${selectedPages.size} pages)`
                )}
            </button>
            </div>
        </footer>
      )}
    </div>
  );
};
