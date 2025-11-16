

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { InputBar } from './components/InputBar';
import { MessageList } from './components/MessageList';
import { Header } from './Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Message, Role, FileInfo, AiStyle } from './types';
import { createChatSession, continueChat, generateImage, startVideoGeneration, pollVideoStatus, generateImageAudioDescription, generatePlaceholderImage, startComicSession, continueComic, allowedImageStyles, generateWallpaper, generateDocument } from './services/geminiService';
import type { Chat } from './services/geminiService';
import { fileToBase64, getMimeType, downloadFile } from './utils/fileUtils';
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
import { Part } from '@google/genai';

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
    .replace(/(\[.*?\]\(.*?\))/g, '$1') // Keep link text
    .replace(/([*_`~#>])/g, '') // Remove other markdown symbols
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
};

const getAkbarErrorMessage = (error: unknown): string => {
    let message = "Sistem gue lagi ngadat. Coba lagi nanti.";
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            message = "Kunci API lo nggak valid. Cek lagi, jangan sampai salah ketik.";
        } else if (error.message.includes('429')) {
            message = "Woy, santai! Lo terlalu banyak nanya. Tunggu bentar baru coba lagi.";
        } else if (error.message.toLowerCase().includes('kualitas gambar tidak valid')) {
            message = "Kualitas gambar apaan tuh? Pilih antara 1 sampai 4 aja, jangan ngaco.";
        } else {
            message = error.message;
        }
    }
    return message;
};

const App: React.FC = () => {
    // State management
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [aiStyle, setAiStyle] = useState<AiStyle>('akbar');
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; message: Message } | null>(null);
    const [dialog, setDialog] = useState<'clearChat' | null>(null);
    const [animatedMessageId, setAnimatedMessageId] = useState<string | null>(null);
    const [comicSession, setComicSession] = useState<ComicSession | null>(null);
    const [pendingComicRequest, setPendingComicRequest] = useState<PendingComicRequest | null>(null);
    const [editingComic, setEditingComic] = useState<Message | null>(null);
    const [activeImageFilter, setActiveImageFilter] = useState<string | null>(null);

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
            const lastMessage = prev[prev.length - 1];
            if (lastMessage.role === 'model') {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { ...lastMessage, ...updates };
                return newMessages;
            }
            return prev; // Should not happen if we always add a placeholder first
        });
    };

    // Event Handlers
    const handleSubmit = async (prompt: string, attachedFile: File | null) => {
        const trimmedPrompt = prompt.trim();
        const userMessageId = addMessage({
            role: 'user',
            text: trimmedPrompt,
            fileInfo: attachedFile ? { name: attachedFile.name, type: attachedFile.type, url: URL.createObjectURL(attachedFile) } : undefined
        });

        setIsLoading(true);
        
        let filePart: Part | undefined;
        if (attachedFile) {
            try {
                const base64Data = await fileToBase64(attachedFile);
                const mimeType = getMimeType(attachedFile.name);
                if (!mimeType) throw new Error("Tipe file tidak didukung.");
                filePart = { inlineData: { data: base64Data, mimeType } };
            } catch (error) {
                addMessage({ role: 'model', text: getAkbarErrorMessage(error) });
                setIsLoading(false);
                return;
            }
        }

        try {
            // Command handling
            if (trimmedPrompt.toLowerCase().startsWith('/gambar')) {
                const imagePrompt = trimmedPrompt.substring(7).trim();
                const placeholderId = addMessage({ role: 'model', generationStatus: 'generating', generationText: `Imajinasi gue lagi liar... Menciptakan: "${imagePrompt}"` });
                const { imageUrl, style } = await generateImage(imagePrompt, filePart);
                updateMessage(placeholderId, { imageUrl, generationStatus: 'complete', imageStyle: style });
            } else if (trimmedPrompt.toLowerCase().startsWith('/wallpaper')) {
                const wallpaperPrompt = trimmedPrompt.substring(10).trim();
                const placeholderId = addMessage({ role: 'model', generationStatus: 'generating', generationText: 'Merancang wallpaper...' });
                const { imageUrl, style } = await generateWallpaper(wallpaperPrompt);
                updateMessage(placeholderId, { imageUrl, generationStatus: 'complete', imageStyle: style });
            } else if (trimmedPrompt.toLowerCase().startsWith('/placeholder')) {
                const placeholderPrompt = trimmedPrompt.substring(12).trim();
                const placeholderId = addMessage({ role: 'model', generationStatus: 'generating', generationText: 'Membuat gambar placeholder...' });
                const imageUrl = await generatePlaceholderImage(placeholderPrompt);
                updateMessage(placeholderId, { imageUrl, generationStatus: 'complete' });
            } else if (trimmedPrompt.toLowerCase().startsWith('/dengarkan')) {
                if (!filePart) throw new Error("Lo harus lampirin gambar buat perintah /dengarkan.");
                const placeholderId = addMessage({ role: 'model', generationStatus: 'generating', generationText: 'Mendengarkan bisikan dari gambar...' });
                const audioUrl = await generateImageAudioDescription(filePart);
                updateMessage(placeholderId, { audioUrl, generationStatus: 'complete' });
            } else if (trimmedPrompt.toLowerCase().startsWith('/video')) {
                 if (await window.aistudio.hasSelectedApiKey() === false) {
                    await window.aistudio.openSelectKey();
                }
                const videoPrompt = trimmedPrompt.substring(6).trim();
                const placeholderId = addMessage({ role: 'model', generationStatus: 'generating', generationText: 'Memulai generator video...' });
                const operation = await startVideoGeneration(videoPrompt);
                await pollAndFinalizeVideo(operation, placeholderId);
            } else if (trimmedPrompt.toLowerCase().startsWith('/komik')) {
                const comicPrompt = trimmedPrompt.substring(6).trim();
                if (comicSession) {
                    addMessage({ role: 'model', text: "Satu komik aja dulu, bos. Selesain yang ini baru mulai lagi." });
                } else if (!comicPrompt) {
                    addMessage({ text: "Oke, gue siap bikin komik. Pilih gaya ceritanya di bawah ini, atau ketik sendiri idenya.", role: 'model', isStyleSelector: true });
                } else {
                    addMessage({ text: "Gaya apa yang lo mau buat komik ini?", role: 'model', isStyleSelector: true });
                    setPendingComicRequest({ prompt: comicPrompt });
                }
            } else if (comicSession && trimmedPrompt.toLowerCase().includes('lanjutkan')) {
                const panelNumber = comicSession.panelCount + 1;
                const placeholderId = addMessage({ role: 'model', isComicPanel: true, panelNumber, imageUrl: await generatePlaceholderImage(''), text: '', generationStatus: 'generating', generationText: `Membuat panel #${panelNumber}...` });
                const { imageUrl, narrative, imagePrompt } = await continueComic(comicSession.chat, trimmedPrompt);
                updateMessage(placeholderId, { imageUrl, text: narrative, comicImagePrompt: imagePrompt, generationStatus: 'complete' });
                setComicSession(prev => prev ? { ...prev, panelCount: panelNumber } : null);
            } else if (trimmedPrompt.toLowerCase().startsWith('/buatdok')) {
                 const placeholderId = addMessage({ role: 'model', generationStatus: 'generating', generationText: `Membuat dokumen...` });
                 const { format, filename } = await generateDocument(trimmedPrompt);
                 updateMessage(placeholderId, { text: `Dokumen \`${filename}\` berhasil dibuat.`, documentInfo: { format, filename }, generationStatus: 'complete' });
            } else if (trimmedPrompt.toLowerCase() === '/help') {
                const helpText = `--- BANTUAN AKBAR AI ---\n\n**/gambar [deskripsi]**\nMembuat gambar. Flag:\n  --style [gaya]: ${allowedImageStyles.join(', ')}\n  --quality [1-4]: Kualitas gambar.\n  --aspect [rasio]: '16:9', '9:16', '1:1', dll.\n\n**/wallpaper [deskripsi]**\nMembuat wallpaper. Flag:\n  --aspect [rasio]: '16:9' (desktop), '9:16' (mobile).\n\n**/placeholder [judul]**\nMembuat gambar placeholder. Flag:\n  --subtitle [teks]\n  --theme [tema]: dark, light, dll.\n  --style [gaya]: geometric, organic, dll.\n  --icon [nama ikon]\n\n**/video [deskripsi]**\nMembuat video. Flag:\n  --aspect [rasio]: '16:9', '9:16'\n  --res [resolusi]: '720p', '1080p'\n  --quality [kualitas]: 'fast', 'high'\n\n**/komik [ide cerita]**\nMemulai sesi komik. Ketik "lanjutkan" untuk panel berikutnya.\n\n**/buatdok [format] [deskripsi]**\nMembuat dokumen (pdf, slide, sheet).\n\n**/dengarkan + [lampiran gambar]**\nMendeskripsikan gambar dengan audio.\n\nLampirkan file (gambar/PDF) untuk dianalisis atau dimodifikasi.`;
                addMessage({ role: 'model', text: helpText });
            } else { // Regular chat
                if (!chatSession.current) chatSession.current = createChatSession(aiStyle);
                const placeholderId = addMessage({ role: 'model', text: '...' });
                const chatInput: string | Part[] = filePart ? [{ text: trimmedPrompt }, filePart] : trimmedPrompt;
                const responseText = await continueChat(chatSession.current!, chatInput);
                updateMessage(placeholderId, { text: responseText });
            }
        } catch (error) {
            const errorMessage = getAkbarErrorMessage(error);
            // If there's a placeholder, update it with the error. Otherwise, add a new error message.
             const lastMessage = messages[messages.length - 1];
             const lastModelMessage = [...messages].reverse().find(m => m.role === 'model');
             if (lastModelMessage?.generationStatus === 'generating' || lastModelMessage?.text === '...') {
                updateMessage(lastModelMessage.id, { text: errorMessage, generationStatus: 'error' });
             } else {
                addMessage({ role: 'model', text: errorMessage, generationStatus: 'error' });
             }
        } finally {
            setIsLoading(false);
        }
    };
    
    const pollAndFinalizeVideo = async (operation: any, placeholderId: string) => {
        let lastPreviewUrl: string | undefined;
        try {
            const finalUrl = await pollVideoStatus(operation, async (statusText, previewUrl) => {
                 let blobUrl = lastPreviewUrl;
                 if (previewUrl) {
                    try {
                        const res = await fetch(`${previewUrl}&key=${process.env.API_KEY}`);
                        if (res.ok) {
                            const blob = await res.blob();
                            // If a previous blob URL exists, revoke it to prevent memory leaks
                            if (lastPreviewUrl) {
                                URL.revokeObjectURL(lastPreviewUrl);
                            }
                            blobUrl = URL.createObjectURL(blob);
                            lastPreviewUrl = blobUrl;
                        }
                    } catch (e) {
                        console.warn("Gagal mengambil pratinjau video:", e);
                    }
                 }
                updateMessage(placeholderId, { generationText: statusText, videoUrl: blobUrl });
            });
            updateMessage(placeholderId, { videoUrl: finalUrl, generationStatus: 'complete' });
        } catch(error) {
            updateMessage(placeholderId, { text: getAkbarErrorMessage(error), generationStatus: 'error' });
            throw error; // Re-throw to be caught by the main handler
        } finally {
            // Final cleanup of the last preview blob URL
            if (lastPreviewUrl) {
                URL.revokeObjectURL(lastPreviewUrl);
            }
        }
    };

    const handleStyleSelect = async (style: string) => {
        if (!pendingComicRequest) return;
        setIsLoading(true);
        try {
            const session = startComicSession(pendingComicRequest.prompt, style);
            const panelNumber = 1;
            // FIX: Awaited generatePlaceholderImage as it returns a Promise<string> which is not assignable to imageUrl that expects a string.
            const placeholderImageUrl = await generatePlaceholderImage('');
            const placeholderId = addMessage({ role: 'model', isComicPanel: true, panelNumber, imageUrl: placeholderImageUrl, text: '', generationStatus: 'generating', generationText: `Memulai komik... Membuat panel #${panelNumber}...` });
            const { imageUrl, narrative, imagePrompt } = await continueComic(session, pendingComicRequest.prompt);
            updateMessage(placeholderId, { imageUrl, text: narrative, comicImagePrompt: imagePrompt, generationStatus: 'complete' });
            setComicSession({ chat: session, panelCount: panelNumber, style });
        } catch (error) {
            addMessage({ role: 'model', text: getAkbarErrorMessage(error) });
        } finally {
            setPendingComicRequest(null);
            setIsLoading(false);
        }
    };

    const handleContextMenu = (event: React.MouseEvent, message: Message) => {
        event.preventDefault();
        setContextMenu({ x: event.clientX, y: event.clientY, message });
    };

    const handleRetry = (message: Message) => {
        // Find the user message that prompted this response
        // FIX: Replace findLastIndex with a for-loop for broader JS compatibility.
        let userMessageIndex = -1;
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].id < message.id && messages[i].role === 'user') {
                userMessageIndex = i;
                break;
            }
        }

        if (userMessageIndex !== -1) {
            const userMessage = messages[userMessageIndex];
            // Remove the error message and all subsequent messages
            setMessages(prev => prev.slice(0, messages.indexOf(message)));
            // Resubmit
            handleSubmit(userMessage.text || '', null); // Note: File attachments are not retried for simplicity
        }
        setContextMenu(null);
    };

    const handleSaveChat = () => {
        const chatContent = messages.map(m => `[${m.role === 'user' ? 'User' : 'AKBAR AI'}]\n${m.text || '(media content)'}`).join('\n\n');
        const blob = new Blob([chatContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        downloadFile(url, `akbar-ai-chat-${new Date().toISOString()}.txt`);
        URL.revokeObjectURL(url);
    };

    const handleClearChat = () => {
        setMessages([]);
        setComicSession(null);
        setDialog(null);
        chatSession.current = createChatSession(aiStyle); // Reset session
    };
    
    const handleEditComicSave = (messageId: string, newNarrative: string, newImageUrl: string) => {
        updateMessage(messageId, { text: newNarrative, imageUrl: newImageUrl });
        setEditingComic(null);
    };
    
    const handleRegenerateComicImage = async (messageId: string): Promise<string> => {
        const message = messages.find(m => m.id === messageId);
        if (!message || !message.comicImagePrompt) {
            throw new Error("Prompt gambar asli tidak ditemukan.");
        }
        const { imageUrl } = await generateImage(message.comicImagePrompt);
        return imageUrl;
    };


    const contextMenuOptions = useMemo(() => {
        if (!contextMenu) return [];
        const { message } = contextMenu;
        const options = [];

        if (message.text) {
            options.push({
                label: 'Salin Teks',
                icon: <CopyIcon className="w-4 h-4 mr-2" />,
                action: () => {
                    navigator.clipboard.writeText(stripMarkdown(message.text!));
                    setContextMenu(null);
                }
            });
        }
        if (message.generationStatus === 'error') {
            options.push({
                label: 'Coba Lagi',
                icon: <RetryIcon className="w-4 h-4 mr-2" />,
                action: () => handleRetry(message)
            });
        }
        return options;
    }, [contextMenu, messages]);


    // Render
    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
            <Header
                isChatEmpty={messages.length === 0}
                onSaveChat={handleSaveChat}
                onRequestClearChat={() => setDialog('clearChat')}
                aiStyle={aiStyle}
                onStyleChange={(style) => {
                    setAiStyle(style);
                    // Reset non-sticky state when changing personality
                    setComicSession(null); 
                    setMessages([]);
                }}
                messages={messages}
                activeImageFilter={activeImageFilter}
                onImageFilterChange={setActiveImageFilter}
            />
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-4xl mx-auto">
                    {messages.length === 0 ? <WelcomeScreen /> : (
                        <MessageList
                            messages={filteredMessages}
                            isLoading={isLoading}
                            onContextMenu={handleContextMenu}
                            animatedMessageId={animatedMessageId}
                            onStyleSelect={handleStyleSelect}
                            onEditComicRequest={(message) => setEditingComic(message)}
                        />
                    )}
                </div>
            </main>
            <footer className="p-4 md:p-6 bg-gray-900/60 backdrop-blur-sm sticky bottom-0">
                <div className="max-w-4xl mx-auto">
                    <InputBar 
                        onSubmit={handleSubmit} 
                        isLoading={isLoading}
                        isComicMode={!!comicSession}
                    />
                </div>
            </footer>
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    options={contextMenuOptions}
                    onClose={() => setContextMenu(null)}
                />
            )}
            {dialog === 'clearChat' && (
                <ConfirmationDialog
                    title="Hapus Seluruh Percakapan?"
                    message="Tindakan ini tidak bisa dibatalkan. Semua riwayat chat saat ini akan hilang."
                    confirmLabel="Ya, Hapus Saja"
                    confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    onConfirm={handleClearChat}
                    onCancel={() => setDialog(null)}
                />
            )}
            {editingComic && (
                <ComicEditorModal
                    message={editingComic}
                    onCancel={() => setEditingComic(null)}
                    onSave={handleEditComicSave}
                    onRegenerateImage={handleRegenerateComicImage}
                />
            )}
        </div>
    );
};

export default App;