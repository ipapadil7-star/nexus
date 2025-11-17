

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { InputBar } from './components/InputBar';
import { MessageList } from './components/MessageList';
import { Header } from './Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Message, Role, FileInfo, AiStyle } from './types';
import { createChatSession, continueChat, generateImage, startVideoGeneration, pollVideoStatus, generateImageAudioDescription, generatePlaceholderImage, startComicSession, continueComic, allowedImageStyles, generateWallpaper, generateDocument } from './services/geminiService';
import type { Chat, ComicPanel } from './services/geminiService';
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
// FIX: Import missing DownloadIcon component.
import { DownloadIcon } from './components/icons/DownloadIcon';
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
            message = "Woy, kunci API lo ini palsu atau gimana? Gak valid, atau mungkin lo belum bayar tagihan. Coba ganti kunci lain, atau sana gih cek lagi di Google AI Studio, jangan bikin gue nunggu.";
        } else if (error.message.includes('429')) {
            message = "Woy, santai! Lo terlalu banyak nanya. Tunggu bentar baru coba lagi.";
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

    const handleSendMessage = async (prompt: string, file: File | null) => {
        if (isLoading) return;
        setIsLoading(true);

        // Add user message to UI
        const userMessage: Omit<Message, 'id'> = { role: 'user', text: prompt };
        if (file) {
            userMessage.fileInfo = { name: file.name, type: file.type, url: URL.createObjectURL(file) };
        }
        addMessage(userMessage);

        const modelResponseId = addMessage({ role: 'model', text: '' });
        
        try {
            // Command handling
            const commandMatch = prompt.trim().match(/^\/(\w+)\s*(.*)/);
            if (commandMatch) {
                const [, command, args] = commandMatch;
                
                switch (command.toLowerCase()) {
                    case 'gambar':
                        const { imageUrl, style } = await generateImage(args, file ? { inlineData: { data: await fileToBase64(file), mimeType: file.type } } : undefined);
                        updateMessage(modelResponseId, { imageUrl, imageStyle: style });
                        break;
                    case 'wallpaper':
                        const wallpaper = await generateWallpaper(args);
                        updateMessage(modelResponseId, { imageUrl: wallpaper.imageUrl, imageStyle: wallpaper.style });
                        break;
                    case 'placeholder':
                        const placeholderUrl = await generatePlaceholderImage(args);
                        updateMessage(modelResponseId, { imageUrl: placeholderUrl, imageStyle: 'placeholder' });
                        break;
                    case 'video':
                         updateMessage(modelResponseId, { generationStatus: 'pending', generationText: "Meminta izin Nexus untuk akses video..." });
                         if (!window.aistudio || !await window.aistudio.hasSelectedApiKey()) {
                            // FIX: `openSelectKey` returns `void`. The logic should assume success as per the guidelines.
                            await window.aistudio.openSelectKey();
                         }
                         updateMessage(modelResponseId, { generationStatus: 'generating', generationText: "Menginisialisasi generator video..." });
                         const operation = await startVideoGeneration(args);
                         const finalVideoUrl = await pollVideoStatus(operation, async (statusText, previewUrl) => {
                             updateMessage(modelResponseId, { generationText: statusText, videoUrl: previewUrl });
                         });
                         updateMessage(modelResponseId, { videoUrl: finalVideoUrl, generationStatus: 'complete' });
                        break;
                    case 'dengarkan':
                        if (!file || !file.type.startsWith('image/')) throw new Error("Perintah `/dengarkan` butuh file gambar.");
                        const imagePart = { inlineData: { data: await fileToBase64(file), mimeType: file.type } };
                        const audioUrl = await generateImageAudioDescription(imagePart);
                        updateMessage(modelResponseId, { audioUrl });
                        break;
                    case 'komik':
                        if (comicSession) {
                            throw new Error("Sesi komik sudah aktif. Lanjutkan cerita atau mulai lagi nanti.");
                        }
                        addMessage({ role: 'model', text: 'Pilih gaya untuk komikmu:', isStyleSelector: true });
                        setPendingComicRequest({ prompt: args });
                        // Remove the empty message placeholder
                        setMessages(prev => prev.filter(m => m.id !== modelResponseId));
                        break;
                    case 'buatdok':
                        const docInfo = await generateDocument(prompt);
                        updateMessage(modelResponseId, { documentInfo: docInfo, text: `Dokumen '${docInfo.filename}' berhasil dibuat dan diunduh.` });
                        break;
                    default:
                        throw new Error(`Perintah '/${command}' tidak gue kenal. Jangan ngaco.`);
                }
            } else if (comicSession && prompt.trim().toLowerCase() === 'lanjutkan') {
                // Continue comic
                const panel = await continueComic(comicSession.chat, 'Lanjutkan cerita.');
                comicSession.panelCount++;
                updateMessage(modelResponseId, { 
                    isComicPanel: true, 
                    imageUrl: panel.imageUrl, 
                    text: panel.narrative,
                    panelNumber: comicSession.panelCount,
                    comicImagePrompt: panel.imagePrompt,
                });
            } else {
                // Regular chat or chat with file
                if (!chatSession.current) throw new Error("Sesi chat belum siap.");
                
                let chatPrompt: string | Part[] = prompt;
                if (file) {
                    const filePart: Part = { inlineData: { data: await fileToBase64(file), mimeType: getMimeType(file.name) || file.type } };
                    chatPrompt = prompt ? [filePart, { text: prompt }] : [filePart];
                }
                
                const responseText = await continueChat(chatSession.current, chatPrompt);
                updateMessage(modelResponseId, { text: responseText });
            }
        } catch (error) {
            handleError(modelResponseId, error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStyleSelect = async (style: string) => {
        if (!pendingComicRequest) return;
        setIsLoading(true);

        // Remove the style selector message
        setMessages(prev => prev.filter(m => !m.isStyleSelector));

        const modelResponseId = addMessage({ role: 'model', generationStatus: 'generating', generationText: "Membuat panel pertama...", isComicPanel: true });

        try {
            const newChat = startComicSession(pendingComicRequest.prompt, style);
            const panel = await continueComic(newChat, pendingComicRequest.prompt);
            setComicSession({ chat: newChat, panelCount: 1, style: style });
            updateMessage(modelResponseId, {
                isComicPanel: true,
                imageUrl: panel.imageUrl,
                text: panel.narrative,
                generationStatus: 'complete',
                panelNumber: 1,
                comicImagePrompt: panel.imagePrompt
            });
        } catch (error) {
            handleError(modelResponseId, error);
        } finally {
            setPendingComicRequest(null);
            setIsLoading(false);
        }
    };
    
    const handleRetry = (message: Message) => {
        const lastUserMessageIndex = messages.findLastIndex(m => m.role === 'user');
        if (lastUserMessageIndex === -1) return;
        
        const lastUserMessage = messages[lastUserMessageIndex];
        setMessages(prev => prev.slice(0, lastUserMessageIndex + 1));
        
        // This is a simplified retry, assumes file context is not needed or is part of the original prompt logic.
        // A more complex implementation would need to re-acquire the file object.
        handleSendMessage(lastUserMessage.text || '', null);
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(stripMarkdown(text));
    };
    
    const handleContextMenu = (event: React.MouseEvent, message: Message) => {
        event.preventDefault();
        const options = [];
        if (message.text) {
            options.push({ label: 'Salin Teks', action: () => handleCopy(message.text!), icon: <CopyIcon className="w-4 h-4 mr-2" /> });
        }
        if (message.imageUrl || message.videoUrl) {
            options.push({ label: 'Unduh Media', action: () => downloadFile(message.imageUrl || message.videoUrl!, 'akbar-media'), icon: <DownloadIcon className="w-4 h-4 mr-2" /> });
        }
        if (message.role === 'model' && message.generationStatus === 'error') {
            options.push({ label: 'Coba Lagi', action: () => handleRetry(message), icon: <RetryIcon className="w-4 h-4 mr-2" /> });
        }

        setContextMenu({ x: event.clientX, y: event.clientY, message, options });
    };
    
    const handleSaveChat = () => {
        const chatContent = messages.map(m => `**${m.role === 'user' ? 'You' : 'AKBAR AI'}**:\n${m.text || '[media]'}`).join('\n\n---\n\n');
        const blob = new Blob([chatContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        downloadFile(url, `akbar-chat-${new Date().toISOString()}.txt`);
        URL.revokeObjectURL(url);
    };

    const handleConfirmClearChat = () => {
        setMessages([]);
        setDialog(null);
        setComicSession(null);
        chatSession.current = createChatSession(aiStyle);
    };
    
    const handleStyleChange = (style: AiStyle) => {
        setAiStyle(style);
        // Reset chat when style changes for a clean slate
        if(messages.length > 0) {
            setMessages([]);
            setComicSession(null);
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
            const { imageUrl } = await generateImage(message.comicImagePrompt);
            return imageUrl;
        } catch (err) {
            // Let the main error handler in the component catch this
            throw new Error("Gagal membuat ulang gambar dari API.");
        }
    };


    return (
        <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
            <Header
                onSaveChat={handleSaveChat}
                onRequestClearChat={() => setDialog('clearChat')}
                isChatEmpty={messages.length === 0}
                aiStyle={aiStyle}
                onStyleChange={handleStyleChange}
                messages={messages}
                activeImageFilter={activeImageFilter}
                onImageFilterChange={setActiveImageFilter}
            />
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-4xl mx-auto">
                    {messages.length === 0 && !isLoading ? (
                        <WelcomeScreen />
                    ) : (
                        <MessageList
                            messages={filteredMessages}
                            isLoading={isLoading && messages.length > 0}
                            onContextMenu={handleContextMenu}
                            animatedMessageId={animatedMessageId}
                            onStyleSelect={handleStyleSelect}
                            onEditComicRequest={handleEditComicRequest}
                        />
                    )}
                </div>
            </main>
            <div className="px-4 md:px-6 pb-4 md:pb-6 bg-gray-900">
                 <div className="max-w-4xl mx-auto">
                    <InputBar
                        onSubmit={handleSendMessage}
                        isLoading={isLoading}
                        isComicMode={!!comicSession}
                    />
                 </div>
            </div>
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    options={contextMenu.options}
                    onClose={() => setContextMenu(null)}
                />
            )}
            {dialog === 'clearChat' && (
                <ConfirmationDialog
                    title="Hapus Seluruh Percakapan?"
                    message="Lo yakin mau hapus semua chat ini? Gak bisa dibalikin lagi lho."
                    onConfirm={handleConfirmClearChat}
                    onCancel={() => setDialog(null)}
                    confirmLabel="Ya, Hapus Saja"
                    confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                />
            )}
            {editingComic && (
                <ComicEditorModal
                    message={editingComic}
                    onCancel={() => setEditingComic(null)}
                    onSave={handleSaveComicEdit}
                    onRegenerateImage={handleRegenerateComicImage}
                />
            )}
        </div>
    );
};

export default App;