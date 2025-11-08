
import React, { useState, useCallback } from 'react';
import { PDFDocument, StandardFonts, rgb, degrees, PDFImage } from 'pdf-lib';
import { BackArrowIcon, EditIcon, FilePdfIcon, PlusIcon, TrashIcon } from './Icons';

interface EditPdfViewProps {
  onGoHome: () => void;
}

type Position = 'TopLeft' | 'TopCenter' | 'TopRight' | 'MiddleLeft' | 'MiddleCenter' | 'MiddleRight' | 'BottomLeft' | 'BottomCenter' | 'BottomRight';

interface TextEdit {
  type: 'text';
  id: number;
  text: string;
  page: number;
  position: Position;
  fontSize: number;
  color: { r: number; g: number; b: number };
}

interface ImageEdit {
  type: 'image';
  id: number;
  imageBytes: ArrayBuffer;
  imageName: string;
  page: number;
  position: Position;
  width: number;
  height: number;
}

type Edit = TextEdit | ImageEdit;

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};


export const EditPdfView: React.FC<EditPdfViewProps> = ({ onGoHome }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [edits, setEdits] = useState<Edit[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  // States for the edit form modal
  const [showEditModal, setShowEditModal] = useState<'text' | 'image' | null>(null);
  const [editText, setEditText] = useState('Sample Text');
  const [editPage, setEditPage] = useState(1);
  const [editPosition, setEditPosition] = useState<Position>('MiddleCenter');
  const [editFontSize, setEditFontSize] = useState(24);
  const [editColor, setEditColor] = useState('#000000');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);

  const resetState = () => {
    setFile(null);
    setPageCount(0);
    setEdits([]);
    setIsProcessing(false);
    setIsSaving(false);
    setError(null);
  };
  
  const resetEditForm = () => {
    setShowEditModal(null);
    setEditText('Sample Text');
    setEditPage(1);
    setEditPosition('MiddleCenter');
    setEditFontSize(24);
    setEditColor('#000000');
    setEditImageFile(null);
  }

  const handleFileChange = async (selectedFile: File | null) => {
    if (!selectedFile) return;
    if (selectedFile.type !== 'application/pdf') {
        setError("Only PDF files are accepted.");
        return;
    }
    resetState();
    setIsProcessing(true);
    try {
        setFile(selectedFile);
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        setPageCount(pdfDoc.getPageCount());
    } catch (err) {
        console.error("Error loading PDF", err);
        setError("Could not load the PDF file. It might be corrupted or protected.");
        resetState();
    } finally {
        setIsProcessing(false);
    }
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
  
  const handleAddText = () => {
      const hex = editColor.replace('#', '');
      const newEdit: TextEdit = {
          type: 'text',
          id: Date.now(),
          text: editText,
          page: editPage,
          position: editPosition,
          fontSize: editFontSize,
          color: {
              r: parseInt(hex.substring(0,2), 16) / 255,
              g: parseInt(hex.substring(2,4), 16) / 255,
              b: parseInt(hex.substring(4,6), 16) / 255,
          }
      };
      setEdits(prev => [...prev, newEdit]);
      resetEditForm();
  };
  
  const handleAddImage = async () => {
      if (!editImageFile) return;
      const imageBytes = await editImageFile.arrayBuffer();
      const newEdit: ImageEdit = {
          type: 'image',
          id: Date.now(),
          imageBytes,
          imageName: editImageFile.name,
          page: editPage,
          position: editPosition,
          width: 150, // Default width
          height: 150, // Default height, will be scaled
      }
      setEdits(prev => [...prev, newEdit]);
      resetEditForm();
  };
  
  const removeEdit = (id: number) => {
      setEdits(prev => prev.filter(edit => edit.id !== id));
  };
  
  const handleSave = async () => {
      if (!file) return;
      setIsSaving(true);
      setError(null);
      try {
          const existingPdfBytes = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(existingPdfBytes);
          const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

          for (const edit of edits) {
              const page = pdfDoc.getPage(edit.page - 1);
              const { width, height } = page.getSize();
              const margin = 50;
              
              let x = 0, y = 0;

              if (edit.type === 'text') {
                  const textWidth = helveticaFont.widthOfTextAtSize(edit.text, edit.fontSize);
                  
                  // Horizontal positioning
                  if (edit.position.includes('Left')) x = margin;
                  if (edit.position.includes('Center')) x = width / 2 - textWidth / 2;
                  if (edit.position.includes('Right')) x = width - margin - textWidth;

                  // Vertical positioning
                  if (edit.position.includes('Top')) y = height - margin - edit.fontSize;
                  if (edit.position.includes('Middle')) y = height / 2 - edit.fontSize / 2;
                  if (edit.position.includes('Bottom')) y = margin;

                  page.drawText(edit.text, { x, y, font: helveticaFont, size: edit.fontSize, color: rgb(edit.color.r, edit.color.g, edit.color.b) });
              }
              
              if (edit.type === 'image') {
                  let image: PDFImage;
                  if (edit.imageName.toLowerCase().endsWith('.png')) {
                      image = await pdfDoc.embedPng(edit.imageBytes);
                  } else {
                      image = await pdfDoc.embedJpg(edit.imageBytes);
                  }
                  
                  const scaled = image.scaleToFit(edit.width, edit.height);
                  
                  // Horizontal positioning
                  if (edit.position.includes('Left')) x = margin;
                  if (edit.position.includes('Center')) x = width / 2 - scaled.width / 2;
                  if (edit.position.includes('Right')) x = width - margin - scaled.width;

                  // Vertical positioning
                  if (edit.position.includes('Top')) y = height - margin - scaled.height;
                  if (edit.position.includes('Middle')) y = height / 2 - scaled.height / 2;
                  if (edit.position.includes('Bottom')) y = margin;
                  
                   page.drawImage(image, { x, y, width: scaled.width, height: scaled.height });
              }
          }

          const pdfBytes = await pdfDoc.save();
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = file.name.replace(/\.pdf$/i, '-edited.pdf');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

      } catch (err) {
          console.error("Failed to save PDF:", err);
          setError("An error occurred while saving the PDF.");
      } finally {
          setIsSaving(false);
      }
  };


  const renderInitialView = () => (
     <div 
        className={`flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-8 border-2 border-dashed rounded-lg transition-colors duration-300 ${isDraggingOver ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'}`}
        onDrop={handleDrop}
        onDragEnter={handleDragEvents}
        onDragLeave={handleDragEvents}
        onDragOver={handleDragEvents}
    >
        <input type="file" id="file-upload" className="hidden" accept="application/pdf" onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)} />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center text-center">
             <EditIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-gray-700 dark:text-gray-200"><span className="font-semibold text-red-600">Click to upload a PDF</span> or drag and drop</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add text and images to your document</p>
        </label>
    </div>
  );
  
  const renderEditView = () => (
    <div className="w-full max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
            <div className="flex items-center gap-3 min-w-0">
                <FilePdfIcon className="h-8 w-8 text-red-500 flex-shrink-0" />
                <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{file?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{pageCount} pages, {formatFileSize(file?.size || 0)}</p>
                </div>
            </div>
            <button onClick={resetState} className="text-sm font-medium text-red-600 hover:text-red-800 flex-shrink-0">
                Choose another file
            </button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Add Content</h3>
            <div className="flex items-center gap-4">
                <button onClick={() => setShowEditModal('text')} className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-md hover:bg-red-100 dark:hover:bg-red-900/60">
                    <PlusIcon className="w-5 h-5" /> Add Text
                </button>
                 <button onClick={() => setShowEditModal('image')} className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/60">
                    <PlusIcon className="w-5 h-5" /> Add Image
                </button>
            </div>
        </div>
        
        <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Edits ({edits.length})</h3>
            {edits.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8 bg-gray-100 dark:bg-gray-800 rounded-lg">No edits added yet. Click a button above to get started.</p>
            ) : (
                <ul className="space-y-3">
                    {edits.map(edit => (
                        <li key={edit.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                           <div className="flex-grow">
                               <p className="font-medium text-gray-800 dark:text-gray-200">
                                   {edit.type === 'text' ? `Add Text: "${edit.text}"` : `Add Image: ${edit.imageName}`}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                   On Page {edit.page} at {edit.position}
                                </p>
                           </div>
                           <button onClick={() => removeEdit(edit.id)} className="text-gray-400 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 p-1">
                                <TrashIcon className="w-5 h-5"/>
                           </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    </div>
  );
  
  const renderEditModal = () => {
    if (!showEditModal) return null;
    
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={resetEditForm}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b dark:border-gray-700">
                    <h2 className="text-xl font-semibold dark:text-white">Add {showEditModal === 'text' ? 'Text' : 'Image'}</h2>
                </div>
                <div className="p-6 space-y-4">
                     {showEditModal === 'text' && (
                        <>
                           <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Text</label>
                                <input type="text" value={editText} onChange={e => setEditText(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
                           </div>
                           <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Font Size</label>
                                    <input type="number" value={editFontSize} onChange={e => setEditFontSize(parseInt(e.target.value))} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
                                    <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} className="w-full p-1 border border-gray-300 dark:border-gray-600 rounded-md h-10 bg-white dark:bg-gray-700" />
                                </div>
                           </div>
                        </>
                    )}
                    {showEditModal === 'image' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image File</label>
                            <input type="file" accept="image/png, image/jpeg" onChange={e => setEditImageFile(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 dark:file:bg-red-900/40 file:text-red-700 dark:file:text-red-300 hover:file:bg-red-100 dark:hover:file:bg-red-900/60"/>
                        </div>
                    )}
                     <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Page Number</label>
                            <select value={editPage} onChange={e => setEditPage(parseInt(e.target.value))} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                                {Array.from({length: pageCount}, (_, i) => i + 1).map(num => <option key={num} value={num}>{num}</option>)}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Position</label>
                            <select value={editPosition} onChange={e => setEditPosition(e.target.value as Position)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                                {['TopLeft', 'TopCenter', 'TopRight', 'MiddleLeft', 'MiddleCenter', 'MiddleRight', 'BottomLeft', 'BottomCenter', 'BottomRight'].map(pos => <option key={pos} value={pos}>{pos}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
                    <button onClick={resetEditForm} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                    <button onClick={showEditModal === 'text' ? handleAddText : handleAddImage} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Add</button>
                </div>
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
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Edit PDF File</h1>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
          {isProcessing ? <p className="dark:text-white">Loading PDF...</p> : file ? renderEditView() : renderInitialView()}
      </main>
      
      {renderEditModal()}
       
       {error && (
            <div className="fixed bottom-8 right-8 bg-red-100 border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-600 dark:text-red-300 px-4 py-3 rounded-lg shadow-lg z-20" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
      )}
      
      {file && (
        <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 sticky bottom-0 z-10">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-end">
            <button
                onClick={handleSave}
                disabled={isSaving || edits.length === 0}
                className="px-8 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-all duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {isSaving ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Applying Changes...
                    </>
                ) : 'Apply Changes & Download'}
            </button>
            </div>
        </footer>
      )}
    </div>
  );
};
