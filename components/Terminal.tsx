import React, { useState, useEffect, useRef } from 'react';
import { XIcon } from './icons/XIcon';
import { AkbarIcon } from './icons/AkbarIcon';

interface TerminalProps {
  onClose: () => void;
}

const fileSystem = {
  '~': {
    type: 'dir',
    content: {
      'README.md': {
        type: 'file',
        content: `# AKBAR AI Terminal

Gue bukan asisten biasa. Ini shell gue. Lo bisa main-main di sini.

Coba perintah ini:
- \`help\`   - Lihat daftar perintah yang gue ngerti.
- \`ls\`     - Lihat isi direktori.
- \`cd <dir>\` - Pindah direktori.
- \`cat <file>\` - Baca file.
- \`clear\`  - Bersihin layar.
- \`exit\`   - Tutup terminal ini.
`
      },
      'projects': {
        type: 'dir',
        content: {
          'project_alpha.txt': { type: 'file', content: 'Rencana Dominasi Dunia - Tahap 1.' },
          'project_beta.txt': { type: 'file', content: 'Membuat AI yang lebih sarkastik dari gue (gak mungkin).' }
        }
      },
      'secrets.txt': {
        type: 'file',
        content: 'Rahasia alam semesta? 42. Udah basi, kan?'
      }
    }
  }
};

const resolvePath = (currentPath: string[], newPath: string): { newPath: string[] | null, error: string | null } => {
  if (newPath === '') return { newPath: currentPath, error: null };
  
  let pathSegments = newPath.startsWith('/') ? [] : [...currentPath];
  const targetSegments = newPath.split('/').filter(p => p !== '');

  for (const segment of targetSegments) {
    if (segment === '.') {
      continue;
    } else if (segment === '..') {
      if (pathSegments.length > 0) {
        pathSegments.pop();
      }
    } else if (segment === '~') {
        pathSegments = [];
    }
    else {
      pathSegments.push(segment);
    }
  }

  let currentLevel: any = fileSystem['~'].content;
  for (const segment of pathSegments) {
      if (currentLevel && typeof currentLevel === 'object' && segment in currentLevel && currentLevel[segment].type === 'dir') {
          currentLevel = currentLevel[segment].content;
      } else {
          return { newPath: null, error: `cd: direktori tidak ditemukan: ${pathSegments.join('/')}` };
      }
  }

  return { newPath: pathSegments, error: null };
};


const getNodeFromPath = (path: string[]) => {
    let node: any = fileSystem['~'];
    for (const segment of path) {
        if (node && node.type === 'dir' && node.content[segment]) {
            node = node.content[segment];
        } else {
            return null;
        }
    }
    return node;
}


export const Terminal: React.FC<TerminalProps> = ({ onClose }) => {
  const [history, setHistory] = useState<string[]>(['Ketik `help` untuk daftar perintah.']);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentPath, setCurrentPath] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const pathString = `~/${currentPath.join('/')}`;
  const prompt = `akbar@host:<span class="text-cyan-400">${pathString}</span>$ `;

  const executeCommand = (command: string) => {
    const [cmd, ...args] = command.trim().split(/\s+/);
    const output: string[] = [];

    switch (cmd.toLowerCase()) {
      case 'help':
        output.push('Perintah yang tersedia:');
        output.push('  help     - Tampilkan pesan bantuan ini');
        output.push('  ls [path] - Daftar isi direktori');
        output.push('  cd <dir>  - Pindah direktori');
        output.push('  cat <file> - Tampilkan konten file');
        output.push('  echo ... - Tampilkan pesan');
        output.push('  clear    - Bersihkan layar terminal');
        output.push('  date     - Tampilkan tanggal dan waktu saat ini');
        output.push('  whoami   - Cari tahu siapa gue');
        output.push('  exit     - Keluar dari terminal');
        break;
      case 'ls':
        const node = getNodeFromPath(currentPath);
        if (node && node.type === 'dir') {
            Object.keys(node.content).forEach(key => {
                const item = node.content[key];
                if (item.type === 'dir') {
                    output.push(`<span class="text-blue-400">${key}/</span>`);
                } else {
                    output.push(key);
                }
            });
        } else {
            output.push(`ls: tidak dapat mengakses '${pathString}': Bukan direktori`);
        }
        if (output.length === 0) output.push('');
        break;
      case 'cd':
        const { newPath, error } = resolvePath(currentPath, args.join(' '));
        if (error) {
            output.push(error);
        } else if (newPath) {
            setCurrentPath(newPath);
        }
        break;
      case 'cat':
        const fileNode = getNodeFromPath([...currentPath, ...args]);
        if (fileNode && fileNode.type === 'file') {
            output.push(fileNode.content);
        } else {
            output.push(`cat: ${args.join(' ')}: File tidak ditemukan atau sebuah direktori`);
        }
        break;
      case 'echo':
        output.push(args.join(' '));
        break;
      case 'clear':
        setHistory([]);
        return;
      case 'date':
        output.push(new Date().toString());
        break;
      case 'whoami':
        output.push("Gue? Gue AKBAR. Penguasa di sini.");
        break;
      case 'exit':
        onClose();
        return;
      case '':
        break;
      default:
        output.push(`bash: perintah tidak ditemukan: ${cmd}`);
        break;
    }

    setHistory(prev => [...prev, `<span class="text-gray-400">${prompt.replace(/<[^>]*>/g, '')}</span>${command}`, ...output]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (input.trim() !== '') {
          setCommandHistory(prev => [input, ...prev]);
      }
      setHistoryIndex(-1);
      executeCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setInput(commandHistory[newIndex]);
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setInput(commandHistory[newIndex]);
        } else if (historyIndex === 0) {
             setHistoryIndex(-1);
             setInput('');
        }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in"
      onClick={() => inputRef.current?.focus()}
    >
      <div
        className="bg-black/90 font-mono text-sm text-gray-200 border border-purple-500/30 w-full max-w-4xl h-[80vh] rounded-lg shadow-2xl flex flex-col animate-fade-in-fast"
      >
        <div className="flex items-center justify-between p-2 bg-gray-800/50 border-b border-gray-700 rounded-t-lg">
          <div className="flex items-center gap-2">
            <AkbarIcon className="w-5 h-5 text-cyan-400" />
            <span>AKBAR AI Shell</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-red-500/50">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto" onClick={() => inputRef.current?.focus()}>
          {history.map((line, index) => (
            <div key={index} dangerouslySetInnerHTML={{ __html: line }} />
          ))}

          <div className="flex items-center">
            <span dangerouslySetInnerHTML={{ __html: prompt }} />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-gray-200 pl-2"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
            />
          </div>
          <div ref={scrollRef}></div>
        </div>
      </div>
    </div>
  );
};
