import { FileIcon, FileText, FileImage, FileVideo, FileArchive, FileCode } from 'lucide-react';

/**
 * File utility functions for upload and validation
 */

/**
 * Validate file based on size and type constraints
 * @param file - File to validate
 * @param maxSize - Maximum file size in bytes
 * @param allowedTypes - Array of allowed MIME types
 * @returns True if file is valid
 */
export const validateFile = (
  file: File,
  maxSize: number,
  allowedTypes: string[]
): { valid: boolean; error?: string } => {
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${formatFileSize(maxSize)}`,
    };
  }

  if (allowedTypes.length > 0 && !allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.replace('/*', ''));
    }
    return file.type === type;
  })) {
    return {
      valid: false,
      error: 'File type not allowed',
    };
  }

  return { valid: true };
};

/**
 * Format file size to human-readable string
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Generate thumbnail for image file
 * @param file - Image file
 * @param maxWidth - Maximum thumbnail width
 * @param maxHeight - Maximum thumbnail height
 * @returns Promise resolving to data URL
 */
export const generateThumbnail = (
  file: File,
  maxWidth: number = 200,
  maxHeight: number = 200
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(file.type));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Get appropriate icon component for file type
 * @param mimeType - MIME type of the file
 * @returns Lucide icon component
 */
export const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType.startsWith('video/')) return FileVideo;
  if (mimeType.startsWith('text/')) return FileText;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) {
    return FileArchive;
  }
  if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('xml')) {
    return FileCode;
  }
  return FileIcon;
};

/**
 * Check if file is an image
 * @param file - File to check
 * @returns True if file is an image
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Check if file is a document
 * @param file - File to check
 * @returns True if file is a document
 */
export const isDocumentFile = (file: File): boolean => {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ];
  return documentTypes.includes(file.type);
};

/**
 * Get file extension from filename
 * @param filename - Name of the file
 * @returns File extension (without dot)
 */
export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

/**
 * Truncate filename if too long
 * @param filename - Original filename
 * @param maxLength - Maximum length
 * @returns Truncated filename
 */
export const truncateFilename = (filename: string, maxLength: number = 30): string => {
  if (filename.length <= maxLength) return filename;
  
  const extension = getFileExtension(filename);
  const nameWithoutExt = filename.slice(0, filename.length - extension.length - 1);
  const truncatedName = nameWithoutExt.slice(0, maxLength - extension.length - 4);
  
  return `${truncatedName}...${extension}`;
};
