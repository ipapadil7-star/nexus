
import React, { useState, useRef, useEffect } from 'react';
import { SendIcon } from './icons/SendIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { XIcon } from './icons/XIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import clsx from 'clsx';
import { AlertIcon } from './icons/AlertIcon';
import { getMimeType } from '../utils/fileUtils';
import { allowedImageStyles } from '../services/geminiService';
import { CommandSuggestions } from './CommandSuggestions';
import { ImageIcon } from './ImageIcon';
import { WallpaperIcon } from './icons/WallpaperIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { VideoIcon } from './icons/VideoIcon';
import { TemplateIcon } from './icons/TemplateIcon';
import { Volume2Icon } from './icons/Volume2Icon';
import { FilePlusIcon } from './icons/FilePlusIcon';
import { EditIcon } from './icons/EditIcon';
import { FileSlideIcon } from './icons/FileSlideIcon';
import { CustomCommand } from '../types';
import { BookmarkIcon } from './icons/BookmarkIcon';
import { TerminalIcon } from './icons/TerminalIcon';
import { AlignLeftIcon } from './icons/AlignLeftIcon';
import { BrushIcon } from './icons/BrushIcon';
import { TranslateIcon } from './icons/TranslateIcon';
import { WeatherIcon } from './icons/WeatherIcon';
import { WifiIcon } from './icons/WifiIcon';


interface InputBarProps {
  onSubmit: (prompt: string, imageFile: File | null) => void;
  isLoading: boolean;
  isComicMode: boolean;
  customCommands: CustomCommand[];
}

const randomHints = [
    "Contoh: /gambar rubah mekanik --style steampunk --aspect 4:3",
    "Contoh: /wallpaper hutan fantasi saat senja",
    "Contoh: /gambar astronot di mars --style cinematic --aspect 16:9",
    "Contoh: /video mobil terbang menembus awan",
    "Contoh: /placeholder Laporan Kinerja Q3 --theme corporate",
    "Contoh: /gambar kucing astronot --style cartoon",
    "Contoh: /wallpaper pemandangan kota siberpunk --aspect 9:16",
    "Contoh: /dengarkan + lampirkan gambar",
    "Contoh: /gambar kota neon --style cyberpunk",
    "Contoh: /gambar potret detail --style photorealistic --aspect 3:4",
    "Contoh: /video robot kuno berjalan di hutan --aspect 9:16",
    "Contoh: /gambar kastil melayang --style fantasy",
    "Contoh: /placeholder AI Masa Depan --style futuristic --icon brain",
    "Contoh: /video kota bawah laut --res 1080p",
    "Contoh: /video balapan di luar angkasa --quality fast",
    "Contoh: /gambar pemandangan fantasi --aspect 4:3",
    "Contoh: /gambar pahlawan super --style comicbook",
    "Contoh: /gambar potret lama --style vintage",
    "Contoh: /gambar sirkuit otak --style darkmode",
    "Contoh: /gambar pemandangan 8-bit --style pixelart",
    "Contoh: /gambar kekacauan warna --style abstract",
    "Contoh: /wallpaper robot di kota hujan --aspect 9:16",
    "Contoh: /gambar patung romawi di pantai --style vaporwave",
];

