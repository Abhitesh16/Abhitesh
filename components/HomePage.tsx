
import React from 'react';
import { ToolCard } from './ToolCard';
import { type Tool } from '../types';
import {
  MergeIcon,
  SplitIcon,
  CompressIcon,
  ConvertToPdfIcon,
  PdfToJpgIcon,
  RotateIcon,
  ProtectIcon,
  UnlockIcon,
  EditIcon,
  PdfLogoIcon,
  SunIcon,
  MoonIcon,
} from './Icons';

const tools: Tool[] = [
  { name: 'Merge PDF', description: 'Combine multiple PDF files into one document', Icon: MergeIcon },
  { name: 'Split PDF', description: 'Separate one PDF into multiple files', Icon: SplitIcon },
  { name: 'Compress PDF', description: 'Reduce file size while maintaining quality', Icon: CompressIcon },
  { name: 'Convert to PDF', description: 'Convert Word, Excel, PPT and images to PDF', Icon: ConvertToPdfIcon },
  { name: 'PDF to JPG', description: 'Extract every page of a PDF as a JPG image', Icon: PdfToJpgIcon },
  { name: 'Rotate PDF', description: 'Rotate pages to the correct orientation', Icon: RotateIcon },
  { name: 'Protect PDF', description: 'Add password protection to your PDFs', Icon: ProtectIcon },
  { name: 'Unlock PDF', description: 'Remove password from protected PDFs', Icon: UnlockIcon },
  { name: 'Edit PDF', description: 'Add text, images, and shapes to PDFs', Icon: EditIcon },
];

interface HomePageProps {
  onToolSelect: (toolName: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onToolSelect }) => {
  return (
    <div className="min-h-screen font-sans">
      <header className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <PdfLogoIcon className="h-8 w-auto" />
            <span className="text-2xl font-bold ml-2 dark:text-white">PDFTools</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="text-center py-20">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight dark:text-white">
            Every tool you need to work with
            <br />
            <span className="text-red-600">PDFs</span> in one place
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
            Free and easy to use online tools to merge, split, compress, convert, and edit PDF files. No installation required.
          </p>
          <div className="mt-8">
            <button className="bg-red-600 text-white font-semibold px-8 py-3 rounded-lg shadow-md hover:bg-red-700 transition-colors duration-300 flex items-center gap-2 mx-auto">
              Choose PDF Tool
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </section>

        <section className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold dark:text-white">All PDF Tools</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Select the tool you need to get started</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {tools.map(tool => (
              <ToolCard key={tool.name} tool={tool} onSelect={onToolSelect} />
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t mt-16 dark:border-gray-800">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-center items-center text-gray-500 dark:text-gray-400">
          <p>&copy; 2024 PDFTools. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};