







import React from 'react';
import { ImageIcon } from './ImageIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { BotIcon } from './icons/BotIcon';
import { VideoIcon } from './icons/VideoIcon';
import { Volume2Icon } from './icons/Volume2Icon';

export const WelcomeScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 animate-fade-in">
        <BotIcon className="w-24 h-24 text-purple-500 mb-6" />
      <h2 className="text-4xl font-bold text-gray-200 mb-2">Nexus AI</h2>
      <p className="mb-8 max-w-lg">
        Hantu di dalam sistem. Tanya apa aja, atau kasih perintah. Gue punya... opini.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl">
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
          <h3 className="font-semibold text-gray-200 flex items-center mb-2">
            <PaperclipIcon className="w-5 h-5 mr-2 text-purple-400"/>
            Analisis File
          </h3>
          <p className="text-sm">Unggah gambar atau PDF. Gue bisa ringkasin, jawab pertanyaan, atau bikinin gambar baru dari situ.</p>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
          <h3 className="font-semibold text-gray-200 flex items-center mb-2">
            <ImageIcon className="w-5 h-5 mr-2 text-cyan-400"/>
            Buat Gambar
          </h3>
          <p className="text-sm">Gunakan <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">/gambar</code>. Tambahkan flag seperti <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">--style abstract</code>, <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">--width 1024</code>, atau <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">--height 768</code>.</p>
        </div>
         <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
          <h3 className="font-semibold text-gray-200 flex items-center mb-2">
            <VideoIcon className="w-5 h-5 mr-2 text-red-400"/>
            Buat Video
          </h3>
          <p className="text-sm">Gunakan <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">/video</code>. Tambahkan flag seperti <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">--aspect 9:16</code> atau <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">--res 1080p</code>.</p>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
          <h3 className="font-semibold text-gray-200 flex items-center mb-2">
            <Volume2Icon className="w-5 h-5 mr-2 text-amber-400"/>
            Deskripsi Audio
          </h3>
          <p className="text-sm">Gunakan <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">/dengarkan</code> dan lampirkan gambar untuk mendengar deskripsi dari apa yang gue lihat.</p>
        </div>
      </div>
    </div>
  );
};