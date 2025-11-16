
import React, { useState } from 'react';
import { allowedImageStyles } from '../services/geminiService';
import clsx from 'clsx';

interface StyleSelectorProps {
  onSelect: (style: string) => void;
  isLoading: boolean;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({ onSelect, isLoading }) => {
  const [selected, setSelected] = useState<string|null>(null);

  const handleClick = (style: string) => {
    if (isLoading || selected) return;
    setSelected(style);
    onSelect(style);
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {allowedImageStyles.map(style => (
        <button
          key={style}
          onClick={() => handleClick(style)}
          disabled={isLoading || !!selected}
          className={clsx(
            "px-4 py-2 text-sm font-semibold rounded-lg border transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
            {
              'bg-purple-600 border-purple-500 text-white': selected === style,
              'bg-gray-600 border-gray-500 text-gray-200 hover:bg-purple-600 hover:border-purple-500 hover:text-white transform hover:scale-105': selected !== style
            }
          )}
        >
          {style.charAt(0).toUpperCase() + style.slice(1)}
        </button>
      ))}
    </div>
  );
};