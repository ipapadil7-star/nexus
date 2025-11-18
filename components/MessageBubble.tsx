





import React from 'react';
import { Message } from '../types';
import { UserIcon } from './icons/UserIcon';
import { AkbarIcon } from './icons/AkbarIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import clsx from 'clsx';
import { StyleSelector } from './StyleSelector';
import { EditIcon } from './icons/EditIcon';
import { FilePdfIcon } from './icons/FilePdfIcon';
import { FileSlideIcon } from './icons/FileSlideIcon';
import { FileSheetIcon } from './icons/FileSheetIcon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GenerationStatusIndicator } from './GenerationStatusIndicator';

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
    'flex items-end gap-3',
    {
      'justify-end': isUser,
      'animate-fade-in-slide-up': isAnimated
    }
  );

  const Icon = isUser ? UserIcon : AkbarIcon;
  const iconClasses = isUser ? 'text-purple-300' : 'text-cyan-300';
  
 const handleDownload = (e: React.MouseEvent, url: string | undefined, originalFilename?: string) => {
    e.stopPropagation();
    if (!url) return;

    const link = document.createElement('a');
    link.href = url;
    
    if (originalFilename) {
        link.download = originalFilename;
    } else if (url.startsWith('data:image')) {
        const mimeType = url.match(/data:(.*);/)?.[1] || 'image/png';
        const extension = mimeType.split('/')[1]?.split('+')[0] || 'png';
        link.download = `akbar-image-${Date.now()}.${extension}`;
    } else {
        const fileType = url.startsWith('data:audio') ? 'audio' : 'video';
        const extension = fileType === 'audio' ? 'wav' : 'mp4';
        link.download = `akbar-${fileType}-${Date.now()}.${extension}`;
    }
    
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


  // Style Selector Rendering
  if (message.isStyleSelector) {
    return (
       <div className={clsx('flex items-end', { 'animate-fade-in-slide-up': isAnimated })}>
            <AkbarIcon className="w-8 h-8 text-cyan-300 mr-3 shrink-0 mb-2" />
            <div className={clsx(
                'max-w-xl lg:max-w-3xl rounded-2xl rounded-bl-none px-5 py-3 shadow-md',
                bubbleClasses
            )}>
                {message.text && (
                    <div className="prose prose-invert prose-sm max-w-none">{message.text}</div>
                )}
                <StyleSelector onSelect={onStyleSelect} isLoading={isLoading} />
            </div>
        </div>
    );
  }

  // Comic Panel Rendering
  if (message.isComicPanel) {
    return (
       <div className={clsx('flex items-end gap-3', { 'animate-fade-in-slide-up': isAnimated })} onContextMenu={onContextMenu}>
            <AkbarIcon className="w-8 h-8 text-cyan-300 shrink-0 mb-2" />
            <div className="group max-w-xl lg:max-w-2xl bg-gray-800 border-2 border-gray-600 rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gray-700 px-4 py-1 flex justify-between items-center">
                    <h4 className="text-sm font-bold text-gray-300 tracking-wider">PANEL {message.panelNumber}</h4>
                </div>
                 <div className="relative bg-black">
                    <img src={message.imageUrl} alt={`Comic panel ${message.panelNumber}`} className="w-full h-auto" />
                    <div className="absolute top-2 right-2 transition-opacity opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                         <button
                            onClick={(e) => handleDownload(e, message.imageUrl)}
                            className="bg-black/60 text-white rounded-full p-2 hover:bg-black/90 mr-1"
                            aria-label="Unduh panel"
                            title="Unduh panel"
                        >
                            <DownloadIcon className="w-5 h-5" />
                        </button>
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
                <div className="p-4 bg-gray-800/70 border-t-2 border-gray-600">
                    {message.text && (
                        <div className="prose prose-invert prose-sm text-gray-200 italic max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" /> }}>
                                {message.text}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>
             {(message.generationStatus === 'pending' || message.generationStatus === 'generating') && (
                <GenerationStatusIndicator 
                    status={message.generationStatus}
                    text={message.generationText}
                    type={message.generationType}
                    progress={message.generationProgress}
                />
            )}
        </div>
    );
  }

  // Regular Message Rendering
  return (
    <div className={containerClasses} onContextMenu={onContextMenu}>
      {!isUser && <Icon className={`w-8 h-8 ${iconClasses} shrink-0 mb-2`} />}
      
      {/* Main Bubble Content */}
      <div className={clsx(
        'max-w-xl lg:max-w-3xl rounded-2xl px-5 py-3 shadow-md',
        bubbleClasses,
        isUser ? 'rounded-br-none' : 'rounded-bl-none'
      )}>
        {message.videoUrl && (
             <div className="relative group mb-2 rounded-lg overflow-hidden">
                <video src={message.videoUrl} controls autoPlay loop muted className="w-full h-auto bg-black" />
                 <button
                    onClick={(e) => handleDownload(e, message.videoUrl)}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-2 hover:bg-black/90 transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Unduh video"
                    title="Unduh video"
                >
                    <DownloadIcon className="w-5 h-5" />
                </button>
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
             <button
                onClick={(e) => handleDownload(e, message.imageUrl, message.fileInfo?.name)}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-2 hover:bg-black/90 transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Unduh gambar"
                title="Unduh gambar"
            >
                <DownloadIcon className="w-5 h-5" />
            </button>
          </div>
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
           <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" /> }}>
                    {message.text}
                </ReactMarkdown>
           </div>
        )}
      </div>
      
      {isUser && <Icon className={`w-8 h-8 ${iconClasses} shrink-0 mb-2`} />}
      
      {/* Visual Status Indicator for Model Messages */}
      {!isUser && (message.generationStatus === 'pending' || message.generationStatus === 'generating') && (
        <GenerationStatusIndicator 
            status={message.generationStatus}
            text={message.generationText}
            type={message.generationType}
            progress={message.generationProgress}
        />
      )}
    </div>
  );
};