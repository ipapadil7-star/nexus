
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
  fileInfo?: FileInfo; // For any file attachment
}
