

import React from 'react';
import { Message } from '../types';
import { UserIcon } from './icons/UserIcon';
import { AkbarIcon } from './icons/AkbarIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import clsx from 'clsx';
import { VideoIcon } from './icons/VideoIcon';
import { StyleSelector } from './StyleSelector';
import { EditIcon } from './icons/EditIcon';
import { FilePdfIcon } from './icons/FilePdfIcon';
import { FileSlideIcon } from './icons/FileSlideIcon';
import { FileSheetIcon } from './icons/FileSheetIcon';

interface MessageBubbleProps {
  message: Message;
  onContextMenu: (event: React.MouseEvent) => void;
  isAnimated?: boolean;
  onStyleSelect: (style: string) => void;
  isLoading: boolean;
  onEditComicRequest: (message: Message) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onContextMenu, isAnimated, onStyleSelect, isLoading, onEditComicRequest }) => {
  const isUser = message.role === 'user';

  const bubbleClasses = isUser
    ? 'bg-purple-600 text-white'
    : 'bg-gray-700 text-gray-200';
  
  const containerClasses = clsx(
    'flex items-end',
    {
      'justify-end': isUser,
      'animate-fade-in-slide-up': isAnimated
    }
  );

  const Icon = isUser ? UserIcon : AkbarIcon;
  const iconClasses = isUser ? 'text-purple-300 ml-3' : 'text-cyan-300 mr-3';
  
  const handleDownload = (e: React.MouseEvent, url: string | undefined) => {
    e.stopPropagation(); // Prevent context menu
    if (!url) return;

    const link = document.createElement('a');
    link.href = url;
    
    if (url.startsWith('data:image')) { // It's an image
        const mimeType = url.match(/data:(.*);/)?.[1] || 'image/png';
        const extension = mimeType.split('/')[1]?.split('+')[0] || 'png';
        link.download = `akbar-image-${Date.now()}.${extension}`;
    } else { // It's a video or audio
        const fileType = url.startsWith('data:audio') ? 'audio' : 'video';
        const extension = fileType === 'audio' ? 'wav' : 'mp4';
        link.download = `akbar-${fileType}-${Date.now()}.${extension}`;
        link.target = '_blank'; // Open in new tab to download for cross-origin URLs
        link.rel = 'noopener noreferrer';
    }
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Style Selector Rendering
  if (message.isStyleSelector) {
    return (
       <div className={clsx('flex items-end', { 'animate-fade-in-slide-up': isAnimated })}>
            <AkbarIcon className={`w-8 h-8 ${iconClasses} shrink-0 mb-2`} />
            <div className={clsx(
                'max-w-xl lg:max-w-3xl rounded-2xl px-5 py-3 shadow-md',
                bubbleClasses
            )}>
                {message.text && (
                    <div className="prose prose-invert prose-sm whitespace-pre-wrap">{message.text}</div>
                )}
                <StyleSelector onSelect={onStyleSelect} isLoading={isLoading} />
            </div>
        </div>
    );
  }

  // Comic Panel Rendering
  if (message.isComicPanel) {
    return (
       <div className={clsx('flex items-end', { 'animate-fade-in-slide-up': isAnimated })} onContextMenu={onContextMenu}>
            <AkbarIcon className={`w-8 h-8 ${iconClasses} shrink-0 mb-2`} />
            <div className="group max-w-xl lg:max-w-2xl bg-gray-800 border-2 border-gray-600 rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gray-700 px-4 py-1 flex justify-between items-center">
                    <h4 className="text-sm font-bold text-gray-300 tracking-wider">PANEL {message.panelNumber}</h4>
                     {message.generationStatus === 'generating' && <p className="text-xs text-purple-300 italic animate-pulse">{message.generationText}</p>}
                </div>
                 <div className="relative bg-black">
                    <img src={message.imageUrl} alt={`Comic panel ${message.panelNumber}`} className={clsx("w-full h-auto", {"opacity-50": message.generationStatus === 'generating'})} />
                    <div className="absolute top-2 right-2 transition-opacity opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                        <button
                            onClick={() => onEditComicRequest(message)}
                            className="bg-black/60 text-white rounded-full p-2 hover:bg-black/90"
                            aria-label="Edit panel"
                            title="Edit panel"
                        >
                            <EditIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="p-4 bg-gray-800/70 border-t-2 border-gray-600 flex items-end justify-between gap-4">
                    {message.text ? (
                        <div className="prose prose-invert prose-sm text-gray-200 italic whitespace-pre-wrap flex-grow">
                            {message.text}
                        </div>
                    ) : (
                        <div className="flex-grow"></div>
                    )}
                    <button
                        onClick={(e) => handleDownload(e, message.imageUrl)}
                        className="bg-purple-600 text-white rounded-full p-2 hover:bg-purple-500 transition-colors shrink-0"
                        aria-label="Unduh gambar"
                        title="Unduh gambar"
                    >
                        <DownloadIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
  }

  // Regular Message Rendering
  return (
    <div className={containerClasses} onContextMenu={onContextMenu}>
      {!isUser && <Icon className={`w-8 h-8 ${iconClasses} shrink-0 mb-2`} />}
      <div className={clsx(
        'max-w-xl lg:max-w-3xl rounded-2xl px-5 py-3 shadow-md',
        bubbleClasses
      )}>
        {message.generationStatus === 'generating' && (
            <div className="flex flex-col items-center justify-center bg-black/20 rounded-lg mb-2 p-4">
                {message.videoUrl ? (
                    <div className="w-full">
                        <div className="text-xs text-center text-gray-400 italic mb-2 animate-pulse">PRATINJAU...</div>
                        <video src={message.videoUrl} autoPlay loop muted className="w-full h-auto bg-black rounded-md" />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center">
                        <div className="relative">
                            <VideoIcon className="w-12 h-12 text-red-400" />
                            <div className="absolute inset-0 border-2 border-red-500/50 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                )}
                <p className="mt-3 text-sm text-gray-300 italic">{message.generationText || "AKBAR AI sedang meracik videomu..."}</p>
            </div>
        )}

        {message.videoUrl && message.generationStatus === 'complete' && (
             <div className="relative group mb-2 rounded-lg overflow-hidden">
                <video src={message.videoUrl} controls autoPlay loop muted className="w-full h-auto bg-black" />
                {!isUser && (
                     <button
                        onClick={(e) => handleDownload(e, message.videoUrl)}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-2 hover:bg-black/90 transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label="Unduh video"
                        title="Unduh video"
                    >
                        <DownloadIcon className="w-5 h-5" />
                    </button>
                )}
            </div>
        )}

        {message.audioUrl && (
             <div className="my-2">
                <audio controls src={message.audioUrl} className="w-full">
                    Browser Anda tidak mendukung elemen audio.
                </audio>
            </div>
        )}

        {message.imageUrl && (
          <div className="relative group mb-2 rounded-lg overflow-hidden">
            <img src={message.imageUrl} alt="content" className="w-full h-auto" />
            {!isUser && (
                 <button
                    onClick={(e) => handleDownload(e, message.imageUrl)}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-2 hover:bg-black/90 transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Unduh gambar"
                    title="Unduh gambar"
                >
                    <DownloadIcon className="w-5 h-5" />
                </button>
            )}
          </div>
        )}
        
        {!message.imageUrl && message.fileInfo && (
            <a
                href={message.fileInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-black/20 p-3 rounded-lg hover:bg-black/40 transition-colors mb-2"
            >
                <DocumentIcon className="w-8 h-8 text-gray-400 shrink-0" />
                <div className="min-w-0">
                    <p className="font-semibold text-gray-200 truncate">{message.fileInfo.name}</p>
                    <p className="text-xs text-gray-400">Klik untuk melihat file</p>
                </div>
            </a>
        )}

        {message.documentInfo && (
            <div className="flex items-center gap-3 bg-black/20 p-3 rounded-lg mb-2">
                {message.documentInfo.format === 'pdf' && <FilePdfIcon className="w-8 h-8 text-red-400 shrink-0" />}
                {message.documentInfo.format === 'slide' && <FileSlideIcon className="w-8 h-8 text-orange-400 shrink-0" />}
                {message.documentInfo.format === 'sheet' && <FileSheetIcon className="w-8 h-8 text-green-400 shrink-0" />}
                <div className="min-w-0">
                    <p className="font-semibold text-gray-200 truncate">{message.documentInfo.filename}</p>
                    <p className="text-xs text-gray-400">Dokumen berhasil dibuat dan diunduh.</p>
                </div>
            </div>
        )}

        {message.text && (
           <div className="prose prose-invert prose-sm whitespace-pre-wrap">{message.text}</div>
        )}
      </div>
      {isUser && <Icon className={`w-8 h-8 ${iconClasses} shrink-0 mb-2`} />}
    </div>
  );
};
