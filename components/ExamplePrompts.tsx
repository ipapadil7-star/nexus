import React from 'react';
import { WallpaperIcon } from './icons/WallpaperIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { FilePlusIcon } from './icons/FilePlusIcon';
import { VideoIcon } from './icons/VideoIcon';

interface ExamplePrompt {
  text: string;
  command: string;
  icon: React.ReactNode;
}

const prompts: ExamplePrompt[] = [
  {
    text: 'Buat wallpaper pemandangan damai',
    command: "/wallpaper pemandangan alam yang damai --style photorealistic --aspect 16:9",
    icon: <WallpaperIcon className="w-5 h-5 mr-3 text-teal-400 shrink-0" />
  },
  {
    text: 'Mulai komik petualangan kucing',
    command: "/komik petualangan seekor kucing pemberani di luar angkasa",
    icon: <BookOpenIcon className="w-5 h-5 mr-3 text-orange-400 shrink-0" />
  },
  {
    text: 'Buat video robot di hutan',
    command: "/video robot kuno berjalan di hutan hujan --quality fast",
    icon: <VideoIcon className="w-5 h-5 mr-3 text-red-400 shrink-0" />
  },
  {
    text: 'Buatkan ringkasan PDF',
    command: "/buatdok pdf ringkasan tentang sejarah kecerdasan buatan",
    icon: <FilePlusIcon className="w-5 h-5 mr-3 text-lime-400 shrink-0" />
  },
];

interface ExamplePromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

export const ExamplePrompts: React.FC<ExamplePromptsProps> = ({ onSelectPrompt }) => {
  return (
    <div className="mb-4 animate-fade-in-slide-up">
       <p className="text-sm text-gray-400 mb-3 text-center">Atau coba salah satu dari ini:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onSelectPrompt(prompt.command)}
            className="group flex items-center text-left p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:bg-gray-700/70 hover:border-gray-600 transition-all duration-200"
          >
            {prompt.icon}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-200">{prompt.text}</p>
              <p className="text-xs text-gray-400 truncate">{prompt.command}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
