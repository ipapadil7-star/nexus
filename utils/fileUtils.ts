import { Message } from "../types";

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error("Gagal membaca file sebagai string"));
      }
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      resolve(reader.result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const getMimeType = (fileName: string): string | null => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'webp':
            return 'image/webp';
        case 'heic':
            return 'image/heic';
        case 'heif':
            return 'image/heif';
        case 'pdf':
            return 'application/pdf';
        case 'gif':
            return 'image/gif';
        case 'bmp':
            return 'image/bmp';
        case 'svg':
            return 'image/svg+xml';
        case 'tif':
        case 'tiff':
            return 'image/tiff';
        default:
            return null;
    }
};

/**
 * Initiates a file download programmatically.
 * @param url The URL of the file to download (can be a blob URL or data URL).
 * @param filename The desired name for the downloaded file.
 */
export const downloadFile = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Wraps text on a canvas context.
 * @returns The total height of the rendered text block.
 */
function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let linesRendered = 0;
  let startY = y;

  for (let n = 0; n < words.length; n++) {
    let testLine = line + words[n];
    // Don't add a space at the end of the very last word
    if (n < words.length - 1) {
      testLine += ' ';
    }
    
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      context.fillText(line, x, y);
      linesRendered++;
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.fillText(line, x, y);
  linesRendered++;
  return y + lineHeight - startY; // Return total height used for this block
}


/**
 * Creates a composite image with metadata text and triggers a download.
 * @param message The message object containing the imageUrl.
 * @param precedingPrompt The user prompt that generated the image.
 */
export const downloadImageWithMetadata = async (message: Message, precedingPrompt?: string): Promise<void> => {
    if (!message.imageUrl) {
      throw new Error("Pesan tidak punya gambar untuk diunduh.");
    }
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = message.imageUrl;

    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("Gagal memuat gambar untuk diproses."));
    });

    const PADDING = Math.max(20, img.width * 0.05);
    const METADATA_BG = '#1F2937'; // gray-800
    const HEADING_COLOR = '#A78BFA'; // purple-400
    const TEXT_COLOR = '#D1D5DB'; // gray-300
    const SUBTLE_TEXT_COLOR = '#6B7280'; // gray-500

    const FONT_S = `${Math.max(12, img.width * 0.015)}px monospace`;
    const FONT_M = `${Math.max(14, img.width * 0.02)}px sans-serif`;
    const FONT_M_ITALIC = `italic ${FONT_M}`;
    const FONT_L_BOLD = `bold ${Math.max(16, img.width * 0.025)}px sans-serif`;

    const LINE_HEIGHT_S = Math.max(16, img.width * 0.02);
    const LINE_HEIGHT_M = Math.max(20, img.width * 0.025);
    const LINE_HEIGHT_L = Math.max(24, img.width * 0.03);
    
    const metadataBlocks: { text: string, font: string, color: string, lineHeight: number, spacing: number }[] = [];

    if (message.isComicPanel) {
        metadataBlocks.push({ text: `PANEL #${message.panelNumber}`, font: FONT_L_BOLD, color: HEADING_COLOR, lineHeight: LINE_HEIGHT_L, spacing: LINE_HEIGHT_L * 0.5 });
        if (message.text) {
            metadataBlocks.push({ text: `Narasi: ${message.text}`, font: FONT_M_ITALIC, color: TEXT_COLOR, lineHeight: LINE_HEIGHT_M, spacing: LINE_HEIGHT_M });
        }
        if (message.comicImagePrompt) {
            metadataBlocks.push({ text: `Prompt Gambar: ${message.comicImagePrompt}`, font: FONT_S, color: SUBTLE_TEXT_COLOR, lineHeight: LINE_HEIGHT_S, spacing: LINE_HEIGHT_S * 0.5 });
        }
    } else {
        if (precedingPrompt) {
            metadataBlocks.push({ text: `Prompt Pengguna`, font: FONT_L_BOLD, color: HEADING_COLOR, lineHeight: LINE_HEIGHT_L, spacing: LINE_HEIGHT_L * 0.5 });
            metadataBlocks.push({ text: precedingPrompt, font: FONT_M, color: TEXT_COLOR, lineHeight: LINE_HEIGHT_M, spacing: LINE_HEIGHT_M });
        }
        if (message.imageStyle) {
            metadataBlocks.push({ text: `Gaya: ${message.imageStyle}`, font: FONT_S, color: SUBTLE_TEXT_COLOR, lineHeight: LINE_HEIGHT_S, spacing: LINE_HEIGHT_S * 0.5 });
        }
    }
    metadataBlocks.push({ text: `Dibuat oleh AKBAR AI`, font: `italic ${Math.max(10, img.width * 0.012)}px sans-serif`, color: SUBTLE_TEXT_COLOR, lineHeight: LINE_HEIGHT_S, spacing: 0 });

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    let metadataHeight = PADDING * 2;
    
    const textMaxWidth = img.width - PADDING * 2;
    
    metadataBlocks.forEach(block => {
        tempCtx.font = block.font;
        const words = block.text.split(' ');
        let currentLine = '';
        for (const word of words) {
            const testLine = currentLine + word + ' ';
            if (tempCtx.measureText(testLine).width > textMaxWidth && currentLine.length > 0) {
                metadataHeight += block.lineHeight;
                currentLine = word + ' ';
            } else {
                currentLine = testLine;
            }
        }
        metadataHeight += block.lineHeight;
        metadataHeight += block.spacing;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height + metadataHeight;
    const ctx = canvas.getContext('2d')!;

    ctx.drawImage(img, 0, 0);

    ctx.fillStyle = METADATA_BG;
    ctx.fillRect(0, img.height, canvas.width, metadataHeight);

    let currentY = img.height + PADDING + LINE_HEIGHT_L/2;
    metadataBlocks.forEach(block => {
        ctx.font = block.font;
        ctx.fillStyle = block.color;
        const blockHeight = wrapText(ctx, block.text, PADDING, currentY, textMaxWidth, block.lineHeight);
        currentY += blockHeight + block.spacing;
    });

    const filename = `akbar-ai-image-${message.id.slice(-6)}.png`;
    downloadFile(canvas.toDataURL('image/png'), filename);
};