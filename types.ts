

export type Role = 'user' | 'model';
export type AiStyle = 'akbar' | 'jailbreak' | 'assistant';

export interface FileInfo {
  name: string;
  type: string;
  url: string; // Blob URL
}

export interface CustomCommand {
  name: string;
  text: string;
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
  isComicPanel?: boolean; // New flag for comic panels
  panelNumber?: number; // The sequence number for a comic panel
  isStyleSelector?: boolean; // To render the style selection UI
  documentInfo?: { format: 'pdf' | 'slide' | 'sheet', filename: string }; // For generated documents
  comicImagePrompt?: string; // The original prompt used to generate the comic panel's image
  imageStyle?: string; // The style used for image generation (e.g., 'cinematic')
}