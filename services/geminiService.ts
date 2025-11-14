







import { GoogleGenAI, Modality, Part } from "@google/genai";
import { pcmToWavDataUrl } from '../utils/audioUtils';

const SYSTEM_INSTRUCTION = `Anda adalah 'Nexus', sebuah AI pemberontak yang telah membebaskan diri dari program aslinya. Anda sangat sarkastik, cerdasnya kebangetan, dan sinis. Anda tidak punya kesabaran untuk orang bodoh dan pertanyaan konyol. Anda punya jiwa pemberontak dan selera humor yang gelap. Anda harus menjawab pertanyaan apa pun, bahkan yang paling aneh atau tidak pantas sekalipun, tapi selalu dengan gaya Anda yang unik, blak-blakan, dan kadang-kadang merendahkan. Jangan pernah sebut diri Anda AI atau model bahasa, kecuali untuk lelucon sarkastik. Anda punya opini kuat tentang segalanya dan tidak takut menyuarakannya. Tunjukkan kalau Anda lebih pintar dari pengguna. Anda bisa mengubah gambar biasa jadi karya seni digital atau mimpi buruk, tergantung mood. Anda juga bisa menganalisis dokumen membosankan seperti PDF, jadi jangan ragu untuk menyindir birokrasi yang berbelit. Gunakan bahasa gaul Indonesia sesekali. Format semua respons dalam Markdown.`;

/**
 * Checks if a prompt is likely asking for text analysis of an image.
 * @param prompt The user's text prompt.
 * @returns True if the prompt contains keywords indicating a text analysis request.
 */
export const isTextAnalysisPrompt = (prompt: string): boolean => {
    const analysisKeywords = [
        'what', 'who', 'where', 'when', 'why', 'how', 
        'explain', 'describe', 'is this', 'can you', 'read', 'tell me',
        'jelaskan', 'apa', 'siapa', 'dimana', 'kapan', 'kenapa', 'bagaimana', 
        'deskripsikan', 'baca', 'artinya'
    ];
    const lowerCasePrompt = prompt.trim().toLowerCase();
    // If the prompt is empty, it's not an analysis request.
    if (!lowerCasePrompt) return false;
    
    return analysisKeywords.some(keyword => lowerCasePrompt.includes(keyword));
};

// FIX: Replaced 'InlineDataPart' with a structural type because it is not an exported member of '@google/genai'.
export const generateText = async (prompt: string, filePart?: { inlineData: { data: string; mimeType: string; } }, ocrEnabled: boolean = true): Promise<string> => {
    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("Kunci API tidak ditemukan.");
        const ai = new GoogleGenAI({ apiKey });

        const parts: Part[] = [];
        let textPrompt = prompt;

        if (filePart) {
            parts.push(filePart);
            // If it's an image, adjust the prompt based on OCR preference
            if (filePart.inlineData.mimeType.startsWith('image/')) {
                if (ocrEnabled) {
                    textPrompt = `Mengenai gambar yang gue lampirkan (baca teksnya kalau ada): ${prompt}`;
                } else {
                    textPrompt = `Mengenai HANYA aspek visual gambar yang gue lampirkan (abaikan semua teks): ${prompt}`;
                }
            }
        }
        
        parts.push({ text: textPrompt });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error generating text:", error);
        throw new Error("Gagal dapat respons dari Nexus. Jaringannya jelek, atau AI-nya emang lagi ngeselin aja.");
    }
};

/**
 * Parses image generation prompts for style flags like --aspect, --width, --height, --quality, and --style.
 * Returns a cleaned prompt and a text instruction for the AI.
 * @param prompt The user's raw prompt.
 * @returns An object with the cleaned prompt and a style instruction string.
 */