const builtInCommands = [
    { command: '/gambar', description: 'Buat gambar dari deskripsi.', icon: <ImageIcon className="w-5 h-5 mr-3 text-cyan-400"/>, usage: 'Contoh: /gambar naga api' },
    { command: '/draw', description: 'Buat gambar dengan model Imagen 2.', icon: <BrushIcon className="w-5 h-5 mr-3 text-pink-400"/>, usage: 'Contoh: /draw kucing ajaib' },
    { command: '/wallpaper', description: 'Buat wallpaper untuk desktop/ponsel.', icon: <WallpaperIcon className="w-5 h-5 mr-3 text-teal-400"/>, usage: 'Contoh: /wallpaper hutan neon --aspect 9:16' },
    { command: '/komik', description: 'Mulai sesi pembuatan komik interaktif.', icon: <BookOpenIcon className="w-5 h-5 mr-3 text-orange-400"/>, usage: 'Contoh: /komik petualangan antar galaksi' },
    { command: '/video', description: 'Buat video dari deskripsi.', icon: <VideoIcon className="w-5 h-5 mr-3 text-red-400"/>, usage: 'Contoh: /video kota bawah laut' },
    { command: '/placeholder', description: 'Buat gambar placeholder profesional.', icon: <TemplateIcon className="w-5 h-5 mr-3 text-green-400"/>, usage: 'Contoh: /placeholder Peluncuran Produk' },
    { command: '/dengarkan', description: 'Dapatkan deskripsi audio dari gambar.', icon: <Volume2Icon className="w-5 h-5 mr-3 text-amber-400"/>, usage: 'Contoh: /dengarkan + lampirkan gambar' },
    { command: '/summarize', description: 'Ringkas teks atau URL.', icon: <AlignLeftIcon className="w-5 h-5 mr-3 text-blue-400"/>, usage: 'Contoh: /summarize [teks atau URL]' },
    { command: '/translate', description: 'Terjemahkan pesan (terakhir atau dgn ID).', icon: <TranslateIcon className="w-5 h-5 mr-3 text-purple-400"/>, usage: 'Contoh: /translate jepang [id_pesan]' },
    { command: '/cuaca', description: 'Dapatkan informasi cuaca saat ini.', icon: <WeatherIcon className="w-5 h-5 mr-3 text-yellow-300"/>, usage: 'Contoh: /cuaca Jakarta' },
    { command: '/wifipass', description: 'Simulasi perintah jaringan WiFi.', icon: <WifiIcon className="w-5 h-5 mr-3 text-green-300"/>, usage: 'Contoh: /wifipass list' },
    { command: '/buatdok', description: 'Buat dokumen (pdf, slide, sheet).', icon: <FilePlusIcon className="w-5 h-5 mr-3 text-lime-400"/>, usage: 'Contoh: /buatdok pdf laporan bulanan' },
    { command: '/buatppt', description: 'Buat presentasi PowerPoint kaya visual.', icon: <FileSlideIcon className="w-5 h-5 mr-3 text-orange-400"/>, usage: 'Contoh: /buatppt rencana bisnis Q3' },
    { command: '/createpresentation', description: 'Buat presentasi PowerPoint dengan gambar & video.', icon: <FileSlideIcon className="w-5 h-5 mr-3 text-orange-400"/>, usage: 'Contoh: /createpresentation Rencana Peluncuran Produk' },
    { command: '/edit', description: 'Edit panel komik (terakhir atau dgn ID).', icon: <EditIcon className="w-5 h-5 mr-3 text-indigo-400"/>, usage: 'Contoh: /edit [panel_id]' },
    { command: '/perintahku', description: 'Kelola perintah custom pribadi.', icon: <BookmarkIcon className="w-5 h-5 mr-3 text-yellow-400"/>, usage: '/perintahku tambah nama "teks"' },
    { command: '/commandline', description: 'Buka antarmuka terminal shell.', icon: <TerminalIcon className="w-5 h-5 mr-3 text-gray-400"/>, usage: 'Membuka terminal AKBAR AI' },
];

