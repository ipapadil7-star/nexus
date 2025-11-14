

import React, { useState } from 'react';
import { BotIcon } from './components/icons/BotIcon';
import { SaveIcon } from './components/icons/SaveIcon';
import { CheckIcon } from './components/icons/CheckIcon';
import { TrashIcon } from './components/icons/TrashIcon';
import clsx from 'clsx';


interface HeaderProps {
    onSaveChat: () => void;
    onRequestClearChat: () => void;
    isChatEmpty: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onSaveChat, onRequestClearChat, isChatEmpty }) => {
    const [isSaved, setIsSaved] = useState(false);

    const handleSaveClick = () => {
        if (isChatEmpty || isSaved) return;

        onSaveChat();
        setIsSaved(true);
        setTimeout(() => {
            setIsSaved(false);
        }, 2000);
    };


  return (
    <header className="flex items-center justify-between p-4 bg-gray-900/80 backdrop-blur-sm border-b border-purple-500/30 shadow-lg sticky top-0 z-10">
       <div className="flex items-center">
            <BotIcon className="w-8 h-8 text-purple-400 mr-3" />
            <h1 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 animate-background-pan">
                Nexus AI
            </h1>
       </div>
       <div className="flex items-center gap-2">
            <button 
                onClick={handleSaveClick}
                disabled={isChatEmpty || isSaved}
                className={clsx(
                    "flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 border",
                    {
                        'bg-transparent border-purple-500 text-purple-300 hover:bg-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent': !isSaved,
                        'bg-green-500/20 border-green-500 text-green-300 cursor-default': isSaved,
                    }
                )}
            >
                {isSaved ? <CheckIcon className="w-4 h-4" /> : <SaveIcon className="w-4 h-4" />}
                <span>{isSaved ? 'Tersimpan!' : 'Simpan Chat'}</span>
            </button>
             <button 
                onClick={onRequestClearChat}
                disabled={isChatEmpty}
                title="Hapus Chat"
                className="flex items-center justify-center p-2 text-sm font-semibold rounded-md transition-all duration-200 border bg-transparent border-red-500/80 text-red-400 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
                <TrashIcon className="w-4 h-4" />
            </button>
       </div>
    </header>
  );
};