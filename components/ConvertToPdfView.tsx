
import React, { useState, useCallback, useRef } from 'react';
import { PDFDocument, PageSizes } from 'pdf-lib';
import { BackArrowIcon, ConvertToPdfIcon, WordIcon, ExcelIcon, PowerPointIcon } from './Icons';

interface ConvertToPdfViewProps {
  onGoHome: () => void;
}

// Simple component to render image preview
const ImagePreview: React.FC<{ file: File }> = ({ file }) => {
    const [preview, setPreview] = useState<string | null>(null);
    
    React.useEffect(() => {
        let objectUrl: string | null = null;
        const reader = new FileReader();
        reader.onloadend = () => {
            objectUrl = reader.result as string;
            setPreview(objectUrl);
        };
        reader.readAsDataURL(file);

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [file]);

    if (!preview) {
        return <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse" />;
    }

    return <img src={preview} alt={file.name} className="w-full h-full object-cover" />;
};


export const ConvertToPdfView: React.FC<ConvertToPdfViewProps> = ({ onGoHome }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  const [pageOrientation, setPageOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pageSize, setPageSize] = useState<'A4' | 'Letter'>('A4');


  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  
  const acceptedImageTypes = ['image/jpeg', 'image/png'];
  const acceptedWordTypes = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const acceptedExcelTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  const acceptedPowerPointTypes = ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];

  const processFiles = (uploadedFiles: File[]) => {
    const imageFiles: File[] = [];
    const wordFiles: File[] = [];
    const excelFiles: File[] = [];
    const powerpointFiles: File[] = [];
    const otherFiles: File[] = [];

    for (const file of uploadedFiles) {
        if (acceptedImageTypes.includes(file.type)) {
            imageFiles.push(file);
        } else if (acceptedWordTypes.includes(file.type) || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
            wordFiles.push(file);
        } else if (acceptedExcelTypes.includes(file.type) || file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
            excelFiles.push(file);
        } else if (acceptedPowerPointTypes.includes(file.type) || file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) {
            powerpointFiles.push(file);
        } else {
            otherFiles.push(file);
        }
    }

    // If there are any doc/excel/ppt files, show the "coming soon" error and don't add *any* files.
    const unsupportedFeatures: string[] = [];
    if (wordFiles.length > 0) unsupportedFeatures.push('Word');
    if (excelFiles.length > 0) unsupportedFeatures.push('Excel');
    if (powerpointFiles.length > 0) unsupportedFeatures.push('PowerPoint');

    if (unsupportedFeatures.length > 0) {
        let featureString = '';
        if (unsupportedFeatures.length === 1) {
            featureString = unsupportedFeatures[0];
        } else if (unsupportedFeatures.length === 2) {
            featureString = unsupportedFeatures.join(' and ');
        } else {
            featureString = unsupportedFeatures.slice(0, -1).join(', ') + ', and ' + unsupportedFeatures.slice(-1);
        }
        
        setError(`${featureString} to PDF conversion is coming soon! For now, please select only image files (JPG, PNG).`);
        return; // Stop processing
    }

    setFiles(prev => [...prev, ...imageFiles]);

    if (otherFiles.length > 0) {
        setError("Some files were not of a supported type (JPG, PNG) and were ignored.");
    } else {
        setError(null);
    }
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
       processFiles(Array.from(e.dataTransfer.files));
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

  const convertToPdf = async () => {
    if (files.length === 0) {
      setError("Please select at least one image file.");
      return;
    }
    setError(null);
    setIsConverting(true);
    try {
      const pdfDoc = await PDFDocument.create();
      
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        let image;
        if (file.type === 'image/jpeg') {
            image = await pdfDoc.embedJpg(arrayBuffer);
        } else {
            image = await pdfDoc.embedPng(arrayBuffer);
        }

        let size = pageSize === 'A4' ? PageSizes.A4 : PageSizes.Letter;
        if (pageOrientation === 'landscape') {
            size = [size[1], size[0]];
        }
        
        const page = pdfDoc.addPage(size);
        const { width, height } = page.getSize();
        
        const scaled = image.scaleToFit(width - 50, height - 50);

        page.drawImage(image, {
            x: width / 2 - scaled.width / 2,
            y: height / 2 - scaled.height / 2,
            width: scaled.width,
            height: scaled.height,
        });
      }
      const pdfBytes = await pdfDoc.save();
      
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'converted.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error("Failed to convert to PDF:", err);
      setError("An error occurred during conversion.");
    } finally {
      setIsConverting(false);
    }
  };
  
  const renderUploadView = () => (
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
            accept="image/png, image/jpeg, .doc, .docx, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, .xls, .xlsx, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, .ppt, .pptx, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation"
            onChange={handleFileChange}
            disabled={isConverting}
        />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
                <ConvertToPdfIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                 <WordIcon className="w-10 h-10 text-blue-800" />
                 <ExcelIcon className="w-10 h-10 text-green-800" />
                 <PowerPointIcon className="w-10 h-10 text-orange-600" />
            </div>
            <p className="text-gray-700 dark:text-gray-200"><span className="font-semibold text-red-600">Click to upload files</span> or drag and drop</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Convert Word, Excel, PowerPoint, JPG, and PNG to a single PDF document.</p>
        </label>
    </div>
  );
  
  const renderContentView = () => (
    <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        <div className="flex-grow">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">Files to Convert ({files.length})</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Drag images to change their order in the PDF.</p>
                </div>
                 <label htmlFor="file-upload-more" className="cursor-pointer text-sm font-semibold text-red-600 hover:text-red-800">
                    + Add more files
                    <input type="file" id="file-upload-more" multiple className="hidden" accept="image/png, image/jpeg" onChange={handleFileChange} />
                </label>
            </div>
             <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  draggable
                  onDragStart={(e) => handleDragSortStart(e, index)}
                  onDragEnter={(e) => handleDragSortEnter(e, index)}
                  onDragEnd={handleDragSortEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className="relative group aspect-w-1 aspect-h-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm cursor-grab active:cursor-grabbing overflow-hidden"
                >
                    <ImagePreview file={file} />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                        <p className="text-xs text-white truncate">{file.name}</p>
                    </div>
                    <button onClick={() => removeFile(index)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </li>
              ))}
            </ul>
        </div>
        <aside className="w-full lg:max-w-xs flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm sticky top-28">
                 <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">PDF Options</h3>
                 <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Page Size</label>
                        <select value={pageSize} onChange={e => setPageSize(e.target.value as 'A4' | 'Letter')} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                            <option value="A4">A4</option>
                            <option value="Letter">Letter</option>
                        </select>
                     </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Page Orientation</label>
                         <select value={pageOrientation} onChange={e => setPageOrientation(e.target.value as 'portrait' | 'landscape')} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                            <option value="portrait">Portrait</option>
                            <option value="landscape">Landscape</option>
                        </select>
                     </div>
                 </div>
            </div>
        </aside>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow-sm dark:border-b dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button onClick={onGoHome} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
            <BackArrowIcon className="h-6 w-6" />
            <span className="font-medium">Back to Tools</span>
          </button>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Convert to PDF</h1>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        {files.length === 0 ? renderUploadView() : renderContentView()}
        {error && (
            <p className="text-center text-red-600 mt-4 bg-red-100 dark:bg-red-900/30 dark:text-red-400 px-4 py-2 rounded-md max-w-4xl mx-auto">{error}</p>
        )}
      </main>

      {files.length > 0 && (
          <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 sticky bottom-0 z-10">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-end">
              <button
                onClick={convertToPdf}
                disabled={files.length === 0 || isConverting}
                className="px-8 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-all duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isConverting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Converting...
                  </>
                ) : (
                    'Convert to PDF'
                )}
              </button>
            </div>
          </footer>
      )}
    </div>
  );
};
