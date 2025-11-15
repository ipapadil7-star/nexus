import React, { useState, useRef } from 'react';
import { SendIcon } from './icons/SendIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { XIcon } from './icons/XIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import clsx from 'clsx';
import { AlertIcon } from './icons/AlertIcon';
import { getMimeType } from '../utils/fileUtils';
import { allowedImageStyles } from '../services/geminiService';


interface InputBarProps {
  onSubmit: (prompt: string, imageFile: File | null) => void;
  isLoading: boolean;
}

const randomHints = [
    "Contoh: /gambar rubah mekanik --style steampunk",
    "Contoh: /gambar astronot di mars --style cinematic",
    "Contoh: /video mobil terbang menembus awan",
    "Contoh: /placeholder Laporan Kinerja Q3 --theme corporate",
    "Contoh: /gambar kucing astronot --style cartoon",
    "Contoh: /dengarkan + lampirkan gambar",
    "Contoh: /gambar kota neon --style cyberpunk",
    "Contoh: /video robot kuno berjalan di hutan --aspect 9:16",
    "Contoh: /gambar kastil melayang --style fantasy",
    "Contoh: /placeholder AI Masa Depan --style futuristic --icon brain",
    "Contoh: /video kota bawah laut --res 1080p",
    "Contoh: /video balapan di luar angkasa --quality fast",
    "Contoh: /gambar pemandangan fantasi --width 1920 --height 1080",
    "Contoh: /gambar pahlawan super --style comicbook",
    "Contoh: /gambar potret lama --style vintage",
    "Contoh: /gambar sirkuit otak --style darkmode",
    "Contoh: /gambar pemandangan 8-bit --style pixelart",
    "Contoh: /gambar kekacauan warna --style abstract",
    "Contoh: /gambar patung romawi di pantai --style vaporwave",
];