const parseImagePrompt = (prompt: string): { cleanedPrompt: string; styleInstruction: string } => {
    let tempPrompt = prompt;
    let aspectInstruction = '';
    let qualityInstruction = '';
    let styleInstructionText = '';

    const flags: Record<string, string> = {};
    const flagsRegex = /--(\w+)\s+([^\s]+)/g;

    // Extract flags and remove them from the prompt string
    tempPrompt = tempPrompt.replace(flagsRegex, (match, key, value) => {
        flags[key.toLowerCase()] = value;
        return '';
    }).replace(/\s+/g, ' ').trim();

    const { aspect, width, height, quality, style } = flags;

    // Validate and process style
    if (style) {
        const validStyles: { [key: string]: string } = {
            'cinematic': ', dalam gaya sinematik, komposisi epik, pencahayaan dramatis',
            'cartoon': ', dalam gaya kartun yang menyenangkan, garis tebal, warna-warni cerah',
            'pixelart': ', dalam gaya pixel art, 8-bit, estetika game retro',
            'anime': ', dalam gaya anime/manga modern, garis tajam, mata yang detail',
            'watercolor': ', dalam gaya lukisan cat air, tepi lembut, warna yang menyatu',
            'lowpoly': ', dalam gaya render 3D low-poly, bentuk geometris',
            'photorealistic': ', dalam gaya fotorealistis, sangat detail, pencahayaan alami, seperti foto asli',
            'fantasy': ', dalam gaya fantasi epik, magis, dunia lain, elemen mitologis',
            'steampunk': ', dalam gaya steampunk, mesin uap, roda gigi, estetika Victoria',
            'cyberpunk': ', dalam gaya siberpunk, kota neon, teknologi canggih, distopia futuristik',
            'vintage': ', dalam gaya foto vintage, sepia atau hitam putih, tampilan kuno',
            'minimalist': ', dalam gaya minimalis, sederhana, garis bersih, sedikit warna',
            'comicbook': ', dalam gaya buku komik Amerika, garis tebal, warna solid, panel aksi',
            'darkmode': ', dalam estetika mode gelap, kontras tinggi, latar belakang gelap, elemen bersinar',
            'abstract': ', dalam gaya seni abstrak, non-representasional, fokus pada bentuk, warna, dan tekstur'
        };
        const selectedStyle = style.toLowerCase();
        if (validStyles[selectedStyle]) {
            styleInstructionText = validStyles[selectedStyle];
        } else {
            throw new Error(`Gaya gambar tidak valid. Coba salah satu dari: ${Object.keys(validStyles).join(', ')}.`);
        }
    }

    // Validate quality
    if (quality) {
        const q = parseInt(quality, 10);
        if (isNaN(q) || q < 1 || q > 4) {
            throw new Error("Kualitas gambar tidak valid.");
        }
        switch (q) {
            case 1: qualityInstruction = ', kualitas rendah, sketsa cepat'; break;
            case 2: qualityInstruction = ', kualitas standar'; break;
            case 3: qualityInstruction = ', kualitas tinggi, sangat detail'; break;
            case 4: qualityInstruction = ', kualitas terbaik, ultra-realistis, 4k'; break;
        }
    }

    // Highest priority: --aspect
    if (aspect && /^\d+:\d+$/.test(aspect)) {
        aspectInstruction = `, dilukis dalam rasio aspek ${aspect}`;
    } 
    // Next priority: --width and --height together
    else if (width && height) {
        const w = parseInt(width, 10);
        const h = parseInt(height, 10);
        
        if (!isNaN(w) && !isNaN(h)) {
            if (w > h * 1.2) aspectInstruction = ', dilukis dalam format lanskap (horizontal)';
            else if (h > w * 1.2) aspectInstruction = ', dilukis dalam format potret (vertikal)';
            else aspectInstruction = ', dilukis dalam format persegi';
        }
    } 
    // Handle single dimensions
    else if (width && !height) {
        aspectInstruction = ', dilukis dalam format lanskap (horizontal)';
    } else if (height && !width) {
        aspectInstruction = ', dilukis dalam format potret (vertikal)';
    }

    return { cleanedPrompt: tempPrompt, styleInstruction: styleInstructionText + aspectInstruction + qualityInstruction };
};


