





import React from 'react';
import { ImageIcon } from './ImageIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { AkbarIcon } from './icons/AkbarIcon';
import { VideoIcon } from './icons/VideoIcon';
import { Volume2Icon } from './icons/Volume2Icon';
import { TemplateIcon } from './icons/TemplateIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { WallpaperIcon } from './icons/WallpaperIcon';
import { FilePlusIcon } from './icons/FilePlusIcon';
import { FileSlideIcon } from './icons/FileSlideIcon';
import { TerminalIcon } from './icons/TerminalIcon';
import { AlignLeftIcon } from './icons/AlignLeftIcon';
import { BrushIcon } from './icons/BrushIcon';
import { TranslateIcon } from './icons/TranslateIcon';
import { WeatherIcon } from './icons/WeatherIcon';
import { WifiIcon } from './icons/WifiIcon';

export const WelcomeScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 animate-fade-in">
        <AkbarIcon className="w-24 h-24 text-purple-500 mb-6" />
      <h2 className="text-4xl font-bold text-gray-200 mb-2">AKBAR AI</h2>
      <p className="mb-8 max-w-lg">
        Gue bukan asisten biasa. Ngobrol, suruh gue analisis gambar, atau ciptakan karya visual dari imajinasi liar lo. Coba aja kalau berani.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl">
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
          <p className="text-sm">Gunakan <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">/gambar</code>. Tambahkan flag seperti <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">--style vaporwave</code> atau <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">--aspect 16:9</code>.</p>
        </div>
         <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
          <h3 className="font-semibold text-gray-200 flex items-center mb-2">
            <BrushIcon className="w-5 h-5 mr-2 text-pink-400"/>
            Gambar (Imagen 2)
          </h3>
          <p className="text-sm">Gunakan <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">/draw</code> untuk model canggih. Mendukung semua flag dari <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">/gambar</code>.</p>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
           <h3 className="font-semibold text-gray-200 flex items-center mb-2">
             <WallpaperIcon className="w-5 h-5 mr-2 text-teal-400"/>
            Buat Wallpaper
          </h3>
          <p className="text-sm">Gunakan <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">/wallpaper</code>. Atur rasio aspek dengan <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">--aspect 16:9</code> (desktop) atau <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">9:16</code> (ponsel).</p>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
          <h3 className="font-semibold text-gray-200 flex items-center mb-2">
             <BookOpenIcon className="w-5 h-5 mr-2 text-orange-400"/>
            Buat Komik
          </h3>
          <p className="text-sm">Gunakan <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">/komik</code> dengan ide cerita, lalu ketik <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">lanjutkan</code> untuk panel berikutnya.</p>
        </div>
         <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
          <h3 className="font-semibold text-gray-200 flex items-center mb-2">
            <TemplateIcon className="w-5 h-5 mr-2 text-green-400"/>
            Gambar Placeholder
          </h3>
          <p className="text-sm">Gunakan <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">/placeholder</code>. Kustomisasi dengan flag seperti <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">--theme corporate</code>.</p>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
          <h3 className="font-semibold text-gray-200 flex items-center mb-2">
            <VideoIcon className="w-5 h-5 mr-2 text-red-400"/>
            Buat Video
          </h3>
          <p className="text-sm">Gunakan <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">/video</code>. Tambahkan flag seperti <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">--quality fast</code>.</p>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
          <h3 className="font-semibold text-gray-200 flex items-center mb-2">
            <Volume2Icon className="w-5 h-5 mr-2 text-amber-400"/>
            Deskripsi Audio
          </h3>
          <p className="text-sm">Gunakan <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">/dengarkan</code> dan lampirkan gambar untuk mendengar deskripsi.</p>
        </div>
         <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
          <h3 className="font-semibold text-gray-200 flex items-center mb-2">
            <AlignLeftIcon className="w-5 h-5 mr-2 text-blue-400"/>
            Ringkas Konten
          </h3>
          <p className="text-sm">Gunakan <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">/summarize</code> diikuti dengan teks atau URL untuk mendapatkan ringkasan singkat.</p>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
          <h3 className="font-semibold text-gray-200 flex items-center mb-2">
            <TranslateIcon className="w-5 h-5 mr-2 text-purple-400"/>
            Terjemahkan Teks
          </h3>
          <p className="text-sm">Gunakan <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">/translate &lt;bhs&gt; [id]</code> untuk menerjemahkan pesan terakhir atau pesan dengan ID.</p>
        </div>
         <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
          <h3 className="font-semibold text-gray-200 flex items-center mb-2">
            <WeatherIcon className="w-5 h-5 mr-2 text-yellow-300"/>
            Cek Cuaca
          </h3>
          <p className="text-sm">Gunakan <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">/cuaca &lt;kota&gt;</code> untuk mendapatkan laporan cuaca terkini di lokasi tersebut.</p>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
            <h3 className="font-semibold text-gray-200 flex items-center mb-2">
                <WifiIcon className="w-5 h-5 mr-2 text-green-300"/>
                Lihat Password WiFi
            </h3>
            <p className="text-sm">Gunakan <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">/wifipass &lt;nama_wifi&gt;</code> untuk menampilkan kata sandi yang tersimpan.</p>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
          <h3 className="font-semibold text-gray-200 flex items-center mb-2">
            <FilePlusIcon className="w-5 h-5 mr-2 text-lime-400"/>
            Buat Dokumen
          </h3>
          <p className="text-sm">Gunakan <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">/buatdok &lt;format&gt;</code>. Format: <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">pdf</code>, <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">slide</code>, <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">sheet</code>.</p>
        </div>
         <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
            <h3 className="font-semibold text-gray-200 flex items-center mb-2">
                <FileSlideIcon className="w-5 h-5 mr-2 text-orange-400"/>
                Buat Presentasi
            </h3>
            <p className="text-sm">Gunakan <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">/createpresentation</code> dengan topik Anda untuk membuat file .pptx secara otomatis.</p>
        </div>
         <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
          <h3 className="font-semibold text-gray-200 flex items-center mb-2">
            <TerminalIcon className="w-5 h-5 mr-2 text-gray-400"/>
            Terminal Shell
          </h3>
          <p className="text-sm">Gunakan <code className="bg-gray-700 rounded px-1.5 py-1 text-xs font-mono">/commandline</code> untuk membuka terminal interaktif dan menjalankan perintah shell.</p>
        </div>
      </div>
    </div>
  );
};