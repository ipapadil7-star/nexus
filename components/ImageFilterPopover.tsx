
import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';

interface ImageFilterPopoverProps {
  styles: string[];
  activeStyle: string | null;
  onSelectStyle: (style: string | null) => void;
  onClose: () => void;
}

export const ImageFilterPopover: React.FC<ImageFilterPopoverProps> = ({ styles, activeStyle, onSelectStyle, onClose }) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={popoverRef}
      className="absolute top-full right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50 py-1 animate-fade-in-fast"
    >
      <ul>
        <li>
          <button
            onClick={() => onSelectStyle(null)}
            className={clsx(
                "w-full text-left px-3 py-1.5 text-sm font-semibold",
                !activeStyle ? "text-purple-300" : "text-gray-300 hover:bg-purple-600/50"
            )}
          >
            Tampilkan Semua
          </button>
        </li>
        <li className="my-1 border-t border-gray-700"></li>
        {styles.sort().map((style) => (
          <li key={style}>
            <button
              onClick={() => onSelectStyle(style)}
              className={clsx(
                "w-full text-left px-3 py-1.5 text-sm capitalize",
                {
                  "text-purple-300 font-semibold": activeStyle === style,
                  "text-gray-300 hover:bg-purple-600/50": activeStyle !== style
                }
              )}
            >
              {style}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
