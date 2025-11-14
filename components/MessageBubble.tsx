





import React from 'react';
import { Message } from '../types';
import { UserIcon } from './icons/UserIcon';
import { BotIcon } from './icons/BotIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import clsx from 'clsx';
import { VideoIcon } from './icons/VideoIcon';

// A simple markdown to HTML converter
const markdownToHtml = (text: string) => {
    let html = text
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        // Strikethrough
        .replace(/~~(.*?)~~/g, '<del>$1</del>')
        // Code
        .replace(/`([^`]+)`/g, '<code class="bg-gray-700 rounded px-1 py-0.5 text-sm font-mono">$1</code>')
        // Lists
        .replace(/^\s*\n\*/gm, '<ul>\n*')
        .replace(/^(\*.+)\s*\n([^*])/gm, '$1\n</ul>\n$2')
        .replace(/^\s*\*(.*)/gm, '<li>$1</li>')
        // Line breaks
        .replace(/\n/g, '<br />');
    return { __html: html };
};

interface MessageBubbleProps {
  message: Message;
  onContextMenu: (event: React.MouseEvent) => void;
  isAnimated?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onContextMenu, isAnimated }) => {
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

  const Icon = isUser ? UserIcon : BotIcon;
  const iconClasses = isUser ? 'text-purple-300 ml-3' : 'text-cyan-300 mr-3';
  
  const handleDownload = (e: React.MouseEvent, url: string | undefined) => {
    e.stopPropagation(); // Prevent context menu
    if (!url) return;

    const link = document.createElement('a');
    link.href = url;
    
    if (url.startsWith('data:image')) { // It's an image
        const mimeType = url.match(/data:(.*);/)?.[1] || 'image/png';
        const extension = mimeType.split('/')[1]?.split('+')[0] || 'png';
        link.download = `nexus-image-${Date.now()}.${extension}`;
    } else { // It's a video or audio
        const fileType = url.startsWith('data:audio') ? 'audio' : 'video';
        const extension = fileType === 'audio' ? 'wav' : 'mp4';
        link.download = `nexus-${fileType}-${Date.now()}.${extension}`;
        link.target = '_blank'; // Open in new tab to download for cross-origin URLs
        link.rel = 'noopener noreferrer';
    }
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
                <p className="mt-3 text-sm text-gray-300 italic">{message.generationText || "Nexus sedang meracik videomu..."}</p>
            </div>
        )}

        {message.videoUrl && message.generationStatus === 'complete' && (
             <div className="relative group mb-2 rounded-lg overflow-hidden max-w-sm">
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
          <div className="relative group mb-2 rounded-lg overflow-hidden max-w-sm">
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

        {message.text && (
           <div className="prose prose-invert prose-sm" dangerouslySetInnerHTML={markdownToHtml(message.text)} />
        )}
      </div>
      {isUser && <Icon className={`w-8 h-8 ${iconClasses} shrink-0 mb-2`} />}
    </div>
  );
};