export const InputBar: React.FC<InputBarProps> = ({ onSubmit, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [hint] = useState(() => randomHints[Math.floor(Math.random() * randomHints.length)]);
  const [fileError, setFileError] = useState<string | null>(null);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = event.target.files?.[0];
    if (file) {
      const MAX_FILE_SIZE_MB = 20;
      const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

      if (file.size > MAX_FILE_SIZE_BYTES) {
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
        setFileError(`File lo kegedean (${fileSizeMB}MB). Batas maksimalnya ${MAX_FILE_SIZE_MB}MB. Cari yang lebih kecil.`);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const mimeType = getMimeType(file.name);
      const supportedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];
      
      if (!mimeType || !supportedMimeTypes.includes(mimeType)) {
           setFileError(`Tipe file tidak didukung. Gue cuma nerima: JPG, PNG, WEBP, HEIC, dan PDF. Jangan coba-coba yang lain.`);
           if (fileInputRef.current) fileInputRef.current.value = "";
           return;
      }
      
      setAttachedFile(file);
      if (mimeType.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else { // PDF
        setFilePreview(file.name);
      }
    }
     if (event.target) {
        event.target.value = '';
    }
  };

  const removeFile = () => {
    setFileError(null);
    setAttachedFile(null);
    setFilePreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    if (isLoading || (!prompt.trim() && !attachedFile)) return;
    onSubmit(prompt, attachedFile);
    setPrompt('');
    removeFile();
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          handleSubmit();
      }
  };

  const handleStyleSelect = (style: string) => {
    let newPrompt = prompt;
    const styleRegex = /--style\s+(\S+)/;

    if (styleRegex.test(newPrompt)) {
        newPrompt = newPrompt.replace(styleRegex, `--style ${style}`);
    } else {
        const commandPart = "/gambar";
        const trimmedPrompt = newPrompt.trim();
        if (trimmedPrompt === commandPart) {
             newPrompt = `${commandPart} `;
        }
        newPrompt = `${newPrompt.trim()} --style ${style} `;
    }
    
    setPrompt(newPrompt);
    textareaRef.current?.focus();
  };

  const placeholderText = attachedFile 
    ? "Tambahkan komentar tentang file... (opsional)" 
    : "Ketik pesan atau '/gambar' atau '/video'...";

  const showCommandHint = prompt.trim().toLowerCase() === '/gambar' || prompt.trim().toLowerCase() === '/video';
  const showStyleSelector = prompt.trim().toLowerCase().startsWith('/gambar');
  const currentStyleMatch = prompt.match(/--style\s+(\S+)/);
  const currentStyle = currentStyleMatch ? currentStyleMatch[1].toLowerCase() : null;
  const isTyping = prompt.length > 0 && !isLoading;

  return (
    <>
      <div className={clsx(
          "bg-gray-800 rounded-2xl p-2.5 shadow-2xl border border-gray-700/50 transition-all duration-300",
          { 'animate-pulse-border': isTyping }
        )}>
        {fileError && (
          <div className="mb-2 bg-red-900/40 border border-red-500/50 rounded-lg p-2 flex items-center justify-between animate-fade-in">
              <div className="flex items-center min-w-0">
                  <AlertIcon className="w-5 h-5 text-red-400 shrink-0"/>
                  <p className="text-red-300 text-sm ml-3 truncate" title={fileError}>{fileError}</p>
              </div>
              <button
                  onClick={() => setFileError(null)}
                  className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors shrink-0 ml-2"
                  aria-label="Tutup"
              >
                  <XIcon className="w-4 h-4" />
              </button>
          </div>
        )}
        {filePreview && (
          <div 
              className="relative inline-block mb-2 rounded-lg overflow-hidden border border-gray-600 transition-transform duration-200 ease-in-out hover:scale-105"
              title={attachedFile?.name}
            >
              {filePreview.startsWith('data:image') ? (
                  <img src={filePreview} alt="Pratinjau file" className="w-24 h-24 object-cover" />
              ) : (
                  <div className="w-auto max-w-xs h-24 p-2 flex items-center justify-center bg-gray-700">
                      <DocumentIcon className="w-8 h-8 text-gray-400 shrink-0" />
                      <p className="text-sm text-gray-300 ml-2 truncate">{filePreview}</p>
                  </div>
              )}
              <button
                  onClick={removeFile}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/80 transition-colors z-10"
                  aria-label="Hapus file"
              >
                  <XIcon className="w-4 h-4" />
              </button>
          </div>
        )}
         {showStyleSelector && (
          <div className="mb-2 animate-fade-in-slide-up">
              <p className="text-xs text-gray-400 mb-2 px-1">Pilih gaya (opsional):</p>
              <div className="flex overflow-x-auto space-x-2 pb-2">
                  {allowedImageStyles.map(style => (
                      <button 
                          key={style}
                          onClick={() => handleStyleSelect(style)}
                          className={clsx(
                              "px-3 py-1 text-sm rounded-full border transition-colors whitespace-nowrap",
                              {
                                  "bg-purple-600 border-purple-500 text-white": currentStyle === style,
                                  "bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500": currentStyle !== style,
                              }
                          )}
                      >
                         {style.charAt(0).toUpperCase() + style.slice(1)}
                      </button>
                  ))}
              </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-purple-400 transition-colors shrink-0"
            disabled={isLoading}
            aria-label="Lampirkan file"
          >
            <PaperclipIcon className="w-6 h-6" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
          />
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (fileError) setFileError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholderText}
            className="w-full bg-transparent resize-none focus:outline-none text-gray-200 placeholder-gray-500 max-h-32"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSubmit}
            className="p-2 rounded-full bg-purple-600 text-white hover:bg-purple-500 transition-colors disabled:bg-purple-800 disabled:cursor-not-allowed shrink-0"
            disabled={isLoading || (!prompt.trim() && !attachedFile)}
            aria-label="Kirim"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </div>
        {showCommandHint && (
          <div className="px-3 pt-2 text-xs text-gray-400">
            <p>Ketik deskripsi... <span className="text-gray-500">{hint}</span></p>
          </div>
        )}
      </div>
    </>
  );
};