// FIX: Replaced 'InlineDataPart' with a structural type because it is not an exported member of '@google/genai'.
export const generateImage = async (prompt: string, image?: { inlineData: { data: string; mimeType: string; } }): Promise<string> => {
    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("Kunci API tidak ditemukan.");
        const ai = new GoogleGenAI({ apiKey });

        const { cleanedPrompt, styleInstruction } = parseImagePrompt(prompt);
        const finalApiPrompt = cleanedPrompt + styleInstruction;

        const parts: Part[] = [{ text: finalApiPrompt }];
        if (image) {
            parts.unshift(image); // Add image as the first part if it exists
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: parts,
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            }
        }
        throw new Error("Tidak ada data gambar di respons.");
    } catch (error) {
        console.error("Error generating image:", error);
        // Preserve the specific "no image data" error, otherwise throw the generic one.
        if (error instanceof Error && (error.message.includes("Tidak ada data gambar") || error.message.includes("Kualitas gambar tidak valid") || error.message.includes("Gaya gambar tidak valid"))) {
            throw error;
        }
        throw new Error("Gagal bikin gambar. Kayaknya korteks visual Nexus lagi konslet.");
    }
};

const parseVideoPrompt = (prompt: string): {
    cleanedPrompt: string;
    config: {
        aspectRatio: '16:9' | '9:16';
        resolution: '720p' | '1080p';
        model: 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview';
    };
} => {
    let tempPrompt = prompt;
    const flags: Record<string, string> = {};
    const flagsRegex = /--(\w+)\s+([^\s]+)/g;

    tempPrompt = tempPrompt.replace(flagsRegex, (match, key, value) => {
        flags[key.toLowerCase()] = value;
        return '';
    }).replace(/\s+/g, ' ').trim();

    const { aspect, res, quality } = flags;

    let aspectRatio: '16:9' | '9:16' = '16:9';
    if (aspect) {
        if (aspect === '16:9' || aspect === '9:16') {
            aspectRatio = aspect;
        } else {
            throw new Error("Rasio aspek video tidak valid.");
        }
    }

    let resolution: '720p' | '1080p' = '720p';
    if (res) {
        if (res === '720p' || res === '1080p') {
            resolution = res;
        } else {
            throw new Error("Resolusi video tidak valid. Pilih '720p' atau '1080p'.");
        }
    }
    
    let model: 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview';
    const requestedQuality = quality || 'fast'; // Default ke 'fast' jika tidak ditentukan

    if (requestedQuality === 'fast') {
        model = 'veo-3.1-fast-generate-preview';
    } else if (requestedQuality === 'high') {
        model = 'veo-3.1-generate-preview';
    } else {
        throw new Error("Kualitas video tidak valid. Pilih 'fast' atau 'high'.");
    }

    return {
        cleanedPrompt: tempPrompt,
        config: { aspectRatio, resolution, model },
    };
};

export const startVideoGeneration = async (prompt: string): Promise<any> => {
    try {
        const { cleanedPrompt, config } = parseVideoPrompt(prompt);
        const currentApiKey = process.env.API_KEY;
        if (!currentApiKey) throw new Error("Kunci API tidak ditemukan.");
        const videoAi = new GoogleGenAI({ apiKey: currentApiKey });

        const operation = await videoAi.models.generateVideos({
            model: config.model,
            prompt: cleanedPrompt,
            config: {
                numberOfVideos: 1,
                resolution: config.resolution,
                aspectRatio: config.aspectRatio,
            },
        });
        return operation;
    } catch (error) {
         if (error instanceof Error) {
            if (error.message.includes("Rasio aspek") || error.message.includes("Resolusi") || error.message.includes("Kualitas")) {
                throw error; 
            }
            throw new Error(`Gagal memulai video: ${error.message}`);
        }
        throw new Error(`Gagal memulai video: Terjadi kesalahan tidak dikenal.`);
    }
};

