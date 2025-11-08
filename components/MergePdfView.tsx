
import React, { useState, useCallback, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { BackArrowIcon, FilePdfIcon } from './Icons';

interface MergePdfViewProps {
  onGoHome: () => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const MergePdfView: React.FC<MergePdfViewProps> = ({ onGoHome }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(file => file.type === 'application/pdf');
      setFiles(prev => [...prev, ...newFiles]);
      setError(null);
    }
  };
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
       const newFiles = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
       if(newFiles.length > 0) {
         setFiles(prev => [...prev, ...newFiles]);
         setError(null);
       } else {
         setError("Only PDF files are accepted.");
       }
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

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };
  
  // Fix: Correct the event handler's parameter type from DragEvent<HTMLDivElement> to DragEvent<HTMLLIElement> to match the draggable `li` element.
  const handleDragSortStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
      dragItem.current = index;
  };
  
  const handleDragSortEnter = (e: React.DragEvent<HTMLLIElement>, index: number) => {
      dragOverItem.current = index;
  };
  
  const handleDragSortEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const newFiles = [...files];
      const draggedItemContent = newFiles.splice(dragItem.current, 1)[0];
      newFiles.splice(dragOverItem.current, 0, draggedItemContent);
      dragItem.current = null;
      dragOverItem.current = null;
      setFiles(newFiles);
    }
  };

  const mergePdfs = async () => {
    if (files.length < 2) {
      setError("Please select at least two PDF files to merge.");
      return;
    }
    setError(null);
    setIsMerging(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      const mergedPdfBytes = await mergedPdf.save();
      
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'merged.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error("Failed to merge PDFs:", err);
      setError("An error occurred while merging the PDFs. Please ensure all files are valid.");
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow-sm dark:border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button onClick={onGoHome} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
            <BackArrowIcon className="h-6 w-6" />
            <span className="font-medium">Back to Tools</span>
          </button>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Merge PDF Files</h1>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
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
                multiple
                className="hidden"
                accept="application/pdf"
                onChange={handleFileChange}
                disabled={isMerging}
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center text-center">
                <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <p className="text-gray-700 dark:text-gray-200"><span className="font-semibold text-red-600">Click to upload PDFs</span> or drag and drop</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Combine multiple PDFs into a single file</p>
            </label>
        </div>

        {files.length > 0 && (
          <div className="w-full max-w-4xl mx-auto mt-8">
            <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">Files to Merge ({files.length})</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Drag and drop files to change the merge order.</p>
            <ul className="space-y-3">
              {files.map((file, index) => (
                <li
                  key={index}
                  draggable
                  onDragStart={(e) => handleDragSortStart(e, index)}
                  onDragEnter={(e) => handleDragSortEnter(e, index)}
                  onDragEnd={handleDragSortEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FilePdfIcon className="h-8 w-8 text-red-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button onClick={() => removeFile(index)} className="text-gray-400 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition-colors p-1 rounded-full">
                     <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {error && (
            <p className="text-center text-red-600 mt-4 bg-red-100 dark:bg-red-900/30 dark:text-red-400 px-4 py-2 rounded-md max-w-4xl mx-auto">{error}</p>
        )}
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 sticky bottom-0">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-end">
          <button
            onClick={mergePdfs}
            disabled={files.length < 2 || isMerging}
            className="px-8 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-all duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isMerging ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Merging...
              </>
            ) : (
                'Merge PDFs'
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};
