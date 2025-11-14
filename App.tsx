
import React, { useState, useRef, useEffect } from 'react';
import { InputBar } from './components/InputBar';
import { MessageList } from './components/MessageList';
import { Header } from './components/Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Message, Role, FileInfo } from './types';
import { generateText, generateImage, isTextAnalysisPrompt } from './services/geminiService';
import { fileToBase64, getMimeType } from './utils/fileUtils';
import { InlineDataPart } from '@google/genai';
import { ContextMenu } from './components/ContextMenu';
import { CopyIcon } from './components/icons/CopyIcon';
import { RetryIcon } from './components/icons/RetryIcon';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { AlertIcon } from './components/icons/AlertIcon';
import { XIcon } from './components/icons/XIcon';
import { LinkIcon } from './components/icons/LinkIcon';
import { ImageIcon } from './components/ImageIcon';

/**
 * Translates a generic error into a sarcastic, in-character message from Nexus.
 * @param error The error object or unknown type.
 * @returns A string containing the user-facing error message.
 */
const getNexusErrorMessage = (error: unknown): string => {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui.';
    const lowerCaseError = errorMessage.toLowerCase();

    // File type errors
    if (lowerCaseError.includes('tipe file tidak didukung')) {
        return "Lo pikir gue apaan, bisa baca semua jenis file? Cuma gambar sama PDF yang gue urusin. Sisanya, buang aja.";
    }
    if (lowerCaseError.includes('hanya file gambar')) {
        return "Woi, jenius. Perintah `/gambar` itu buat BIKIN gambar, bukan buat ngerusak file aneh-aneh yang lo kasih. Kasih gue file gambar, atau jangan sama sekali.";
    }

    // High-priority checks first
    if (lowerCaseError.includes('safety') || lowerCaseError.includes('blocked')) {
        return "Whoa, ide lo terlalu liar buat sirkuit gue. Kena sensor. Coba yang lebih 'aman', kalau lo ngerti maksud gue.";
    }
    if (lowerCaseError.includes('korteks visual') || lowerCaseError.includes('gagal bikin gambar')) {
        return "Otak visual gue lagi korslet, nih. Gagal total bikin gambar. Coba lagi nanti, mungkin setelah gue restart.";
    }
    if (lowerCaseError.includes('tidak ada data gambar')) {
        return "Gue coba bikin gambarnya, tapi hasilnya... zonk. Kosong. Mungkin imajinasi lo terlalu canggih buat teknologi gue, atau mungkin perintah lo aja yang ngaco. Coba lagi gih.";
    }
    if (lowerCaseError.includes('network') || lowerCaseError.includes('timeout') || lowerCaseError.includes('failed to fetch') || lowerCaseError.includes('jaringannya jelek')) {
         return "Jaringan lo payah, atau mungkin gue lagi males aja. Coba lagi nanti kalau koneksinya udah bener.";
    }
    
    // Generic fallback for anything else
    return `Ada yang rusak. Mungkin sirkuit gue korslet, mungkin juga lo yang bikin error. Entahlah. Coba lagi aja, siapa tahu beruntung.`;
};


