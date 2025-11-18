import React, { useState, useRef, useEffect, useMemo } from 'react';
import { InputBar } from './components/InputBar';
import { MessageList } from './components/MessageList';
import { Header } from './Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Message, Role, FileInfo, AiStyle, CustomCommand } from './types';
import { createChatSession, continueChat, generateImage, startVideoGeneration, pollVideoStatus, generateImageAudioDescription, generatePlaceholderImage, startComicSession, continueComic, allowedImageStyles, generateWallpaper, generateDocument, summarizeContent, translateText, getCurrentWeather, getWifiPassword } from './services/geminiService';
import type { Chat, ComicPanel } from './services/geminiService';
import { fileToBase64, getMimeType, downloadFile, downloadImageWithMetadata } from './utils/fileUtils';
import { ContextMenu } from './components/ContextMenu';
import { CopyIcon } from './components/icons/CopyIcon';
import { RetryIcon } from './components/icons/RetryIcon';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { AlertIcon } from './components/icons/AlertIcon';
import { XIcon } from './components/icons/XIcon';
import { LinkIcon } from './components/icons/LinkIcon';
import { ImageIcon } from './components/ImageIcon';
import { ComicEditorModal } from './components/ComicEditorModal';
import { CheckIcon } from './components/icons/CheckIcon';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { Part } from '@google/genai';
import { SystemPromptModal } from './components/SystemPromptModal';
import { EditIcon } from './components/icons/EditIcon';
import { ExamplePrompts } from './components/ExamplePrompts';
import { FilePlusIcon } from './components/icons/FilePlusIcon';
import { Terminal } from './components/Terminal';

interface ComicSession {
    chat: Chat;
    panelCount: number;
    style: string;
}

interface PendingComicRequest {
    prompt: string;
}

/**
 * Removes markdown formatting from a string.
 * @param text The text to clean.
 * @returns The text without markdown.
 */
