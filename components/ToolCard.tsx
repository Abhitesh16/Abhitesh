
import React from 'react';
import { type Tool } from '../types';

interface ToolCardProps {
  tool: Tool;
  onSelect: (toolName: string) => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(tool.name)}
      className="text-left p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg hover:border-red-300 dark:hover:border-red-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500"
    >
      <div className="flex items-center justify-center h-16 w-16 bg-red-100 rounded-lg mb-4">
        <tool.Icon className="h-8 w-8 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{tool.name}</h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{tool.description}</p>
    </button>
  );
};