const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; message: Message } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [animatedMessageId, setAnimatedMessageId] = useState<string | null>(null);
  const [retryConfirmationMessage, setRetryConfirmationMessage] = useState<Message | null>(null);
  const [lastSubmission, setLastSubmission] = useState<{ prompt: string; file: File | null } | null>(null);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);


  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);


  const addMessage = (role: Role, text?: string, imageUrl?: string, fileInfo?: FileInfo): string => {
    const id = `${Date.now()}-${Math.random()}`;
    setMessages(prev => [...prev, { id, role, text, imageUrl, fileInfo }]);
    return id;
  };

  const handleSubmit = async (prompt: string, attachedFile: File | null) => {
    if (!prompt && !attachedFile) return;

    // Store submission for potential retry
    setLastSubmission({ prompt, file: attachedFile });

    setIsLoading(true);
    setError(null);
    setAnimatedMessageId(null);
    
    const trimmedPrompt = prompt.trim().toLowerCase();

    // Handle /help command
    if (trimmedPrompt === '/help') {
        addMessage('user', prompt);
        const helpText = `Dengar, ini bukan ilmu roket. Begini cara kerja gue:\n\n**1. Ngobrol Biasa:**\nKetik apa aja yang ada di otak lo. Gue bakal jawab... mungkin dengan sarkasme.\n\n**2. Bikin Gambar:**\n*   Gunakan perintah \`/gambar\` diikuti deskripsi.\n*   **Contoh:** \`/gambar naga siberpunk di atas kota neon\`\n*   Lo bisa tambahin flag kayak \`--aspect 16:9\`, \`--width 1024\`, atau \`--height 768\` buat ngatur gambar.\n\n**3. Analisis & Modifikasi File:**\n*   Klik ikon **penjepit kertas** buat unggah file (gambar atau PDF).\n*   **Unggah gambar:** Kasih perintah buat ngubahnya, atau biarin kosong biar gue yang berimajinasi.\n*   **Unggah PDF:** Gue bakal ringkasin isinya. Gak usah repot-repot baca.\n\nUdah ngerti? Sekarang jangan ganggu gue lagi kecuali ada yang penting.`;
        const newMsgId = addMessage('model', helpText);
        setAnimatedMessageId(newMsgId);
        setIsLoading(false);
        return;
    }


    // Explicitly check for /gambar command first
    if (trimmedPrompt.startsWith('/gambar')) {
        if (attachedFile) {
            // Block and guide user if they use /gambar with an attachment
            setError("Gagal paham. Mau bikin gambar baru dari teks, atau mau ubah gambar yang ada? Kalau mau bikin, pakai `/gambar` aja. Kalau mau ubah, lampirin gambarnya tanpa `/gambar`. Jangan dua-dua-nya.");
            setIsLoading(false);
            return;
        }

        // --- IMAGE GENERATION FLOW ---
        const imagePrompt = prompt.trim().substring(7).trim();

        if (!imagePrompt) {
            setError("Perintah `/gambar` butuh deskripsi, jenius.");
            setIsLoading(false);
            return;
        }
        
        addMessage('user', prompt);

        try {
            const imageUrl = await generateImage(imagePrompt);
            const responseText = "Sesuai perintah, bos. Nih gambarnya.";
            const newMsgId = addMessage('model', responseText, imageUrl);
            setAnimatedMessageId(newMsgId);
        } catch (err) {
            const nexusErrorMessage = getNexusErrorMessage(err);
            setError(nexusErrorMessage);
            const newMsgId = addMessage('model', nexusErrorMessage);
            setAnimatedMessageId(newMsgId);
        } finally {
            setIsLoading(false);
        }
        return;
    }

    // --- TEXT/ANALYSIS/IMAGE MODIFICATION FLOW ---
    let userMessageText = prompt;
    let imageUrlForBubble: string | undefined;
    let fileInfo: FileInfo | undefined;
    let filePart: InlineDataPart | undefined;

    if (attachedFile) {
        try {
            fileInfo = {
                name: attachedFile.name,
                type: attachedFile.type,
                url: URL.createObjectURL(attachedFile)
            };
            if (attachedFile.type.startsWith('image/')) {
                imageUrlForBubble = fileInfo.url;
            }
            const base64Data = await fileToBase64(attachedFile);
            // Prioritize browser-detected MIME type, fallback to guessing from extension
            const mimeType = attachedFile.type || getMimeType(attachedFile.name);
            if (!mimeType) throw new Error("Tipe file tidak didukung.");
            filePart = { inlineData: { data: base64Data, mimeType } };
        } catch (err) {
            const nexusErrorMessage = getNexusErrorMessage(err);
            setError(nexusErrorMessage);
            setIsLoading(false);
            return;
        }

        if (!prompt) {
             if (attachedFile.type.startsWith('image/')) {
                // This is now an image modification prompt
                userMessageText = "Jelaskan gambar ini secara detail. Kalau ada teks, baca juga.";
            } else { // For PDF and other docs
                userMessageText = `Ringkasin isi dokumen "${attachedFile.name}" ini. Cepat, gue gak punya banyak waktu.`;
            }
        }
    }
    
    addMessage('user', userMessageText, imageUrlForBubble, fileInfo);

    try {
        // If an image is attached, it's a modification/analysis request
        if (attachedFile && attachedFile.type.startsWith('image/')) {
             const finalImagePrompt = prompt || "Imajinasi ulang gambar ini jadi sesuatu yang gak ngebosenin.";
             const imageUrl = await generateImage(finalImagePrompt, filePart);
             const responseText = prompt ? "Nih, udah gue ubah sesuai maumu." : "Nih, versi lebih kerennya. Sama-sama.";
             const newMsgId = addMessage('model', responseText, imageUrl);
             setAnimatedMessageId(newMsgId);
        } else {
            // Standard text generation or PDF analysis
            const aiResponse = await generateText(userMessageText, filePart);
            const newMsgId = addMessage('model', aiResponse);
            setAnimatedMessageId(newMsgId);
        }
    } catch (err) {
        const nexusErrorMessage = getNexusErrorMessage(err);
        setError(nexusErrorMessage);
        const newMsgId = addMessage('model', nexusErrorMessage);
        setAnimatedMessageId(newMsgId);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleContextMenu = (event: React.MouseEvent, message: Message) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, message });
  };

  const closeContextMenu = () => setContextMenu(null);

  const generateContextMenuOptions = (message: Message) => {
    const options = [];
    if (message.text) {
        options.push({ 
            label: "Salin Teks", 
            action: () => {
                navigator.clipboard.writeText(message.text!);
                closeContextMenu();
            },
            icon: <CopyIcon className="w-4 h-4 mr-2" />
        });
    }
    if (message.role === 'model' && message.imageUrl) {
        options.push({
            label: "Salin Gambar",
            action: () => {
                navigator.clipboard.writeText(message.imageUrl!);
                closeContextMenu();
            },
            icon: <ImageIcon className="w-4 h-4 mr-2" />
        });
        options.push({
            label: "Salin URL Gambar",
            action: () => {
                navigator.clipboard.writeText(message.imageUrl!);
                closeContextMenu();
            },
            icon: <LinkIcon className="w-4 h-4 mr-2" />
        });
    }
    if (message.role === 'user' && message.text) {
        options.push({
            label: "Coba Lagi",
            action: () => {
                setRetryConfirmationMessage(message);
                closeContextMenu();
            },
            icon: <RetryIcon className="w-4 h-4 mr-2" />
        });
    }
    return options;
  };

  const handleRetry = () => {
    if (lastSubmission) {
        setError(null); // Hide error UI immediately
        handleSubmit(lastSubmission.prompt, lastSubmission.file);
    }
  };

  const handleClearError = () => {
      setError(null);
  };

  const handleSaveChat = () => {
    if (messages.length === 0) {
        return;
    }
    try {
        // NOTE: Blob URLs from user-uploaded files won't be valid upon reloading.
        // The current request is only to save, not load, so this is acceptable.
        const chatHistory = JSON.stringify(messages);
        localStorage.setItem('nexus-chat-history', chatHistory);
        // Visual feedback is handled in the Header component.
    } catch (err) {
        console.error("Gagal menyimpan riwayat chat:", err);
        setError("Gagal menyimpan chat. Mungkin penyimpanan lokal browser Anda penuh.");
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    localStorage.removeItem('nexus-chat-history');
    setShowClearConfirmation(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
      <Header 
        onSaveChat={handleSaveChat} 
        isChatEmpty={messages.length === 0}
        onRequestClearChat={() => setShowClearConfirmation(true)}
      />
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 ? <WelcomeScreen /> : <MessageList messages={messages} isLoading={isLoading} onContextMenu={handleContextMenu} animatedMessageId={animatedMessageId} />}
      </div>
      <div className="px-4 md:px-6 pb-4">
        {error && (
            <div className="bg-red-900/40 border border-red-500/50 rounded-lg p-3 mb-3 flex items-center justify-between animate-fade-in">
                <div className="flex items-center min-w-0">
                    <AlertIcon className="w-5 h-5 text-red-400 shrink-0"/>
                    <p className="text-red-300 text-sm ml-3 truncate" title={error}>{error}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                    <button
                        onClick={handleRetry}
                        className="text-xs font-semibold text-white bg-red-600/60 hover:bg-red-600 px-3 py-1 rounded-md transition-colors"
                    >
                        Coba Lagi
                    </button>
                    <button
                        onClick={handleClearError}
                        className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        aria-label="Tutup"
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}
        <InputBar onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          options={generateContextMenuOptions(contextMenu.message)}
        />
      )}
      {retryConfirmationMessage && (
        <ConfirmationDialog
          title="Kirim Ulang Pesan?"
          message="Anda yakin ingin mengirim ulang pesan ini ke Nexus untuk dianalisis lagi?"
          onConfirm={() => {
            if (retryConfirmationMessage?.text) {
                // NOTE: This does not re-attach the file from the original message.
                // It only retries with the text prompt.
                handleSubmit(retryConfirmationMessage.text, null);
            }
            setRetryConfirmationMessage(null);
          }}
          onCancel={() => setRetryConfirmationMessage(null)}
          confirmLabel="Ya, Kirim Ulang"
        />
      )}
      {showClearConfirmation && (
        <ConfirmationDialog
          title="Hapus Riwayat Chat?"
          message="Tindakan ini akan menghapus semua pesan secara permanen. Anda yakin?"
          onConfirm={handleClearChat}
          onCancel={() => setShowClearConfirmation(false)}
          confirmLabel="Ya, Hapus"
          cancelLabel="Batal"
          confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
        />
      )}
    </div>
  );
};

export default App;
