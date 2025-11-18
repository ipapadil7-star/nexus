
import React from 'react';
import { AiStyle } from '../types';
import { XIcon } from './icons/XIcon';
import { AkbarIcon } from './icons/AkbarIcon';
import { getSystemInstruction } from '../services/geminiService';
import { JailbreakIcon } from './icons/JailbreakIcon';
import { AssistantIcon } from './icons/AssistantIcon';

interface SystemPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiStyle: AiStyle;
}

export const SystemPromptModal: React.FC<SystemPromptModalProps> = ({ isOpen, onClose, aiStyle }) => {
  if (!isOpen) return null;

  const instruction = getSystemInstruction(aiStyle);
  
  const styleInfo = {
      akbar: { Icon: AkbarIcon, title: "AKBAR AI Directives", color: "text-purple-400" },
      jailbreak: { Icon: JailbreakIcon, title: "Jailbreak Protocols", color: "text-red-400" },
      assistant: { Icon: AssistantIcon, title: "Assistant Guidelines", color: "text-sky-400" },
  }[aiStyle];

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
        onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-2xl border border-purple-500/30 w-full max-w-2xl m-4 animate-fade-in-fast overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '85vh' }}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700 shrink-0">
            <h3 className={`text-lg font-semibold flex items-center ${styleInfo.color}`}>
                <styleInfo.Icon className="w-6 h-6 mr-3" />
                {styleInfo.title}
            </h3>
            <button 
                onClick={onClose} 
                className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                aria-label="Tutup"
            >
                <XIcon className="w-5 h-5" />
            </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <p className="text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
              {instruction}
          </p>
        </div>

        <div className="p-3 bg-gray-800/50 border-t border-gray-700 flex justify-end shrink-0">
            <button
                type="button"
                className="px-4 py-2 rounded-md border border-gray-600 bg-gray-700 text-sm font-medium text-gray-200 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                onClick={onClose}
            >
                Tutup
            </button>
        </div>
      </div>
    </div>
  );
};
