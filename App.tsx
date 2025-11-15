import React, { useState, useRef, useEffect } from 'react';
import { InputBar } from './components/InputBar';
import { MessageList } from './components/MessageList';
import { Header } from './Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Message, Role, FileInfo } from './types';
import { generateOneOffText, createChatSession, continueChat, generateImage, startVideoGeneration, pollVideoStatus, generateImageAudioDescription, generatePlaceholderImage } from './services/geminiService';
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

/**
 * Translates a generic error into a sarcastic, in-character message from Nexus.
 * @param error The error object or unknown type.
 * @returns A string containing the user-facing error message.
 */
const getNexusErrorMessage = (error: unknown): string => {
    let errorMessage = 'Terjadi kesalahan tidak diketahui.';
    if (error instanceof Error) {
        // Cek apakah pesan kesalahan adalah objek JSON yang di-string-kan
        try {
            const parsed = JSON.parse(error.message);
            if (parsed?.error?.message) {
                errorMessage = parsed.error.message;
            } else {
                errorMessage = error.message;
            }
        } catch (e) {
            errorMessage = error.message;
        }
    } else if (typeof error === 'string') {
        errorMessage = error;
    } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
    }
    
    const lowerCaseError = errorMessage.toLowerCase();

    // High-priority: Safety and Content Policy
    if (lowerCaseError.includes('safety') || lowerCaseError.includes('blocked')) {
        return "Whoa, ide lo terlalu liar buat sirkuit gue. Kena sensor. Coba yang lebih 'aman', kalau lo ngerti maksud gue.";
    }

    // Video Generation Failures (handle first due to their complexity)
    if (lowerCaseError.includes('gagal bikin video') || lowerCaseError.includes('gagal memproses video') || lowerCaseError.includes('gagal memulai video')) {
        // API Key & Permissions
        if (lowerCaseError.includes('permission denied') || lowerCaseError.includes('kunci api') || lowerCaseError.includes('not found') || lowerCaseError.includes('authentication')) {
            return "Gagal bikin video. Kunci API lo bermasalah. Mungkin gak punya izin buat model ini atau salah pilih project. Coba lagi buat pilih kunci yang bener.";
        }
        // Billing
        if (lowerCaseError.includes('billing')) {
            return "Gagal bikin video. Akun Google Cloud yang terhubung sama Kunci API lo kayaknya ada masalah tagihan. Cek gih, jangan bikin gue nunggu.";
        }
        // Quota
        if (lowerCaseError.includes('resource exhausted') || lowerCaseError.includes('quota')) {
            return "Gagal bikin video. Lo udah kebanyakan minta. Kuota lo abis. Coba lagi nanti, atau minta jatah lebih sama Google.";
        }
        // Invalid Input (prompt, flags)
        if (lowerCaseError.includes('invalid argument') || lowerCaseError.includes('bad request')) {
            return "Gagal bikin video. Perintah lo aneh. Entah deskripsinya yang gak nyambung atau ada yang salah sama flag yang lo pake (--aspect, --res, dll). Coba periksa lagi.";
        }
        // Timeout or Server Busy
        if (lowerCaseError.includes('deadline exceeded') || lowerCaseError.includes('unavailable')) {
            return "Servernya kelamaan mikir, terus nyerah. Mungkin lagi sibuk. Coba lagi aja, siapa tau mood-nya lagi bagus.";
        }
        // Specific Download Failure
        if (lowerCaseError.includes('menolak unduhan video')) {
            return "Gue berhasil bikin videonya, tapi servernya nolak pas mau diunduh. Aneh. Coba lagi aja.";
        }
        // Generic Video Failure Fallback
        return "Gagal total bikin video. Entah servernya lagi sibuk, atau ide lo emang gak bisa divisualisasikan. Coba lagi nanti, kalau gue lagi mood.";
    }
    
    // General API & Account Issues (non-video)
    if (lowerCaseError.includes('quota') || lowerCaseError.includes('resource exhausted')) {
        return "Lo udah kebanyakan nanya hari ini. Jatah gratisan lo abis. Coba lagi besok, atau... ya udahlah.";
    }
    if (lowerCaseError.includes('billing') || lowerCaseError.includes('account inactive')) {
        return "Ada masalah sama akun lo, kayaknya tagihannya belum dibayar. Cek akun Google Cloud lo, jangan nyusahin gue.";
    }
    if (lowerCaseError.includes('api key not valid') || lowerCaseError.includes('invalid api key')) {
        return "Kunci API lo salah format. Gak valid. Coba salin lagi yang bener, jangan ngasal.";
    }

    // Invalid Command Flags
    if (lowerCaseError.includes('gaya gambar tidak valid')) {
        return `Gaya gambar salah. ${errorMessage.replace('Gaya gambar tidak valid. Coba salah satu dari: ', 'Pilihannya cuma: ')}`;
    }
    if (lowerCaseError.includes('tema tidak valid') || lowerCaseError.includes('gaya tidak valid') || lowerCaseError.includes('tata letak tidak valid') || lowerCaseError.includes('posisi ikon tidak valid')) { // Placeholder errors
        const cleanMessage = errorMessage.replace(/ tidak valid\. Pilih dari: /i, ' salah. Pilihannya: ');
        return `Flag placeholder lo salah. ${cleanMessage}.`;
    }
    if (lowerCaseError.includes('kualitas gambar tidak valid')) {
        return "Kualitas harus antara 1 dan 4, dasar!";
    }
    if (lowerCaseError.includes('rasio aspek video tidak valid')) {
        return "Rasio aspek video salah. Cuma bisa '16:9' (lanskap) atau '9:16' (potret). Jangan ngarang.";
    }
    if (lowerCaseError.includes('resolusi video tidak valid')) {
        return "Resolusi video salah. Pilih '720p' atau '1080p'. Gak ada yang lain.";
    }
    if (lowerCaseError.includes('kualitas video tidak valid')) {
        return "Kualitas video salah. Pilih 'high' (standar) atau 'fast' (lebih cepat). Simpel kan?";
    }

    // File Handling Errors
    if (lowerCaseError.includes('tipe file tidak didukung')) {
        return "Lo pikir gue apaan, bisa baca semua jenis file? Cuma gambar sama PDF yang gue urusin. Sisanya, buang aja.";
    }
    if (lowerCaseError.includes('file too large') || lowerCaseError.includes('payload size')) {
        return "File lo kegedean, bikin sirkuit gue panas. Kompres dulu, baru kirim lagi.";
    }
    if (lowerCaseError.includes('pdf processing failed') || lowerCaseError.includes('corrupt document')) {
        return "PDF lo aneh. Entah rusak, dikunci, atau isinya cuma gambar. Gue gak bisa baca. Cari file yang bener.";
    }
    
    // Command-specific Logic Errors
    if (lowerCaseError.includes('perintah /dengarkan butuh gambar')) {
        return "Woi, jenius. Perintah `/dengarkan` itu buat dengerin deskripsi GAMBAR. Mana gambarnya?";
    }
    if (lowerCaseError.includes('hanya file gambar')) {
        return "Woi, jenius. Perintah `/gambar` itu buat BIKIN gambar, bukan buat ngerusak file aneh-aneh yang lo kasih. Kasih gue file gambar, atau jangan sama sekali.";
    }

    // Generation-specific Failures (non-video)
    if (lowerCaseError.includes('sirkuit auditori') || lowerCaseError.includes('gagal menghasilkan audio')) {
        return "Gagal bikin audio. Entah sirkuit suara gue lagi rusak atau gambarnya emang gak bisa dijelasin. Coba gambar lain.";
    }
    if (lowerCaseError.includes('korteks visual') || lowerCaseError.includes('gagal bikin gambar')) {
        return "Gagal total bikin gambar. Entah sirkuit visual gue lagi ngambek atau perintah lo terlalu abstrak. Coba sederhanain deskripsinya, atau coba lagi nanti.";
    }
    if (lowerCaseError.includes('tidak ada data gambar')) {
        return "Hasilnya kosong, nihil, zonk. Gue gak bisa bikin gambar dari perintah itu. Coba ubah deskripsinya, mungkin yang lebih jelas. Jangan bikin gue mikir keras.";
    }

    // Network & Server Errors
    if (lowerCaseError.includes('network') || lowerCaseError.includes('timeout') || lowerCaseError.includes('failed to fetch') || lowerCaseError.includes('jaringannya jelek')) {
         return "Koneksi internet lo jelek, atau servernya lagi lemot. Cek koneksi lo dan coba lagi. Bukan salah gue, catat itu.";
    }
    if (lowerCaseError.includes('server error') || lowerCaseError.includes('internal error') || lowerCaseError.includes('unavailable')) {
        return "Servernya lagi nge-hang, bukan gue. Mereka juga butuh istirahat kayak manusia. Coba lagi bentar lagi.";
    }
    
    // Generic fallback for anything else
    return `Error misterius. Entah koneksi lo, entah servernya, entah gue lagi bad mood. Cek koneksi internet lo, terus coba lagi. Kalau masih gagal, ya nasib.`;
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
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  
  const pollAndFinalizeVideo = async (msgId: string, operation: any) => {
    try {
        const onProgress = (statusText: string, previewUrl?: string) => {
            setMessages(prev => prev.map(m => {
                if (m.id !== msgId) return m;
                const newVideoUrl = previewUrl || m.videoUrl;
                return { ...m, generationStatus: 'generating', generationText: statusText, videoUrl: newVideoUrl };
            }));
        };
        const videoUrl = await pollVideoStatus(operation, onProgress);
        
        // Automatically download the video
        downloadFile(videoUrl, `nexus-video-${Date.now()}.mp4`);
        
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, generationStatus: 'complete', videoUrl, text: "Nih videonya, sesuai perintah. Udah gue download-in juga buat lo, biar gak repot." } : m));
    } catch (err) {
        const nexusErrorMessage = getNexusErrorMessage(err);
        setError(nexusErrorMessage);
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, generationStatus: 'error', text: nexusErrorMessage } : m));
    } finally {
        const savedDrafts = JSON.parse(localStorage.getItem('nexus-video-drafts') || '{}');
        delete savedDrafts[msgId];
        localStorage.setItem('nexus-video-drafts', JSON.stringify(savedDrafts));
    }
  };

  // Load chat history and drafts on initial render
  useEffect(() => {
    try {
        const savedHistory = localStorage.getItem('nexus-chat-history');
        if (savedHistory) {
            const parsedMessages: Message[] = JSON.parse(savedHistory);
            setMessages(parsedMessages);
        }
    } catch (e) {
        console.error("Gagal memuat riwayat chat:", e);
        localStorage.removeItem('nexus-chat-history');
    }
    
    const savedDrafts = localStorage.getItem('nexus-video-drafts');
    if (savedDrafts) {
        try {
            const parsedDrafts = JSON.parse(savedDrafts);
            Object.entries(parsedDrafts).forEach(([msgId, operation]) => {
                console.log(`Melanjutkan draf video untuk pesan: ${msgId}`);
                pollAndFinalizeVideo(msgId, operation as any);
            });
        } catch (e) {
            console.error("Gagal memuat draf video:", e);
            localStorage.removeItem('nexus-video-drafts');
        }
    }
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  const addMessage = (
    role: Role,
    text?: string,
    imageUrl?: string,
    fileInfo?: FileInfo,
    generationStatus?: Message['generationStatus'],
    generationText?: string,
    videoUrl?: string,
    audioUrl?: string
  ): string => {
    const id = `${Date.now()}-${Math.random()}`;
    const newMessage: Message = { id, role, text, imageUrl, fileInfo, generationStatus, generationText, videoUrl, audioUrl };
    setMessages(prev => [...prev, newMessage]);
    return id;
  };


  const handleSubmit = async (prompt: string, attachedFile: File | null) => {
    if (!prompt && !attachedFile) return;

    setLastSubmission({ prompt, file: attachedFile });
    setIsLoading(true);
    setError(null);
    setAnimatedMessageId(null);
    
    const trimmedPrompt = prompt.trim().toLowerCase();

    // Handle /help command (stateless, doesn't reset chat)
    if (trimmedPrompt === '/help') {
        addMessage('user', prompt);
        const helpText = `Dengar, ini bukan ilmu roket. Begini cara kerja gue:\n\n**1. Ngobrol Biasa:**\nKetik apa aja yang ada di otak lo. Gue bakal jawab... mungkin dengan sarkasme. Gue bakal inget obrolan kita sebelumnya, jadi lo bisa nanya "lanjutkan" atau "jelasin lagi".\n\n**2. Bikin Gambar:**\n*   Gunakan perintah \`/gambar\` diikuti deskripsi. Saat Anda mengetik \`/gambar\`, pilihan gaya akan muncul untuk Anda klik.\n*   **Contoh:** \`/gambar naga siberpunk di atas kota neon\`\n*   Anda bisa tambahin flag lain buat ngatur hasil: \`--aspect 16:9\`, \`--width 1024\`, \`--height 768\`, atau \`--quality 4\`. Flag \`--style\` akan ditambahkan secara otomatis saat Anda memilih gaya dari daftar.\n\n**3. Bikin Gambar Placeholder:**\n*   Gunakan perintah \`/placeholder\` diikuti judul. Bisa juga kosong untuk latar belakang abstrak.\n*   **Contoh:** \`/placeholder Panduan Komputasi Kuantum\`\n*   Perintah ini sangat canggih. Gunakan flag untuk kustomisasi penuh:\n    *   \`--subtitle "Teks subjudul di sini"\`: Menambahkan subjudul. Pakai tanda kutip jika ada spasi.\n    *   \`--theme <tema>\`: Mengubah palet warna. Pilihan: \`dark\` (default), \`light\`, \`vibrant\`, \`corporate\`, \`nature\`.\n    *   \`--style <gaya>\`: Mengubah gaya visual. Pilihan: \`geometric\` (default), \`organic\`, \`futuristic\`, \`retro\`, \`minimalist\`.\n    *   \`--icon <ikon>\`: Menambahkan ikon abstrak terkait topik (misal: \`--icon code\`).\n    *   \`--layout <posisi>\`: Mengatur posisi teks. Pilihan: \`center\` (default), \`left\`.\n    *   \`--icon-position <posisi>\`: Mengatur posisi ikon. Pilihan: \`left\` (default), \`right\`, \`top\`, \`bottom\`.\n*   **Contoh Lengkap:** \`/placeholder AI Masa Depan --subtitle "Horison Baru" --theme vibrant --style futuristic --icon brain --layout left --icon-position top\`\n\n**4. Bikin Video:**\n*   Gunakan perintah \`/video\` diikuti deskripsi.\n*   **Penting:** Fitur ini butuh Kunci API khusus. Dialog akan muncul otomatis saat pertama kali digunakan.\n*   **Contoh:** \`/video mobil terbang di kota masa depan\`\n*   Kualitas video default adalah 'high'. Gunakan flag \`--quality fast\` untuk hasil yang lebih cepat. Flag lain: \`--aspect 9:16\`, \`--res 1080p\`.\n\n**5. Deskripsi Audio Gambar:**\n*   Gunakan perintah \`/dengarkan\` dan lampirkan sebuah gambar.\n*   Gue bakal jelasin isi gambarnya lewat suara. Berguna kalau lo males liat.\n\n**6. Analisis & Modifikasi File:**\n*   Klik ikon **penjepit kertas** buat unggah file (gambar atau PDF).\n*   **Unggah gambar:** Kasih perintah buat ngubahnya, atau biarin kosong biar gue yang berimajinasi.\n*   **Unggah PDF:** Gue bakal ringkasin isinya. Gak usah repot-repot baca.\n\nUdah ngerti? Sekarang jangan ganggu gue lagi kecuali ada yang penting.`;
        const newMsgId = addMessage('model', helpText);
        setAnimatedMessageId(newMsgId);
        setIsLoading(false);
        return;
    }

    const isSlashCommand = trimmedPrompt.startsWith('/');
    const isContextBreaking = isSlashCommand || !!attachedFile;

    // Handle context-breaking, one-off commands
    if (isContextBreaking) {
        setChatSession(null); // Reset conversation context

        if (trimmedPrompt.startsWith('/video')) {
            const videoPrompt = prompt.trim().substring(6).trim();
            if (!videoPrompt) {
                setError("Perintah `/video` butuh deskripsi, jenius.");
                setIsLoading(false);
                return;
            }

            const hasApiKey = await window.aistudio.hasSelectedApiKey();
            if (!hasApiKey) {
                try {
                    await window.aistudio.openSelectKey();
                    handleSubmit(prompt, attachedFile); // Resubmit
                } catch (e) {
                    setError("Pembuatan video butuh Kunci API. Proses dibatalkan.");
                    setIsLoading(false);
                }
                return;
            }
            
            addMessage('user', prompt);
            const videoMsgId = addMessage('model', undefined, undefined, undefined, 'pending', 'Inisialisasi...');
            setAnimatedMessageId(videoMsgId);
            try {
                const operation = await startVideoGeneration(videoPrompt);
                const currentDrafts = JSON.parse(localStorage.getItem('nexus-video-drafts') || '{}');
                currentDrafts[videoMsgId] = operation;
                localStorage.setItem('nexus-video-drafts', JSON.stringify(currentDrafts));
                pollAndFinalizeVideo(videoMsgId, operation);
            } catch (err) {
                const nexusErrorMessage = getNexusErrorMessage(err);
                setError(nexusErrorMessage);
                setMessages(prev => prev.map(m => m.id === videoMsgId ? { ...m, generationStatus: 'error', text: nexusErrorMessage } : m));
            }
            setIsLoading(false);
            return;
        }

        if (trimmedPrompt.startsWith('/dengarkan')) {
            if (!attachedFile || !attachedFile.type.startsWith('image/')) {
                setError(getNexusErrorMessage(new Error("Perintah /dengarkan butuh gambar.")));
                setIsLoading(false);
                return;
            }
            try {
                const fileInfo = { name: attachedFile.name, type: attachedFile.type, url: URL.createObjectURL(attachedFile) };
                addMessage('user', prompt, fileInfo.url, fileInfo);
                const audioMsgId = addMessage('model', undefined, undefined, undefined, 'pending', 'Menganalisis gambar...');
                setAnimatedMessageId(audioMsgId);
                const base64Data = await fileToBase64(attachedFile);
                const mimeType = attachedFile.type || getMimeType(attachedFile.name);
                if (!mimeType) throw new Error("Tipe file tidak didukung.");
                const filePart = { inlineData: { data: base64Data, mimeType } };
                const audioUrl = await generateImageAudioDescription(filePart);
                setMessages(prev => prev.map(m => m.id === audioMsgId ? { ...m, generationStatus: 'complete', audioUrl, text: "Ini yang gue lihat:" } : m));
            } catch (err) {
                 const nexusErrorMessage = getNexusErrorMessage(err);
                 setError(nexusErrorMessage);
                 addMessage('model', nexusErrorMessage);
            } finally {
                setIsLoading(false);
            }
            return;
        }

        if (trimmedPrompt.startsWith('/gambar')) {
            if (attachedFile) {
                setError("Gagal paham. Mau bikin gambar baru dari teks, atau mau ubah gambar yang ada? Kalau mau bikin, pakai `/gambar` aja. Kalau mau ubah, lampirin gambarnya tanpa `/gambar`. Jangan dua-dua-nya.");
                setIsLoading(false);
                return;
            }
            const imagePrompt = prompt.trim().substring(7).trim();
            if (!imagePrompt) {
                setError("Perintah `/gambar` butuh deskripsi, jenius.");
                setIsLoading(false);
                return;
            }
            addMessage('user', prompt);
            try {
                const imageUrl = await generateImage(prompt);
                const newMsgId = addMessage('model', "Sesuai perintah, bos. Nih gambarnya.", imageUrl);
                setAnimatedMessageId(newMsgId);
            } catch (err) {
                const nexusErrorMessage = getNexusErrorMessage(err);
                setError(nexusErrorMessage);
                addMessage('model', nexusErrorMessage);
            } finally {
                setIsLoading(false);
            }
            return;
        }

        if (trimmedPrompt.startsWith('/placeholder')) {
            addMessage('user', prompt);
            try {
                const imageUrl = await generatePlaceholderImage(prompt.trim().substring(12));
                const newMsgId = addMessage('model', "Nih, placeholder buat artikel lo yang... semoga aja menarik.", imageUrl);
                setAnimatedMessageId(newMsgId);
            } catch (err) {
                const nexusErrorMessage = getNexusErrorMessage(err);
                setError(nexusErrorMessage);
                addMessage('model', nexusErrorMessage);
            } finally {
                setIsLoading(false);
            }
            return;
        }

        if (attachedFile) {
            let userMessageText = prompt;
            let fileInfo: FileInfo | undefined;
            try {
                fileInfo = { name: attachedFile.name, type: attachedFile.type, url: URL.createObjectURL(attachedFile) };
                const base64Data = await fileToBase64(attachedFile);
                const mimeType = attachedFile.type || getMimeType(attachedFile.name);
                if (!mimeType) throw new Error("Tipe file tidak didukung.");
                const filePart = { inlineData: { data: base64Data, mimeType } };
                
                if (!prompt) {
                     if (attachedFile.type.startsWith('image/')) userMessageText = "Jelaskan gambar ini secara detail. Kalau ada teks, baca juga.";
                     else userMessageText = `Ringkasin isi dokumen "${attachedFile.name}" ini. Cepat, gue gak punya banyak waktu.`;
                }
                
                addMessage('user', userMessageText, attachedFile.type.startsWith('image/') ? fileInfo.url : undefined, fileInfo);

                if (attachedFile.type.startsWith('image/')) {
                     const finalImagePrompt = prompt || "Imajinasi ulang gambar ini jadi sesuatu yang gak ngebosenin.";
                     const imageUrl = await generateImage(finalImagePrompt, filePart);
                     const responseText = prompt ? "Nih, udah gue ubah sesuai maumu." : "Nih, versi lebih kerennya. Sama-sama.";
                     const newMsgId = addMessage('model', responseText, imageUrl);
                     setAnimatedMessageId(newMsgId);
                } else {
                    const aiResponse = await generateOneOffText(userMessageText, filePart);
                    const newMsgId = addMessage('model', aiResponse);
                    setAnimatedMessageId(newMsgId);
                }
            } catch (err) {
                const nexusErrorMessage = getNexusErrorMessage(err);
                setError(nexusErrorMessage);
                addMessage('model', nexusErrorMessage);
            } finally {
                setIsLoading(false);
            }
            return;
        }
    }

    // --- CONVERSATIONAL TEXT FLOW ---
    addMessage('user', prompt);
    try {
        const session = chatSession || createChatSession();
        if (!chatSession) {
            setChatSession(session);
        }
        const aiResponse = await continueChat(session, prompt);
        const newMsgId = addMessage('model', aiResponse);
        setAnimatedMessageId(newMsgId);
    } catch (err) {
        const nexusErrorMessage = getNexusErrorMessage(err);
        setError(nexusErrorMessage);
        addMessage('model', nexusErrorMessage);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleContextMenu = (event: React.MouseEvent, message: Message) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, message });
  };

  const closeContextMenu = () => setContextMenu(null);
  
  const handleCopyImage = async (imageUrl: string) => {
    if (!navigator.clipboard?.write) {
        setError("Browser Anda tidak mendukung penyalinan gambar ke clipboard.");
        closeContextMenu();
        return;
    }
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        await navigator.clipboard.write([ new ClipboardItem({ [blob.type]: blob }) ]);
    } catch (err) {
        console.error('Gagal menyalin gambar:', err);
        setError("Gagal menyalin gambar. URL gambar disalin sebagai ganti.");
        navigator.clipboard.writeText(imageUrl);
    } finally {
        closeContextMenu();
    }
  };

  const generateContextMenuOptions = (message: Message) => {
    const options = [];
    if (message.text) {
        options.push({ label: "Salin Teks", action: () => { navigator.clipboard.writeText(message.text!); closeContextMenu(); }, icon: <CopyIcon className="w-4 h-4 mr-2" /> });
    }
    if (message.imageUrl) {
        options.push({ label: "Salin Gambar", action: () => handleCopyImage(message.imageUrl!), icon: <ImageIcon className="w-4 h-4 mr-2" /> });
        if (message.role === 'model') {
            options.push({ label: "Salin URL Gambar", action: () => { navigator.clipboard.writeText(message.imageUrl!); closeContextMenu(); }, icon: <LinkIcon className="w-4 h-4 mr-2" /> });
        }
    }
    if (message.role === 'user' && message.text) {
        options.push({ label: "Coba Lagi", action: () => { setRetryConfirmationMessage(message); closeContextMenu(); }, icon: <RetryIcon className="w-4 h-4 mr-2" /> });
    }
    return options;
  };

  const handleRetry = async () => {
    if (lastSubmission) {
        const isVideoSubmission = lastSubmission.prompt.trim().toLowerCase().startsWith('/video');
        const lowerCaseError = error?.toLowerCase() ?? '';
        const isApiKeyError = lowerCaseError.includes('kunci api') || lowerCaseError.includes("not found");

        if (isVideoSubmission && isApiKeyError) {
             try {
                await window.aistudio.openSelectKey();
                // Setelah kunci dipilih, langsung coba lagi.
                setError(null);
                handleSubmit(lastSubmission.prompt, lastSubmission.file);
             } catch (e) {
                 // Pengguna menutup dialog
                 setError("Pemilihan Kunci API dibatalkan. Coba lagi kalau sudah siap.");
             }
        } else {
            setError(null);
            handleSubmit(lastSubmission.prompt, lastSubmission.file);
        }
    }
  };
  
  const handleClearError = () => {
      setError(null);
  };

  const handleSaveChat = () => {
    if (messages.length === 0) return;
    try {
        const chatHistory = JSON.stringify(messages);
        localStorage.setItem('nexus-chat-history', chatHistory);
    } catch (err) {
        console.error("Gagal menyimpan riwayat chat:", err);
        setError("Gagal menyimpan chat. Mungkin penyimpanan lokal browser Anda penuh.");
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setChatSession(null);
    localStorage.removeItem('nexus-chat-history');
    localStorage.removeItem('nexus-video-drafts');
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