const stripMarkdown = (text: string): string => {
  return text
    .replace(/(!\[.*?\]\(.*?\))/g, '') // Remove images
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)') // Convert links to "text (url)"
    .replace(/([*_`~#>])/g, '') // Remove other markdown symbols
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
};

const getAkbarErrorMessage = (error: unknown): string => {
    let message = "Sistem gue lagi ngadat. Coba lagi nanti.";
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            message = "Woy, kunci API lo ini palsu atau gimana? Gak valid, atau mungkin lo belum bayar tagihan. Coba ganti kunci lain, atau sana gih cek lagi di Google AI Studio, jangan bikin gue nunggu.";
        } else if (error.message.includes('429')) {
            message = "Woy, santai! Lo terlalu banyak nanya. Tunggu bentar baru coba lagi.";
        } else {
            message = error.message;
        }
    }
    return message;
};

type ConfirmationRequest =
  | { type: 'clearChat' }
  | { type: 'styleChange'; style: AiStyle }
  | { type: 'deleteCommand'; commandName: string }
  | { type: 'overwriteCommand'; command: { name: string; text: string } };

const parseCommandArgs = (args: string) => {
    let tempArgs = ` ${args} `; // Pad for easier regex
    const flags: { [key: string]: string | boolean | string[] } = {};

    const kvFlagRegex = /--([\w-]+)\s+("([^"]+)"|'([^']+)'|(\S+))/g;
    tempArgs = tempArgs.replace(kvFlagRegex, (match, key, _fullValue, quotedVal1, quotedVal2, unquotedVal) => {
        const lowerKey = key.toLowerCase();
        const value = quotedVal1 || quotedVal2 || unquotedVal;

        if (unquotedVal && value.includes(',')) {
            flags[lowerKey] = value.split(',').map(s => s.trim());
        } else {
            flags[lowerKey] = value;
        }
        return ' '; 
    });

    const boolFlagRegex = /--([\w-]+)/g;
    tempArgs = tempArgs.replace(boolFlagRegex, (match, key) => {
        flags[key.toLowerCase()] = true;
        return ' '; 
    });

    const cleanPrompt = tempArgs.trim();

    return { cleanPrompt, flags };
};


const App: React.FC = () => {
    // State management
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [aiStyle, setAiStyle] = useState<AiStyle>('akbar');
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; message: Message; options: { label: string; action: () => void; icon: React.ReactNode }[] } | null>(null);
    const [confirmationRequest, setConfirmationRequest] = useState<ConfirmationRequest | null>(null);
    const [animatedMessageId, setAnimatedMessageId] = useState<string | null>(null);
    const [comicSession, setComicSession] = useState<ComicSession | null>(null);
    const [pendingComicRequest, setPendingComicRequest] = useState<PendingComicRequest | null>(null);
    const [editingComic, setEditingComic] = useState<Message | null>(null);
    const [activeImageFilter, setActiveImageFilter] = useState<string | null>(null);
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
    const [customCommands, setCustomCommands] = useState<CustomCommand[]>([]);
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);

    // Refs
    const chatSession = useRef<Chat | null>(null);

    // Memos
    const filteredMessages = useMemo(() => {
        if (!activeImageFilter) return messages;
        return messages.filter(m => {
            // Keep user messages, messages without images, or messages with matching style
            return m.role === 'user' || !m.imageUrl || m.imageStyle === activeImageFilter;
        });
    }, [messages, activeImageFilter]);


    // Effects
    useEffect(() => {
        chatSession.current = createChatSession(aiStyle);
    }, [aiStyle]);

    // Load custom commands from local storage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('akbar_custom_commands');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.every(c => typeof c.name === 'string' && typeof c.text === 'string')) {
                    setCustomCommands(parsed);
                }
            }
        } catch (e) {
            console.error("Failed to load custom commands from localStorage", e);
        }
    }, []);

    // Save custom commands to local storage when they change
    useEffect(() => {
        try {
            localStorage.setItem('akbar_custom_commands', JSON.stringify(customCommands));
        } catch (e) {
            console.error("Failed to save custom commands to localStorage", e);
        }
    }, [customCommands]);


    // Helper functions
    const addMessage = (message: Omit<Message, 'id'>) => {
        const id = Date.now().toString();
        setMessages(prev => [...prev, { ...message, id }]);
        setAnimatedMessageId(id);
        return id;
    };

    const updateMessage = (id: string, updates: Partial<Message>) => {
        setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, ...updates } : msg));
    };
    
    const updateLastMessage = (updates: Partial<Message>) => {
        setMessages(prev => {
            if (prev.length === 0) return [];
            const updatedMessages = [...prev];
            const lastIndex = updatedMessages.length - 1;
            updatedMessages[lastIndex] = { ...updatedMessages[lastIndex], ...updates };
            return updatedMessages;
        });
    };

    const handleError = (id: string, error: unknown) => {
        console.error(error);
        const errorMessage = getAkbarErrorMessage(error);
        updateMessage(id, { text: errorMessage, generationStatus: 'error' });
    };

    // --- Command Handlers ---

    const handleImageCommand = async (args: string, file: File | null, id: string) => {
        updateMessage(id, { generationStatus: 'generating', generationText: "Membuat gambar...", generationType: 'comic' });
        const { cleanPrompt, flags } = parseCommandArgs(args);
        const imagePart = file ? { inlineData: { data: await fileToBase64(file), mimeType: file.type } } : undefined;
        const { imageUrl, style } = await generateImage(cleanPrompt, flags, imagePart);
        updateMessage(id, { imageUrl, imageStyle: style, generationStatus: 'complete' });
    };

    const handleWallpaperCommand = async (args: string, _file: File | null, id: string) => {
        updateMessage(id, { generationStatus: 'generating', generationText: "Membuat wallpaper...", generationType: 'comic' });
        const { cleanPrompt, flags } = parseCommandArgs(args);
        const wallpaper = await generateWallpaper(cleanPrompt, flags);
        updateMessage(id, { imageUrl: wallpaper.imageUrl, imageStyle: wallpaper.style, generationStatus: 'complete' });
    };

    const handlePlaceholderCommand = async (args: string, _file: File | null, id: string) => {
        updateMessage(id, { generationStatus: 'generating', generationText: "Membuat placeholder...", generationType: 'comic' });
        const { cleanPrompt, flags } = parseCommandArgs(args);
        const placeholderUrl = await generatePlaceholderImage(cleanPrompt, flags);
        updateMessage(id, { imageUrl: placeholderUrl, imageStyle: 'placeholder', generationStatus: 'complete' });
    };

    const handleVideoCommand = async (args: string, _file: File | null, id: string) => {
        updateMessage(id, { generationStatus: 'pending', generationText: "Meminta izin Nexus...", generationType: 'video' });
        if (!window.aistudio || !await window.aistudio.hasSelectedApiKey()) {
           await window.aistudio.openSelectKey();
        }
        updateMessage(id, { generationStatus: 'generating', generationText: "Inisialisasi...", generationType: 'video' });
        const { cleanPrompt, flags } = parseCommandArgs(args);
        const operation = await startVideoGeneration(cleanPrompt, flags);
        const finalVideoUrl = await pollVideoStatus(operation, async (statusText, progress, previewUrl) => {
            updateMessage(id, { generationText: statusText, generationProgress: progress, videoUrl: previewUrl });
        });
        updateMessage(id, { videoUrl: finalVideoUrl, generationStatus: 'complete' });
    };
    
    const handleAudioDescCommand = async (_args: string, file: File | null, id: string) => {
        if (!file || !file.type.startsWith('image/')) throw new Error("Perintah `/dengarkan` butuh file gambar.");
        updateMessage(id, { generationStatus: 'generating', generationText: "Mendengarkan...", generationType: 'audio' });
        const imagePart = { inlineData: { data: await fileToBase64(file), mimeType: file.type } };
        const audioUrl = await generateImageAudioDescription(imagePart);
        updateMessage(id, { audioUrl, generationStatus: 'complete' });
    };

    const handleSummarizeCommand = async (args: string, _file: File | null, id: string) => {
        updateMessage(id, { generationStatus: 'generating', generationText: "Merangkum konten..." });
        const summary = await summarizeContent(args);
        updateMessage(id, { text: summary, generationStatus: 'complete' });
    };

    const handleTranslateCommand = async (args: string, _file: File | null, id: string) => {
        updateMessage(id, { generationStatus: 'generating', generationText: "Menerjemahkan teks..." });
        const translateArgs = args.trim().split(/\s+/);
        const targetLang = translateArgs[0];
        const messageId = translateArgs[1];

        if (!targetLang) throw new Error("Bahasa targetnya mana, woy? Contoh: `/translate jepang`.");

        let textToTranslate = '';
        if (messageId) {
            const targetMessage = messages.find(m => m.id === messageId);
            if (!targetMessage?.text) throw new Error(`Gak nemu pesan dengan ID itu, atau pesannya gak ada teksnya.`);
            textToTranslate = targetMessage.text;
        } else {
            const lastModelMessage = [...messages].reverse().find(m => m.id !== id && m.role === 'model' && m.text && !m.isStyleSelector);
            if (!lastModelMessage?.text) throw new Error("Gak ada pesan terakhir buat diterjemahin.");
            textToTranslate = lastModelMessage.text;
        }

        const translatedText = await translateText(textToTranslate, targetLang);
        updateMessage(id, { text: `**Terjemahan ke "${targetLang}":**\n\n${translatedText}`, generationStatus: 'complete' });
    };

    const handleWeatherCommand = async (args: string, _file: File | null, id: string) => {
        if (!args) throw new Error("Nama kotanya mana, woy? Contoh: `/cuaca Jakarta`.");
        updateMessage(id, { generationStatus: 'generating', generationText: `Mengecek cuaca untuk ${args}...` });
        const weatherReport = await getCurrentWeather(args);
        updateMessage(id, { text: weatherReport, generationStatus: 'complete' });
    };

    const handleWifiCommand = async (args: string, _file: File | null, id: string) => {
        updateMessage(id, { generationStatus: 'generating', generationText: `Meretas jaringan ${args}...` });
        const wifiResponse = await getWifiPassword(args);
        updateMessage(id, { text: wifiResponse, generationStatus: 'complete' });
    };

    const handleComicCommand = (args: string, _file: File | null, id: string) => {
        if (comicSession) {
            throw new Error("Sesi komik sudah aktif. Lanjutkan cerita atau mulai lagi nanti.");
        }
        addMessage({ role: 'model', text: 'Pilih gaya untuk komikmu:', isStyleSelector: true });
        setPendingComicRequest({ prompt: args });
        setMessages(prev => prev.filter(m => m.id !== id));
    };

    const handleDocumentCommand = async (args: string, _file: File | null, id: string) => {
        const [format, ...descriptionParts] = args.trim().split(/\s+/);
        const description = descriptionParts.join(' ');
        const docFormat = format.toLowerCase() as 'pdf' | 'slide' | 'sheet';

        if (!['pdf', 'slide', 'sheet'].includes(docFormat)) {
            throw new Error("Format dokumen tidak valid. Pilih dari: pdf, slide, sheet.");
        }

        updateMessage(id, { generationStatus: 'generating', generationText: `Membuat ${docFormat}...`, generationType: docFormat });
        
        const onProgress = (statusText: string, progress?: number) => {
            updateMessage(id, { generationText: statusText, generationProgress: progress });
        };

        const docInfo = await generateDocument(description, docFormat, onProgress);
        updateMessage(id, { documentInfo: docInfo, text: `Dokumen '${docInfo.filename}' berhasil dibuat dan diunduh.`, generationStatus: 'complete' });
    };
    
    const commandHandlers: Record<string, (args: string, file: File | null, id: string) => void> = {
        'gambar': handleImageCommand,
        'draw': handleImageCommand,
        'wallpaper': handleWallpaperCommand,
        'placeholder': handlePlaceholderCommand,
        'video': handleVideoCommand,
        'dengarkan': handleAudioDescCommand,
        'summarize': handleSummarizeCommand,
        'translate': handleTranslateCommand,
        'cuaca': handleWeatherCommand,
        'wifipass': handleWifiCommand,
        'komik': handleComicCommand,
        'buatdok': handleDocumentCommand,
        'buatppt': (args, file, id) => handleDocumentCommand(`slide ${args}`, file, id),
        'createpresentation': (args, file, id) => handleDocumentCommand(`slide ${args}`, file, id),
    };

    const handleSendMessage = async (prompt: string, file: File | null) => {
        let finalPrompt = prompt;
        const commandMatchSimple = finalPrompt.trim().match(/^\/(\w+)/);
        if (commandMatchSimple) {
            const customCmd = customCommands.find(c => c.name.toLowerCase() === commandMatchSimple[1].toLowerCase());
            if (customCmd) {
                finalPrompt = customCmd.text;
            }
        }

        // --- Handle client-side commands that don't need an AI roundtrip ---
        if (commandMatchSimple) {
            const [, command, args] = prompt.trim().match(/^\/(\w+)\s*(.*)/) || [];
            const cmdLower = command.toLowerCase();

            if (cmdLower === 'commandline') {
                setIsTerminalOpen(true);
                return;
            }
            
            if (cmdLower === 'edit') {
                const targetId = args.trim();
                const panelToEdit = targetId 
                    ? messages.find(m => m.id === targetId && m.isComicPanel)
                    : [...messages].reverse().find(m => m.isComicPanel);

                if (panelToEdit) {
                    handleEditComicRequest(panelToEdit);
                } else {
                    const errorText = targetId ? `Panel komik dengan ID itu gak ada, woy.` : `Gak ada panel komik terakhir buat diedit.`;
                    const errorId = addMessage({ role: 'model', text: errorText, generationStatus: 'error' });
                    setTimeout(() => setMessages(prev => prev.filter(m => m.id !== errorId)), 4000);
                }
                return; 
            }

            if (cmdLower === 'perintahku') {
                const [subCommand, name, ...textParts] = args.trim().split(/\s+/);
                const textMatch = args.match(/"(.*?)"/);
                const text = textMatch ? textMatch[1] : '';

                addMessage({ role: 'user', text: prompt }); 
                let responseText = '';

                switch (subCommand?.toLowerCase()) {
                    case 'tambah':
                        if (name && text) {
                            if (/^[a-zA-Z0-9_]+$/.test(name) && name.length <= 20) {
                                const existing = customCommands.find(c => c.name.toLowerCase() === name.toLowerCase());
                                if (existing) {
                                    setConfirmationRequest({ type: 'overwriteCommand', command: { name, text } });
                                    return;
                                }
                                setCustomCommands(prev => [...prev, { name, text }]);
                                responseText = `Sip, perintah \`/${name}\` udah gue simpen.`;
                            } else {
                                responseText = "Nama perintahnya aneh. Cuma boleh huruf, angka, underscore, dan maksimal 20 karakter.";
                            }
                        } else {
                            responseText = 'Formatnya salah, woy. Pake: `/perintahku tambah nama "teks perintahnya di sini"`';
                        }
                        break;
                    case 'hapus':
                        if (name) {
                            if (customCommands.some(c => c.name.toLowerCase() === name.toLowerCase())) {
                                setConfirmationRequest({ type: 'deleteCommand', commandName: name });
                                return;
                            }
                            responseText = `Perintah \`/${name}\` emang gak ada, mau hapus apa?`;
                        } else {
                            responseText = "Mau hapus perintah yang mana? Kasih tau namanya. `/perintahku hapus nama_perintah`";
                        }
                        break;
                    case 'list':
                        responseText = customCommands.length > 0
                            ? "Ini daftar perintah custom lo:\n\n" + customCommands.map(c => `*   **/${c.name}**: "${c.text}"`).join('\n')
                            : "Lo belum punya perintah custom. Buat satu pake `/perintahku tambah nama \"teks\"`.";
                        break;
                    default:
                        responseText = `Gunakan \`/perintahku\` buat bikin shortcut sendiri.\n\n**Cara pake:**\n*   \`/perintahku tambah <nama> "<teks>"\` - Buat perintah baru.\n*   \`/perintahku hapus <nama>\` - Hapus perintah.\n*   \`/perintahku list\` - Lihat semua perintah lo.`;
                        break;
                }
                addMessage({ role: 'model', text: responseText });
                return;
            }
        }
    
        if (isLoading) return;
        setIsLoading(true);

        const userMessage: Omit<Message, 'id'> = { role: 'user', text: prompt };
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUrl = e.target?.result as string;
                // Find the user message that was just added and update it
                setMessages(prev => prev.map(m => (m.role === 'user' && m.text === prompt && !m.imageUrl) ? { ...m, imageUrl } : m));
            };
            reader.readAsDataURL(file);
        }
        addMessage(userMessage);

        const modelResponseId = addMessage({ role: 'model', text: '' });
        
        try {
            const commandMatch = finalPrompt.trim().match(/^\/(\w+)\s*(.*)/);
            if (commandMatch) {
                const [, command, args] = commandMatch;
                const handler = commandHandlers[command.toLowerCase()];
                if (handler) {
                    await handler(args, file, modelResponseId);
                } else {
                    throw new Error(`Perintah '/${command}' tidak gue kenal. Jangan ngaco.`);
                }
            } else if (comicSession && finalPrompt.trim().toLowerCase() === 'lanjutkan') {
                 updateMessage(modelResponseId, { generationStatus: 'generating', generationText: `Membuat panel #${comicSession.panelCount + 1}...`, generationType: 'comic' });
                const panel = await continueComic(comicSession.chat, 'Lanjutkan cerita.');
                comicSession.panelCount++;
                updateMessage(modelResponseId, { isComicPanel: true, imageUrl: panel.imageUrl, text: panel.narrative, panelNumber: comicSession.panelCount, comicImagePrompt: panel.imagePrompt, generationStatus: 'complete' });
            } else {
                if (!chatSession.current) throw new Error("Sesi chat belum siap.");
                let chatPrompt: string | Part[] = finalPrompt;
                if (file) {
                    const filePart: Part = { inlineData: { data: await fileToBase64(file), mimeType: getMimeType(file.name) || file.type } };
                    chatPrompt = finalPrompt ? [filePart, { text: finalPrompt }] : [filePart];
                }
                const responseText = await continueChat(chatSession.current, chatPrompt);
                updateMessage(modelResponseId, { text: responseText });
            }
        } catch (error) {
            const commandMatch = finalPrompt.trim().match(/^\/(\w+)/);
            const isVideoCommand = commandMatch && commandMatch[1].toLowerCase() === 'video';
            const isVideoApiKeyError = isVideoCommand && error instanceof Error && (error.message.includes("Requested entity was not found") || error.message.includes("masalah kunci API"));

            if (isVideoApiKeyError) {
                 const originalMessage = error instanceof Error ? error.message : String(error);
                 const akbarMessage = `Woy, ada masalah sama video. Kayaknya kunci API lo ngaco.\n\n**Detail dari Server:**\n*${originalMessage}*\n\nGue buka pilihan kunci lagi buat lo. Kalo udah, klik 'Coba Lagi' di menu pesan ini.`;
                 handleError(modelResponseId, new Error(akbarMessage));
                 if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
                    await window.aistudio.openSelectKey();
                 }
            } else if (isVideoCommand && error instanceof Error) {
                const originalMessage = error.message;
                const akbarMessage = `Waduh, gagal bikin video. Ada masalah pas gue lagi kerja.\n\n**Detail dari Server:**\n*${originalMessage}*\n\nCoba cek lagi perintah lo, pastiin gak aneh-aneh. Kalau masih gagal, coba lagi nanti.`;
                handleError(modelResponseId, new Error(akbarMessage));
            } else {
                handleError(modelResponseId, error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleExampleSelect = (prompt: string) => {
        if (isLoading) return;
        // The prompt from the example is a full command, so we pass it directly
        handleSendMessage(prompt, null);
    };

    const handleStyleSelect = async (style: string) => {
        if (!pendingComicRequest) return;
        setIsLoading(true);

        setMessages(prev => prev.filter(m => !m.isStyleSelector));

        const modelResponseId = addMessage({ role: 'model', generationStatus: 'generating', generationText: "Membuat panel pertama...", isComicPanel: true, generationType: 'comic' });

        try {
            const newChat = startComicSession(pendingComicRequest.prompt, style);
            const panel = await continueComic(newChat, pendingComicRequest.prompt);
            setComicSession({ chat: newChat, panelCount: 1, style: style });
            updateMessage(modelResponseId, { isComicPanel: true, imageUrl: panel.imageUrl, text: panel.narrative, generationStatus: 'complete', panelNumber: 1, comicImagePrompt: panel.imagePrompt });
        } catch (error) {
            handleError(modelResponseId, error);
        } finally {
            setPendingComicRequest(null);
            setIsLoading(false);
        }
    };
    
    const handleRetry = (message: Message) => {
        const messageIndex = messages.findIndex(m => m.id === message.id);
        if (messageIndex === -1) return;

        const lastUserMessageIndex = messages.slice(0, messageIndex).map(m => m.role).lastIndexOf('user');
        if (lastUserMessageIndex === -1) return;
        
        const lastUserMessage = messages[lastUserMessageIndex];
        setMessages(prev => prev.slice(0, lastUserMessageIndex + 1));
        
        handleSendMessage(lastUserMessage.text || '', null);
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(stripMarkdown(text));
    };
    
    const handleDownloadWithMetadata = async (message: Message, precedingPrompt?: string) => {
        try {
            await downloadImageWithMetadata(message, precedingPrompt);
        } catch (error) {
            console.error(error);
            const errorId = addMessage({
                role: 'model',
                text: `Waduh, gagal nambahin metadata ke gambar. Coba lagi nanti. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                generationStatus: 'error',
            });
            setTimeout(() => setMessages(prev => prev.filter(m => m.id !== errorId)), 5000);
        }
    };

    const handleContextMenu = (event: React.MouseEvent, message: Message) => {
        event.preventDefault();
        const options = [];
        if (message.text) {
            options.push({ label: 'Salin Teks', action: () => handleCopy(message.text!), icon: <CopyIcon className="w-4 h-4 mr-2" /> });
        }
        
        if (message.imageUrl || message.videoUrl || message.audioUrl || message.fileInfo) {
             let urlToDownload = message.imageUrl || message.videoUrl || message.audioUrl || message.fileInfo?.url;
             let filename = message.fileInfo?.name || 'akbar-media';
             options.push({ label: 'Unduh Media', action: () => downloadFile(urlToDownload!, filename), icon: <DownloadIcon className="w-4 h-4 mr-2" /> });
        }
        
        if (message.role === 'model' && message.imageUrl) {
            options.push({
                label: 'Unduh dengan Metadata',
                action: () => {
                    let precedingPrompt: string | undefined;
                    const messageIndex = messages.findIndex(m => m.id === message.id);
                    if (messageIndex > 0) {
                        const lastUserMessage = [...messages.slice(0, messageIndex)].reverse().find(m => m.role === 'user');
                        precedingPrompt = lastUserMessage?.text;
                    }
                    handleDownloadWithMetadata(message, precedingPrompt);
                },
                icon: <FilePlusIcon className="w-4 h-4 mr-2" />
            });
        }

        if (message.role === 'model' && message.generationStatus === 'error') {
            options.push({ label: 'Coba Lagi', action: () => handleRetry(message), icon: <RetryIcon className="w-4 h-4 mr-2" /> });
        }
        if (message.isComicPanel) {
            options.push({ label: 'Edit Panel', action: () => handleEditComicRequest(message), icon: <EditIcon className="w-4 h-4 mr-2" /> });
            options.push({ label: 'Salin ID Panel', action: () => handleCopy(message.id), icon: <CopyIcon className="w-4 h-4 mr-2" /> });
        }

        if (options.length > 0) {
            setContextMenu({ x: event.clientX, y: event.clientY, message, options });
        }
    };
    
    const handleSaveChat = () => {
        const chatContent = messages.map(m => `**${m.role === 'user' ? 'You' : 'AKBAR AI'}**:\n${m.text || '[media]'}`).join('\n\n---\n\n');
        const blob = new Blob([chatContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        downloadFile(url, `akbar-chat-${new Date().toISOString()}.txt`);
        URL.revokeObjectURL(url);
    };

    const handleStyleChange = (style: AiStyle) => {
        if (style === aiStyle) return;

        if (messages.length > 0) {
            setConfirmationRequest({ type: 'styleChange', style });
        } else {
            setAiStyle(style);
        }
    };

    const handleEditComicRequest = (message: Message) => {
        setEditingComic(message);
    };

    const handleSaveComicEdit = (messageId: string, newNarrative: string, newImageUrl: string) => {
        updateMessage(messageId, { text: newNarrative, imageUrl: newImageUrl });
        setEditingComic(null);
    };

    const handleRegenerateComicImage = async (messageId: string): Promise<string> => {
        const message = messages.find(m => m.id === messageId);
        if (!message || !message.comicImagePrompt) {
            throw new Error("Prompt gambar asli tidak ditemukan.");
        }
        try {
            const { imageUrl } = await generateImage(message.comicImagePrompt, {});
            return imageUrl;
        } catch (err) {
            throw new Error("Gagal membuat ulang gambar dari API.");
        }
    };

    const handleConfirm = () => {
        if (!confirmationRequest) return;

        switch (confirmationRequest.type) {
            case 'clearChat':
                setMessages([]);
                setComicSession(null);
                chatSession.current = createChatSession(aiStyle);
                break;
            case 'styleChange':
                setAiStyle(confirmationRequest.style);
                setMessages([]);
                setComicSession(null);
                // The useEffect for aiStyle will create the new chat session
                break;
            case 'deleteCommand':
                const nameToDelete = confirmationRequest.commandName;
                setCustomCommands(prev => prev.filter(c => c.name.toLowerCase() !== nameToDelete.toLowerCase()));
                addMessage({ role: 'model', text: `Oke, perintah \`/${nameToDelete}\` udah gue buang.` });
                break;
            case 'overwriteCommand':
                const { name, text } = confirmationRequest.command;
                setCustomCommands(prev => {
                    const filtered = prev.filter(c => c.name.toLowerCase() !== name.toLowerCase());
                    return [...filtered, { name, text }];
                });
                addMessage({ role: 'model', text: `Sip, perintah \`/${name}\` udah gue perbarui.` });
                break;
        }
        setConfirmationRequest(null);
    };

    const handleCancelConfirmation = () => {
        setConfirmationRequest(null);
    };

    const getDialogProps = () => {
        if (!confirmationRequest) return null;
        switch (confirmationRequest.type) {
            case 'clearChat':
                return {
                    title: "Hapus Percakapan",
                    message: "Lo yakin mau buang semua jejak digital kita? Gak bisa dibalikin lagi, lho.",
                    confirmLabel: "Ya, Bakar Semuanya",
                    confirmButtonClass: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
                };
            case 'styleChange':
                return {
                    title: "Ganti Kepribadian AI",
                    message: `Lo yakin mau ganti ke mode '${confirmationRequest.style}'? Semua percakapan sekarang bakal dihapus.`,
                    confirmLabel: "Ya, Ganti & Hapus",
                };
            case 'deleteCommand':
                return {
                    title: "Hapus Perintah Custom",
                    message: `Lo yakin mau hapus perintah \`/${confirmationRequest.commandName}\` secara permanen? Gak bisa dibalikin lagi.`,
                    confirmLabel: "Ya, Hapus Aja",
                    confirmButtonClass: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
                };
            case 'overwriteCommand':
                return {
                    title: "Timpa Perintah Custom",
                    message: `Perintah \`/${confirmationRequest.command.name}\` udah ada. Lo yakin mau timpa dengan yang baru?`,
                    confirmLabel: "Ya, Timpa Aja",
                };
        }
    };
    
    const dialogProps = getDialogProps();

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
            <Header
                onSaveChat={handleSaveChat}
                onRequestClearChat={() => setConfirmationRequest({ type: 'clearChat' })}
                isChatEmpty={messages.length === 0}
                aiStyle={aiStyle}
                onStyleChange={handleStyleChange}
                messages={messages}
                activeImageFilter={activeImageFilter}
                onImageFilterChange={setActiveImageFilter}
                onShowPrompt={() => setIsPromptModalOpen(true)}
            />

            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    {filteredMessages.length > 0 ? (
                        <MessageList 
                            messages={filteredMessages} 
                            isLoading={isLoading} 
                            onContextMenu={handleContextMenu}
                            animatedMessageId={animatedMessageId}
                            onStyleSelect={handleStyleSelect}
                            onEditComicRequest={handleEditComicRequest}
                        />
                    ) : (
                        <WelcomeScreen />
                    )}
                </div>
            </main>

            <footer className="p-4 md:p-6 lg:p-8 sticky bottom-0 z-10 bg-gradient-to-t from-gray-900 via-gray-900 to-transparent">
                <div className="max-w-4xl mx-auto">
                    {messages.length === 0 && !isLoading && (
                        <ExamplePrompts onSelectPrompt={handleExampleSelect} />
                    )}
                    <InputBar
                        onSubmit={handleSendMessage}
                        isLoading={isLoading}
                        isComicMode={!!comicSession}
                        customCommands={customCommands}
                    />
                </div>
            </footer>
             {contextMenu && (
                <ContextMenu 
                    x={contextMenu.x} 
                    y={contextMenu.y} 
                    options={contextMenu.options}
                    onClose={() => setContextMenu(null)} 
                />
            )}
            
            {dialogProps && (
                <ConfirmationDialog
                    {...dialogProps}
                    onConfirm={handleConfirm}
                    onCancel={handleCancelConfirmation}
                />
            )}

            {editingComic && (
                <ComicEditorModal 
                    message={editingComic} 
                    onSave={handleSaveComicEdit}
                    onCancel={() => setEditingComic(null)}
                    onRegenerateImage={handleRegenerateComicImage}
                />
            )}
            <SystemPromptModal 
                isOpen={isPromptModalOpen}
                onClose={() => setIsPromptModalOpen(false)}
                aiStyle={aiStyle}
            />
            {isTerminalOpen && (
                <Terminal onClose={() => setIsTerminalOpen(false)} />
            )}
        </div>
    );
};

export default App;