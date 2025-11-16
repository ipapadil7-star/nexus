
import React from 'react';
import { AiStyle } from '../types';
import { AkbarIcon } from './icons/AkbarIcon';
import { JailbreakIcon } from './icons/JailbreakIcon';
import { AssistantIcon } from './icons/AssistantIcon';
import clsx from 'clsx';

interface StyleSwitcherProps {
  currentStyle: AiStyle;
  onStyleChange: (style: AiStyle) => void;
}

const styles: { id: AiStyle; label: string; icon: React.FC<any> }[] = [
  { id: 'akbar', label: 'Akbar', icon: AkbarIcon },
  { id: 'jailbreak', label: 'Jailbreak', icon: JailbreakIcon },
  { id: 'assistant', label: 'Asisten', icon: AssistantIcon },
];

export const StyleSwitcher: React.FC<StyleSwitcherProps> = ({ currentStyle, onStyleChange }) => {
    const getStyleClasses = (style: AiStyle, isActive: boolean) => {
        if (isActive) {
            switch(style) {
                case 'akbar': return 'bg-purple-600/80 text-white';
                case 'jailbreak': return 'bg-red-600/80 text-white';
                case 'assistant': return 'bg-sky-600/80 text-white';
            }
        }
        return 'text-gray-400 hover:bg-gray-700/50 hover:text-white';
    }

    const getIconClasses = (style: AiStyle) => {
        switch(style) {
            case 'akbar': return 'text-purple-400';
            case 'jailbreak': return 'text-red-400';
            case 'assistant': return 'text-sky-400';
        }
    }

  return (
    <div className="flex items-center bg-gray-800 rounded-full p-1 border border-gray-700/50">
      {styles.map(style => (
        <button
          key={style.id}
          onClick={() => onStyleChange(style.id)}
          title={style.label}
          className={clsx(
            "flex items-center justify-center gap-2 px-3 py-1 rounded-full text-sm font-semibold transition-colors duration-200",
            getStyleClasses(style.id, currentStyle === style.id)
          )}
        >
          <style.icon className={clsx("w-5 h-5", getIconClasses(style.id), { 'text-white': currentStyle === style.id })} />
          <span className={clsx('hidden md:inline', { 'text-white': currentStyle === style.id })}>
             {style.label}
          </span>
        </button>
      ))}
    </div>
  );
};