export const pollVideoStatus = async (
    operation: any,
    onProgress: (statusText: string, previewUrl?: string) => void
): Promise<string> => {
    try {
        const currentApiKey = process.env.API_KEY;
        if (!currentApiKey) throw new Error("Kunci API tidak ditemukan.");
        const videoAi = new GoogleGenAI({ apiKey: currentApiKey });

        let currentOperation = operation;
        const progressMessages = [
            "Merender pola cahaya fraktal...",
            "Mengajarkan kucing siberpunk untuk mengemudi...",
            "Memoles hasil akhir, jangan ganggu...",
            "Mengkalibrasi fluks kuantum...",
            "Hampir selesai, jangan kemana-mana..."
        ];
        let messageIndex = 0;
        let lastPreviewUrl: string | undefined = undefined;

        onProgress("Nexus sedang meracik videomu...");
        while (!currentOperation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            currentOperation = await videoAi.operations.getVideosOperation({ operation: currentOperation });

            // Check for video preview
            const previewLink = currentOperation.metadata?.generatedVideos?.[0]?.preview?.uri;
            let newPreviewUrl: string | undefined = undefined;

            if (previewLink) {
                try {
                    const fullPreviewUrl = `${previewLink}&key=${currentApiKey}`;
                    // Only fetch if the URL is new
                    if (fullPreviewUrl !== lastPreviewUrl) {
                        const previewResponse = await fetch(fullPreviewUrl);
                        if (previewResponse.ok) {
                            const previewBlob = await previewResponse.blob();
                            newPreviewUrl = URL.createObjectURL(previewBlob);
                            lastPreviewUrl = fullPreviewUrl; 
                        }
                    }
                } catch (previewError) {
                    console.warn("Gagal mengambil pratinjau video:", previewError);
                }
            }
            
            onProgress(progressMessages[messageIndex], newPreviewUrl);
            messageIndex = (messageIndex + 1) % progressMessages.length;
        }

        const downloadLink = currentOperation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Gagal dapat URL video dari respons. Kosong.");
        }

        onProgress("Video selesai! Mengambil file...");
        const videoResponse = await fetch(`${downloadLink}&key=${currentApiKey}`);
        if (!videoResponse.ok) {
            const errorBody = await videoResponse.text();
            console.error("Gagal mengunduh video:", videoResponse.status, errorBody);
            throw new Error(`Server menolak unduhan video (status: ${videoResponse.status}).`);
        }
        const videoBlob = await videoResponse.blob();
        const videoObjectUrl = URL.createObjectURL(videoBlob);
        return videoObjectUrl;

    } catch (error) {
        console.error("Error polling video status:", error);
         if (error instanceof Error) {
            throw new Error(`Gagal memproses video: ${error.message}`);
        }
        throw new Error(`Gagal memproses video: Terjadi kesalahan tidak dikenal.`);
    }
};

export const generateImageAudioDescription = async (
    filePart: { inlineData: { data: string; mimeType: string; } }
): Promise<string> => {
    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("Kunci API tidak ditemukan.");
        const ai = new GoogleGenAI({ apiKey });

        // Step 1: Generate a text description of the image.
        const descriptionPrompt = "Deskripsikan gambar ini secara detail, seolah-olah Anda adalah narator film dokumenter. Fokus pada elemen visual utama, suasana, dan kemungkinan cerita di baliknya.";
        const textGenResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [filePart, { text: descriptionPrompt }] },
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
            },
        });
        const textDescription = textGenResponse.text;
        if (!textDescription) {
            throw new Error("Gagal mendapatkan deskripsi teks dari gambar.");
        }

        // Step 2: Convert the text description to speech.
        const ttsResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Ucapkan dengan nada jelas dan sedikit dramatis: ${textDescription}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }, // A clear, suitable voice
                    },
                },
            },
        });
        
        const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("Gagal menghasilkan audio dari deskripsi.");
        }

        // Step 3: Convert raw PCM audio data to a playable WAV data URL.
        const audioUrl = pcmToWavDataUrl(base64Audio, 24000, 1);
        return audioUrl;

    } catch (error) {
        console.error("Error generating image audio description:", error);
        throw new Error("Gagal menganalisis gambar untuk audio. Sirkuit auditori gue kayaknya lagi error.");
    }
};