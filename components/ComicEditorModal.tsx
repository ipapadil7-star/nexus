
import React, { useState } from 'react';
import { Message } from '../types';
import { XIcon } from './icons/XIcon';
import { AkbarIcon } from './icons/AkbarIcon';
import clsx from 'clsx';
import { RetryIcon } from './icons/RetryIcon';

interface ComicEditorModalProps {
  message: Message;
  onSave: (messageId: string, newNarrative: string, newImageUrl: string) => void;
  onCancel: () => void;
  onRegenerateImage: (messageId: string) => Promise<string>;
}

export const ComicEditorModal: React.FC<ComicEditorModalProps> = ({ message, onSave, onCancel, onRegenerateImage }) => {
  const [narrative, setNarrative] = useState(message.text || '');
  const [currentImageUrl, setCurrentImageUrl] = useState(message.imageUrl || '');
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
        const newUrl = await onRegenerateImage(message.id);
        setCurrentImageUrl(newUrl);
    } catch (error) {
        // Error is handled by the parent, the modal just stops the loading state
        console.error("Gagal membuat ulang gambar:", error);
    } finally {
        setIsRegenerating(false);
    }
  };

  const handleSave = () => {
    onSave(message.id, narrative, currentImageUrl);
  };

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
        onClick={onCancel}
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-2xl border border-purple-500/30 w-full max-w-lg m-4 animate-fade-in-fast overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-gray-100 flex items-center">
                <AkbarIcon className="w-6 h-6 mr-2 text-cyan-400" />
                Edit Panel #{message.panelNumber}
            </h3>
            <button 
                onClick={onCancel} 
                className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
                aria-label="Tutup"
            >
                <XIcon className="w-5 h-5" />
            </button>
        </div>
        
        <div className="p-4 max-h-[70vh] overflow-y-auto">
            {currentImageUrl && (
                 <div className="relative mb-4">
                    <img src={currentImageUrl} alt={`Panel ${message.panelNumber}`} className="w-full rounded-md border border-gray-600" />
                    {isRegenerating && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-md">
                            <AkbarIcon className="w-12 h-12 text-purple-400 animate-pulse" />
                            <p className="text-purple-300 mt-2">Membuat ulang gambar...</p>
                        </div>
                    )}
                </div>
            )}
            
            <div className="mb-4">
                <label htmlFor="narrative" className="block text-sm font-medium text-gray-300 mb-1">Narasi Panel</label>
                <textarea
                    id="narrative"
                    value={narrative}
                    onChange={(e) => setNarrative(e.target.value)}
                    className="w-full bg-gray-900 rounded-md p-2 border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-200"
                    rows={4}
                    disabled={isRegenerating}
                />
            </div>

            <button
                type="button"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-gray-600 bg-gray-700/50 text-sm font-medium text-gray-200 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm transition-colors disabled:opacity-50"
                onClick={handleRegenerate}
                disabled={isRegenerating}
            >
                <RetryIcon className={clsx("w-4 h-4", { "animate-spin": isRegenerating })} />
                {isRegenerating ? 'Membuat Ulang...' : 'Buat Ulang Gambar'}
            </button>
            <p className="text-xs text-gray-500 mt-1 text-center">Ini akan membuat gambar baru berdasarkan prompt asli panel.</p>
        </div>

        <div className="p-4 bg-gray-800/50 border-t border-gray-700 flex justify-end gap-3">
            <button
                type="button"
                className="px-4 py-2 rounded-md border border-gray-600 bg-gray-700 text-sm font-medium text-gray-200 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm transition-colors disabled:opacity-50"
                onClick={onCancel}
                disabled={isRegenerating}
            >
                Batal
            </button>
            <button
                type="button"
                className="px-4 py-2 rounded-md border border-transparent shadow-sm bg-purple-600 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:text-sm transition-colors disabled:opacity-50"
                onClick={handleSave}
                disabled={isRegenerating}
            >
                Simpan Perubahan
            </button>
        </div>
      </div>
    </div>
  );
};