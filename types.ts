import React from 'react';

export interface Tool {
  name: string;
  description: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

// Fix: Add missing ChatMessage and ConvertedImage interfaces to resolve import errors.
export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export interface ConvertedImage {
  pageNumber: number;
  dataUrl: string;
}
