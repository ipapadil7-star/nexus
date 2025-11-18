import React from 'react';
import { Message } from '../types';
import { VideoIcon } from './icons/VideoIcon';
import { FilePdfIcon } from './icons/FilePdfIcon';
import { FileSlideIcon } from './icons/FileSlideIcon';
import { FileSheetIcon } from './icons/FileSheetIcon';
import { Volume2Icon } from './icons/Volume2Icon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { AkbarIcon } from './icons/AkbarIcon';

interface GenerationStatusIndicatorProps {
  status?: 'pending' | 'generating';
  text?: string;
  type?: Message['generationType'];
  progress?: number;
}

const getIconForType = (type: Message['generationType']) => {
    switch(type) {
        case 'video':
            return <VideoIcon className="w-6 h-6 text-red-400" />;
        case 'audio':
            return <Volume2Icon className="w-6 h-6 text-amber-400" />;
        case 'pdf':
            return <FilePdfIcon className="w-6 h-6 text-red-400" />;
        case 'slide':
            return <FileSlideIcon className="w-6 h-6 text-orange-400" />;
        case 'sheet':
            return <FileSheetIcon className="w-6 h-6 text-green-400" />;
        case 'comic':
            return <BookOpenIcon className="w-6 h-6 text-orange-400" />;
        default:
            return <AkbarIcon className="w-6 h-6 text-cyan-400" />;
    }
}

export const GenerationStatusIndicator: React.FC<GenerationStatusIndicatorProps> = ({ status, text, type, progress }) => {
  if (!status || (status !== 'pending' && status !== 'generating')) {
    return null;
  }

  const icon = getIconForType(type);
  const isProgressAvailable = typeof progress === 'number' && progress > 0;

  // SVG Progress Ring calculation
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - ((progress || 0) / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center gap-2 w-24 shrink-0 animate-fade-in">
      <div className="relative w-12 h-12">
        {isProgressAvailable ? (
          // Progress Ring View
          <>
            <svg className="w-full h-full" viewBox="0 0 48 48" style={{ transform: 'rotate(-90deg)' }}>
              <circle className="text-gray-700" strokeWidth="4" stroke="currentColor" fill="transparent" r={radius} cx="24" cy="24" />
              <circle
                className="text-purple-500"
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="24"
                cy="24"
                style={{ transition: 'stroke-dashoffset 0.35s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-mono font-bold text-white">
                {Math.round(progress!)}%
              </span>
            </div>
          </>
        ) : (
          // Indeterminate Spinner View
          <>
            <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin-slow"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              {icon}
            </div>
          </>
        )}
      </div>
      <p className="text-xs text-center text-gray-400 italic">
        {text || "Bekerja..."}
      </p>
    </div>
  );
};