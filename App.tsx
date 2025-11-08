
import React, { useState, useEffect } from 'react';
import { HomePage } from './components/HomePage';
import { MergePdfView } from './components/MergePdfView';
import { SplitPdfView } from './components/SplitPdfView';
import { CompressPdfView } from './components/CompressPdfView';
import { ConvertToPdfView } from './components/ConvertToPdfView';
import { ProtectPdfView } from './components/ProtectPdfView';
import { UnlockPdfView } from './components/UnlockPdfView';
import { EditPdfView } from './components/EditPdfView';
import { RotatePdfView } from './components/RotatePdfView';
import { PdfToJpgView } from './components/PdfToJpgView';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'home' | 'merge-pdf' | 'split-pdf' | 'compress-pdf' | 'convert-to-pdf' | 'pdf-to-jpg' | 'protect-pdf' | 'unlock-pdf' | 'edit-pdf' | 'rotate-pdf' | null>('home');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleToolSelect = (toolName: string) => {
    if (toolName === 'Merge PDF') {
      setActiveTool('merge-pdf');
    } else if (toolName === 'Split PDF') {
      setActiveTool('split-pdf');
    } else if (toolName === 'Compress PDF') {
      setActiveTool('compress-pdf');
    } else if (toolName === 'Convert to PDF') {
      setActiveTool('convert-to-pdf');
    } else if (toolName === 'PDF to JPG') {
      setActiveTool('pdf-to-jpg');
    } else if (toolName === 'Protect PDF') {
      setActiveTool('protect-pdf');
    } else if (toolName === 'Unlock PDF') {
      setActiveTool('unlock-pdf');
    } else if (toolName === 'Edit PDF') {
      setActiveTool('edit-pdf');
    } else if (toolName === 'Rotate PDF') {
      setActiveTool('rotate-pdf');
    } else {
      alert(`The "${toolName}" tool is not yet implemented.`);
    }
  };

  const handleGoHome = () => {
    setActiveTool('home');
  };

  const renderActiveView = () => {
    switch (activeTool) {
      case 'merge-pdf':
        return <MergePdfView onGoHome={handleGoHome} />;
      case 'split-pdf':
        return <SplitPdfView onGoHome={handleGoHome} />;
      case 'compress-pdf':
        return <CompressPdfView onGoHome={handleGoHome} />;
      case 'convert-to-pdf':
        return <ConvertToPdfView onGoHome={handleGoHome} />;
      case 'pdf-to-jpg':
        return <PdfToJpgView onGoHome={handleGoHome} />;
      case 'protect-pdf':
        return <ProtectPdfView onGoHome={handleGoHome} />;
      case 'unlock-pdf':
        return <UnlockPdfView onGoHome={handleGoHome} />;
      case 'edit-pdf':
        return <EditPdfView onGoHome={handleGoHome} />;
      case 'rotate-pdf':
        return <RotatePdfView onGoHome={handleGoHome} />;
      case 'home':
      default:
        return <HomePage onToolSelect={handleToolSelect} />;
    }
  };

  return (
    <div className="antialiased bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {renderActiveView()}
    </div>
  );
};

export default App;