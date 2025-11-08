import React from 'react';
import { type ConvertedImage } from '../types';

interface ResultsViewProps {
  convertedImages: ConvertedImage[];
}

export const ResultsView: React.FC<ResultsViewProps> = ({ convertedImages }) => {
  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/50">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {convertedImages.map((image) => (
              <div key={image.pageNumber} className="relative group border rounded-lg overflow-hidden shadow-sm dark:border-slate-700">
                  <img src={image.dataUrl} alt={`Page ${image.pageNumber}`} className="w-full h-auto" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1">
                      Page {image.pageNumber}
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};
