





import React, { useState, useRef } from 'react';
import { SendIcon } from './icons/SendIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { XIcon } from './icons/XIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import clsx from 'clsx';
import { ConfirmationDialog } from './ConfirmationDialog';

interface InputBarProps {
  onSubmit: (prompt: string, imageFile: File | null) => void;
  isLoading: boolean;
}

const randomHints = [
    "Contoh: /gambar rubah mekanik --style steampunk",
    "Contoh: /gambar astronot di mars --style cinematic",
    "Contoh: /video mobil terbang menembus awan",
    "Contoh: /gambar kucing astronot --style cartoon",
    "Contoh: /dengarkan + lampirkan gambar",
    "Contoh: /gambar kota neon --style cyberpunk",
    "Contoh: /video robot kuno berjalan di hutan --aspect 9:16",
    "Contoh: /gambar kastil melayang --style fantasy",
    "Contoh: /video kota bawah laut --res 1080p",
    "Contoh: /video balapan di luar angkasa --res 1080p --quality high",
    "Contoh: /gambar pemandangan fantasi --width 1920 --height 1080",
    "Contoh: /gambar pahlawan super --style comicbook",
    "Contoh: /gambar potret lama --style vintage",
    "Contoh: /gambar sirkuit otak --style darkmode",
    "Contoh: /gambar pemandangan 8-bit --style pixelart",
    "Contoh: /gambar kekacauan warna --style abstract",
];

export const InputBar: React.FC<InputBarProps> = ({ onSubmit, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hint] = useState(() => randomHints[Math.floor(Math.random() * randomHints.length)]);
  const [fileForConfirmation, setFileForConfirmation] = useState<File | null>(null);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        setFileForConfirmation(file);
        if (event.target) event.target.value = ''; // Reset input
        return;
      }
      setAttachedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(file.name);
      }
    }
  };

  const removeFile = () => {
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

  const handleConfirmFileUpload = () => {
    if (fileForConfirmation) {
        setAttachedFile(fileForConfirmation);
        setFilePreview(fileForConfirmation.name);
        setFileForConfirmation(null);
    }
  };

  const handleCancelFileUpload = () => {
    setFileForConfirmation(null);
  };

  const placeholderText = attachedFile 
    ? "Tambahkan komentar tentang file... (opsional)" 
    : "Ketik pesan atau '/gambar' atau '/video'...";

  const showCommandHint = prompt.trim().toLowerCase() === '/gambar' || prompt.trim().toLowerCase() === '/video';
  const isTyping = prompt.length > 0 && !isLoading;

  return (
    <>
      <div className={clsx(
          "bg-gray-800 rounded-2xl p-2.5 shadow-2xl border border-gray-700/50 transition-all duration-300",
          { 'animate-pulse-border': isTyping }
        )}>
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
            accept="*/*"
          />
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
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
      {fileForConfirmation && (
        <ConfirmationDialog
            title="Konfirmasi Tipe File"
            message={`Tipe file "${fileForConfirmation.name}" tidak umum. Nexus mungkin tidak bisa membacanya dengan benar. Tetap lanjutkan?`}
            onConfirm={handleConfirmFileUpload}
            onCancel={handleCancelFileUpload}
            confirmLabel="Ya, Proses Saja"
            cancelLabel="Batal"
        />
      )}
    </>
  );
};