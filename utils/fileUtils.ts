
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
