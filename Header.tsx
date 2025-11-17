
import React, { useState, useEffect, useMemo } from 'react';
import { AkbarIcon } from './components/icons/AkbarIcon';
import { SaveIcon } from './components/icons/SaveIcon';
import { CheckIcon } from './components/icons/CheckIcon';
import { TrashIcon } from './components/icons/TrashIcon';
import clsx from 'clsx';
import { StyleSwitcher } from './components/StyleSwitcher';
import { AiStyle, Message } from './types';
import { ImageFilterPopover } from './components/ImageFilterPopover';
import { FilterIcon } from './components/icons/FilterIcon';


interface HeaderProps {
    onSaveChat: () => void;
    onRequestClearChat: () => void;
    isChatEmpty: boolean;
    aiStyle: AiStyle;
    onStyleChange: (style: AiStyle) => void;
    messages: Message[];
    activeImageFilter: string | null;
    onImageFilterChange: (style: string | null) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
    onSaveChat, 
    onRequestClearChat, 
    isChatEmpty, 
    aiStyle, 
    onStyleChange,
    messages,
    activeImageFilter,
    onImageFilterChange 
}) => {
    const [isSaved, setIsSaved] = useState(false);
    const [displayText, setDisplayText] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
    const fullText = "AKBAR AI";

    useEffect(() => {
        let i = 0;
        setIsTyping(true);
        setDisplayText(''); // Reset text on mount
        const intervalId = setInterval(() => {
            if (i < fullText.length) {
                setDisplayText(prev => prev + fullText.charAt(i));
                i++;
            } else {
                clearInterval(intervalId);
                setIsTyping(false);
            }
        }, 150); // Typing speed

        return () => clearInterval(intervalId);
    }, []);

    const handleSaveClick = () => {
        if (isChatEmpty || isSaved) return;

        onSaveChat();
        setIsSaved(true);
        setTimeout(() => {
            setIsSaved(false);
        }, 2000);
    };
    
    const availableImageStyles = useMemo(() => 
        [...new Set(messages.flatMap(m => m.imageStyle ? [m.imageStyle] : []))]
    , [messages]);


  return (
    <header className="flex items-center justify-between p-4 bg-gray-900/60 backdrop-blur-sm sticky top-0 z-10">
       <div className="flex items-center">
            <AkbarIcon className="w-8 h-8 text-purple-400 mr-3" />
            <h1 className={clsx(
                "text-xl sm:text-2xl font-bold tracking-wider text-purple-400 font-mono h-[32px]",
                { 'typing-cursor': isTyping }
            )}>
                {displayText}
            </h1>
       </div>
       <div className="flex items-center gap-2">
            <StyleSwitcher currentStyle={aiStyle} onStyleChange={onStyleChange} />
            <div className="w-px h-6 bg-gray-700 mx-2"></div>

             {availableImageStyles.length > 0 && (
                <div className="relative">
                    <button 
                        onClick={() => setIsFilterPopoverOpen(prev => !prev)}
                        title="Filter Gambar Berdasarkan Gaya"
                        className={clsx(
                            "p-2 rounded-full transition-colors",
                            {
                                "bg-purple-500/30 text-purple-200": activeImageFilter,
                                "text-purple-300 hover:bg-purple-500/20 hover:text-purple-200": !activeImageFilter
                            }
                        )}
                    >
                        <FilterIcon className="w-5 h-5" />
                    </button>
                    {isFilterPopoverOpen && (
                        <ImageFilterPopover 
                            styles={availableImageStyles}
                            activeStyle={activeImageFilter}
                            onSelectStyle={(style) => {
                                onImageFilterChange(style);
                                setIsFilterPopoverOpen(false);
                            }}
                            onClose={() => setIsFilterPopoverOpen(false)}
                        />
                    )}
                </div>
            )}


            <button 
                onClick={handleSaveClick}
                disabled={isChatEmpty || isSaved}
                title={isSaved ? "Tersimpan!" : "Simpan Chat"}
                className={clsx(
                    "p-2 rounded-full transition-all duration-200",
                    "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent",
                    {
                        'text-purple-300 hover:bg-purple-500/20 hover:text-purple-200': !isSaved,
                        'text-green-400': isSaved,
                    }
                )}
            >
                {isSaved ? <CheckIcon className="w-5 h-5" /> : <SaveIcon className="w-5 h-5" />}
            </button>
             <button 
                onClick={onRequestClearChat}
                disabled={isChatEmpty}
                title="Hapus Chat"
                className="p-2 rounded-full text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
                <TrashIcon className="w-5 h-5" />
            </button>
       </div>
    </header>
  );
};
