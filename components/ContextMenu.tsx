
import React, { useEffect, useRef } from 'react';

interface ContextMenuOption {
  label: string;
  action: () => void;
  icon: React.ReactNode;
}

interface ContextMenuProps {
  x: number;
  y: number;
  options: ContextMenuOption[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, options, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  if (options.length === 0) {
    onClose();
    return null;
  }

  const handleActionClick = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={menuRef}
        style={{ top: y, left: x }}
        className="fixed bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50 py-1 w-40 animate-fade-in-fast"
      >
        <ul>
          {options.map((option, index) => (
            <li key={index}>
              <button
                onClick={() => handleActionClick(option.action)}
                className="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-purple-600/50 flex items-center transition-colors"
              >
                {option.icon}
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};
