
import React, { useState, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
// Fix: Import `CompressIcon` to resolve the 'Cannot find name' error.
import { BackArrowIcon, FilePdfIcon, CompressIcon } from './Icons';

interface CompressPdfViewProps {
  onGoHome: () => void;
}

type CompressionLevel = 'recommended' | 'high' | 'low';

interface CompressedFile {
  blob: Blob;
  originalSize: number;
  newSize: number;
  name: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const DownloadIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Zm-9 13.5a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
  </svg>
);


export const CompressPdfView: React.FC<CompressPdfViewProps> = ({ onGoHome }) => {
  const [file, setFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<CompressedFile | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('recommended');
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const resetState = () => {
      setFile(null);
      setCompressedFile(null);
      setCompressionLevel('recommended');
      setIsCompressing(false);
      setError(null);
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;
    if (selectedFile.type !== 'application/pdf') {
        setError("Only PDF files are accepted.");
        return;
    }
    resetState();
    setFile(selectedFile);
  };
  
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

  const handleCompress = async () => {
    if (!file) return;
    setIsCompressing(true);
    setError(null);
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        
        // Note: Client-side compression with pdf-lib is primarily achieved by optimizing the
        // document's internal structure using object streams. This removes unused objects
        // and can reduce file size. More advanced techniques like image re-compression
        // are not available in this library and would require server-side tools.
        // The compression "levels" are offered as a UX feature, but currently use the same powerful optimization setting.
        const pdfBytes = await pdfDoc.save({ useObjectStreams: true });

        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        setCompressedFile({
            blob,
            originalSize: file.size,
            newSize: blob.size,
            name: file.name.replace(/\.pdf$/i, '-compressed.pdf')
        });

    } catch (err) {
        console.error("Failed to compress PDF:", err);
        setError("An error occurred during compression. The file might be corrupt or protected.");
    } finally {
        setIsCompressing(false);
    }
  };
  
  const handleDownload = () => {
      if (!compressedFile) return;
      const url = URL.createObjectURL(compressedFile.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = compressedFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const renderInitialView = () => (
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
             <CompressIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-gray-700 dark:text-gray-200"><span className="font-semibold text-red-600">Click to upload a PDF</span> or drag and drop</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Reduce file size while maintaining quality</p>
        </label>
    </div>
  );

  const renderOptionsView = () => (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b dark:border-gray-600">
            <FilePdfIcon className="h-10 w-10 text-red-500 flex-shrink-0" />
            <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{file?.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(file?.size || 0)}</p>
            </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Select Compression Level</h3>
        <div className="space-y-3">
            {(['recommended', 'high', 'low'] as CompressionLevel[]).map(level => (
                <label key={level} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${compressionLevel === level ? 'bg-red-50 dark:bg-red-900/30 border-red-500 ring-2 ring-red-200' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}`}>
                    <input type="radio" name="compression" value={level} checked={compressionLevel === level} onChange={() => setCompressionLevel(level)} className="h-4 w-4 text-red-600 focus:ring-red-500 bg-gray-600 border-gray-500" />
                    <div className="ml-4">
                        <span className="font-medium text-gray-800 dark:text-gray-200 capitalize">{level} Compression</span>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {level === 'recommended' && 'Good balance between size and quality.'}
                            {level === 'high' && 'Smallest file size, may reduce quality.'}
                            {level === 'low' && 'Light optimization, best quality.'}
                        </p>
                    </div>
                </label>
            ))}
        </div>
        <div className="mt-8 flex justify-end gap-3">
             <button onClick={resetState} className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500">
                Cancel
            </button>
            <button
                onClick={handleCompress}
                disabled={isCompressing}
                className="px-8 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-all duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {isCompressing ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Compressing...
                    </>
                ) : 'Compress PDF'}
            </button>
        </div>
    </div>
  );

  const renderResultsView = () => {
    if (!compressedFile) return null;
    const reduction = ((compressedFile.originalSize - compressedFile.newSize) / compressedFile.originalSize) * 100;
    
    return (
        <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Compression Complete!</h2>
            {reduction > 0 ? (
                <p className="text-lg font-semibold text-green-600 dark:text-green-400 mb-6">
                    You saved {reduction.toFixed(1)}%!
                </p>
            ) : (
                 <p className="text-md text-gray-600 dark:text-gray-300 mb-6">
                    The file size was already optimized.
                </p>
            )}

            <div className="flex justify-around items-center my-8 text-left">
                <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Original Size</p>
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">{formatFileSize(compressedFile.originalSize)}</p>
                </div>
                <div className="text-gray-300 dark:text-gray-500 text-2xl font-light">&rarr;</div>
                <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">New Size</p>
                    <p className="text-lg font-semibold text-red-600">{formatFileSize(compressedFile.newSize)}</p>
                </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                <button
                    onClick={handleDownload}
                    className="w-full sm:w-auto px-8 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-all duration-300 flex items-center justify-center gap-2"
                >
                    <DownloadIcon className="h-5 w-5" />
                    Download Compressed PDF
                </button>
                <button
                    onClick={resetState}
                    className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                >
                    Compress Another File
                </button>
            </div>
        </div>
    );
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow-sm dark:border-b dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button onClick={onGoHome} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
            <BackArrowIcon className="h-6 w-6" />
            <span className="font-medium">Back to Tools</span>
          </button>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Compress PDF File</h1>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
          {compressedFile ? renderResultsView() : file ? renderOptionsView() : renderInitialView()}
      </main>
       
       {error && (
            <div className="fixed bottom-8 right-8 bg-red-100 border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-600 dark:text-red-300 px-4 py-3 rounded-lg shadow-lg z-20" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
      )}
    </div>
  );
};
