
import React, { useState, useCallback } from 'react';
import { BackArrowIcon, FilePdfIcon, ProtectIcon } from './Icons';

// Make Qpdf available from the global scope where it's loaded via CDN
declare const Qpdf: any;

interface ProtectPdfViewProps {
  onGoHome: () => void;
}

interface ProtectedFile {
  blob: Blob;
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


export const ProtectPdfView: React.FC<ProtectPdfViewProps> = ({ onGoHome }) => {
  const [file, setFile] = useState<File | null>(null);
  const [protectedFile, setProtectedFile] = useState<ProtectedFile | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProtecting, setIsProtecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const resetState = () => {
      setFile(null);
      setProtectedFile(null);
      setPassword('');
      setConfirmPassword('');
      setIsProtecting(false);
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

  const handleProtect = async () => {
    if (!file) return;
    if (!password) {
        setError("Password cannot be empty.");
        return;
    }
    if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
    }
    
    setIsProtecting(true);
    setError(null);
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        const qpdf = await Qpdf.create(arrayBuffer);
        await qpdf.encrypt(password);
        const protectedBytes = await qpdf.getArrayBuffer();
        
        const blob = new Blob([protectedBytes], { type: 'application/pdf' });

        setProtectedFile({
            blob,
            name: file.name.replace(/\.pdf$/i, '-protected.pdf')
        });

    } catch (err) {
        console.error("Failed to protect PDF:", err);
        setError("An error occurred during protection. The file might be corrupt or already protected.");
    } finally {
        setIsProtecting(false);
    }
  };
  
  const handleDownload = () => {
      if (!protectedFile) return;
      const url = URL.createObjectURL(protectedFile.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = protectedFile.name;
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
             <ProtectIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-gray-700 dark:text-gray-200"><span className="font-semibold text-red-600">Click to upload a PDF</span> or drag and drop</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add a password to protect your PDF file.</p>
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
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Set a password</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Enter a password to encrypt and protect your PDF from unauthorized access.</p>
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="password">Password</label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                    placeholder="Enter password"
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="confirm-password">Confirm Password</label>
                <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                    placeholder="Confirm password"
                />
            </div>
        </div>
        <div className="mt-8 flex justify-end gap-3">
             <button onClick={resetState} className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500">
                Cancel
            </button>
            <button
                onClick={handleProtect}
                disabled={isProtecting}
                className="px-8 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-all duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {isProtecting ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Protecting...
                    </>
                ) : 'Protect PDF'}
            </button>
        </div>
    </div>
  );

  const renderResultsView = () => {
    if (!protectedFile) return null;
    
    return (
        <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">PDF Protected!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Your PDF is now encrypted. You will need the password to open it.</p>
            
            <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 flex items-center justify-center gap-4 mb-8">
                 <FilePdfIcon className="h-10 w-10 text-red-500 flex-shrink-0" />
                 <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{protectedFile.name}</p>
            </div>


            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                <button
                    onClick={handleDownload}
                    className="w-full sm:w-auto px-8 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-all duration-300 flex items-center justify-center gap-2"
                >
                    <DownloadIcon className="h-5 w-5" />
                    Download Protected PDF
                </button>
                <button
                    onClick={resetState}
                    className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                >
                    Protect Another File
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
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Protect PDF File</h1>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
          {protectedFile ? renderResultsView() : file ? renderOptionsView() : renderInitialView()}
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
