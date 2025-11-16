
import React from 'react';
import { AkbarIcon } from './icons/AkbarIcon';

export const LoadingIndicator: React.FC = () => {
  return (
    <div className="flex items-end animate-fade-in-slide-up">
      <AkbarIcon className="w-8 h-8 text-cyan-300 mr-3 shrink-0 mb-2" />
      <div className="max-w-xl lg:max-w-3xl rounded-2xl px-5 py-3 shadow-md bg-gray-700 text-gray-200">
        <div className="flex items-center space-x-2">
            <p className="text-sm italic text-gray-400">AKBAR AI sedang mengetik</p>
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};