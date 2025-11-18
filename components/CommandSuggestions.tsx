

import React from 'react';

interface Command {
  command: string;
  description: string;
  icon: React.ReactNode;
  usage?: string;
}

interface CommandSuggestionsProps {
  commands: Command[];
  onSelect: (command: string) => void;
}

export const CommandSuggestions: React.FC<CommandSuggestionsProps> = ({ commands, onSelect }) => {
  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto z-20 animate-fade-in-fast">
      <ul className="p-1">
        {commands.map((cmd) => (
          <li key={cmd.command}>
            <button
              onClick={() => onSelect(cmd.command)}
              className="w-full text-left px-3 py-2 hover:bg-purple-600/50 transition-colors rounded-md"
            >
                <div className="flex items-center">
                    {cmd.icon}
                    <div className="min-w-0">
                        <p className="font-semibold text-gray-100">{cmd.command}</p>
                        <p className="text-sm text-gray-400 truncate">{cmd.description}</p>
                        {cmd.usage && (
                            <p className="text-xs text-gray-500 font-mono mt-1 bg-gray-800/50 rounded px-1.5 py-0.5 inline-block">{cmd.usage}</p>
                        )}
                    </div>
                </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};