
export type Role = 'user' | 'model';

export interface FileInfo {
  name: string;
  type: string;
  url: string; // Blob URL
}

export interface Message {
  id: string;
  role: Role;
  text?: string;
  imageUrl?: string; // For image previews & generated images
  videoUrl?: string; // For generated videos
  audioUrl?: string; // For generated audio descriptions
  fileInfo?: FileInfo; // For any file attachment
  generationStatus?: 'pending' | 'generating' | 'complete' | 'error';
  generationText?: string; // To show progress updates
}