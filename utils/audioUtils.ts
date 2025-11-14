// Function to encode ArrayBuffer into a base64 string
const encode = (bytes: Uint8Array): string => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

// Function to decode base64 string into a Uint8Array
const decode = (base64: string): Uint8Array => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};


/**
 * Converts raw PCM audio data (as a base64 string) into a playable WAV audio data URL.
 * The Gemini TTS API returns raw audio data, which lacks the necessary headers to be played
 * in a standard <audio> tag. This function constructs a proper WAV header and prepends it
 * to the audio data.
 * @param base64Pcm The base64 encoded string of the raw PCM audio data.
 * @param sampleRate The sample rate of the audio (e.g., 24000).
 * @param channels The number of audio channels (e.g., 1 for mono).
 * @returns A data URL string (e.g., "data:audio/wav;base64,...") that can be used as the src for an HTML audio element.
 */
export const pcmToWavDataUrl = (base64Pcm: string, sampleRate: number, channels: number): string => {
    const pcmData = decode(base64Pcm);
    const bitsPerSample = 16;
    const byteRate = sampleRate * channels * (bitsPerSample / 8);
    const blockAlign = channels * (bitsPerSample / 8);
    const dataSize = pcmData.length;
    const fileSize = 36 + dataSize;

    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF header
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, fileSize, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"

    // "fmt " sub-chunk
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // Sub-chunk size (16 for PCM)
    view.setUint16(20, 1, true); // Audio format (1 for PCM)
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // "data" sub-chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataSize, true);

    // Write PCM data
    const pcmBytes = new Uint8Array(buffer, 44);
    pcmBytes.set(pcmData);

    const wavBase64 = encode(new Uint8Array(buffer));
    return `data:audio/wav;base64,${wavBase64}`;
};