export const InputBar: React.FC<InputBarProps> = ({ onSubmit, isLoading, isComicMode, customCommands }) => {
  const [prompt, setPrompt] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [hint, setHint] = useState(() => randomHints[Math.floor(Math.random() * randomHints.length)]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState(builtInCommands);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fileProgress, setFileProgress] = useState<number>(0);
  const fileReaderRef = useRef<FileReader | null>(null);

  const allCommands = React.useMemo(() => {
    const customCommandList = customCommands.map(cmd => ({
        command: `/${cmd.name}`,
        description: `Perintah custom: "${cmd.text.substring(0, 40)}${cmd.text.length > 40 ? '...' : ''}"`,
        icon: <BookmarkIcon className="w-5 h-5 mr-3 text-yellow-400" />,
        usage: `Menjalankan: "${cmd.text}"`
    }));
    return [...builtInCommands, ...customCommandList];
  }, [customCommands]);

  useEffect(() => {
    // Cycle through hints periodically
    const hintInterval = setInterval(() => {
      setHint(randomHints[Math.floor(Math.random() * randomHints.length)]);
    }, 7000); // Change every 7 seconds

    return () => clearInterval(hintInterval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (showSuggestions && containerRef.current && !containerRef.current.contains(event.target as Node)) {
            setShowSuggestions(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
}, [showSuggestions]);


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
      const supportedMimeTypes = [
          'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 
          'image/gif', 'image/bmp', 'image/svg+xml', 'image/tiff',
          'application/pdf'
      ];
      
      if (!mimeType || !supportedMimeTypes.includes(mimeType)) {
           setFileError(`Tipe file tidak didukung. Gue cuma nerima: JPG, PNG, WEBP, HEIC, GIF, BMP, SVG, TIFF, dan PDF. Jangan coba-coba yang lain.`);
           if (fileInputRef.current) fileInputRef.current.value = "";
           return;
      }
      setAttachedFile(file);

      // Reset and start file reader progress
      setFileProgress(0);
      fileReaderRef.current = new FileReader();
      
      fileReaderRef.current.onprogress = (e) => {
          if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              setFileProgress(progress);
          }
      };
      
      fileReaderRef.current.onloadend = () => {
          setFileProgress(100); // Ensure it completes to 100%
          setTimeout(() => setFileProgress(0), 500); // Hide progress bar after a short delay
          fileReaderRef.current = null;
      };

      fileReaderRef.current.onerror = () => {
          setFileError("Waduh, gagal baca file. Coba lagi atau ganti file lain.");
          setFileProgress(0);
          fileReaderRef.current = null;
      };
      
      // We just read it to show progress, not to store it in memory here
      fileReaderRef.current.readAsArrayBuffer(file);
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (fileReaderRef.current) {
        fileReaderRef.current.abort();
        fileReaderRef.current = null;
    }
    setFileProgress(0);
  };

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (isLoading || fileProgress > 0 && fileProgress < 100) return;
    const finalPrompt = isComicMode ? 'lanjutkan' : prompt.trim();
    if (!finalPrompt && !attachedFile) return;

    onSubmit(finalPrompt, attachedFile);
    setPrompt('');
    handleRemoveFile();
    setShowSuggestions(false);
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [prompt]);
  
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setPrompt(value);
    
    if (value.startsWith('/')) {
        setShowSuggestions(true);
        const commandInput = value.substring(1).toLowerCase();
        const matchingCommands = allCommands.filter(cmd => 
            cmd.command.substring(1).toLowerCase().startsWith(commandInput)
        );
        setFilteredCommands(matchingCommands);
    } else {
        setShowSuggestions(false);
    }
  };

  const handleSuggestionSelect = (command: string) => {
    setPrompt(command + ' ');
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const isReadingFile = fileProgress > 0 && fileProgress < 100;

  return (
    <div ref={containerRef} className="relative">
      {showSuggestions && (
        <CommandSuggestions 
            commands={filteredCommands}
            onSelect={handleSuggestionSelect}
        />
      )}
      <form onSubmit={handleSubmit} className="relative">
        <div className={clsx(
          "bg-gray-800 border rounded-xl shadow-lg transition-all duration-200",
          {
            "border-purple-500 animate-pulse-border": isLoading,
            "border-gray-600": !isLoading
          }
        )}>
          {attachedFile && (
            <div className="p-3 border-b border-gray-700">
              <div className="flex items-center justify-between bg-gray-700/50 p-2 rounded-md">
                <div className="flex items-center min-w-0">
                  <DocumentIcon className="w-5 h-5 mr-3 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-200 truncate">{attachedFile.name}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1 rounded-full text-gray-400 hover:bg-white/10 hover:text-white"
                  aria-label="Remove file"
                  disabled={isReadingFile}
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
              {fileProgress > 0 && (
                <div className="mt-2">
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div 
                            className="bg-purple-500 h-1.5 rounded-full transition-all duration-150" 
                            style={{ width: `${fileProgress}%` }}
                        ></div>
                    </div>
                     <p className="text-xs text-gray-400 text-center mt-1">
                       {isReadingFile ? `Membaca file... ${fileProgress}%` : 'Selesai!'}
                    </p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-end p-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 mr-2 rounded-full text-gray-400 hover:text-purple-400 hover:bg-purple-500/20 transition-colors icon-button-glow disabled:opacity-50"
              aria-label="Attach file"
              disabled={isLoading || isReadingFile}
            >
              <PaperclipIcon className="w-5 h-5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <textarea
              ref={textareaRef}
              value={isComicMode ? 'Ketik "lanjutkan" atau mulai sesi baru...' : prompt}
              onChange={handlePromptChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !showSuggestions) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={isComicMode ? '' : hint}
              className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 resize-none border-none focus:ring-0 max-h-48"
              rows={1}
              disabled={isLoading || isComicMode || isReadingFile}
            />
            <button
              type="submit"
              className="p-2 ml-2 rounded-full text-white bg-purple-600 hover:bg-purple-500 transition-colors icon-button-glow disabled:opacity-50 disabled:bg-gray-600"
              disabled={isLoading || (!prompt.trim() && !attachedFile && !isComicMode) || isReadingFile}
              aria-label="Send message"
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </form>
       {fileError && (
        <div className="mt-2 text-sm text-red-400 flex items-center gap-2 animate-fade-in-fast">
            <AlertIcon className="w-4 h-4 shrink-0" />
            <span>{fileError}</span>
        </div>
      )}
    </div>
  );
};