/**
 * Firebase Storage Service
 * 
 * Handles file uploads, downloads, and deletions
 * Supports images, documents, and other file types
 */

import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata
} from 'firebase/storage';
import { storage } from '../config/firebase';

const IMAGE_CONTENT_TYPE_MAP = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
  heic: 'image/heic',
  heif: 'image/heif',
  avif: 'image/avif'
};

const buildUploadMetadata = (file, extension) => {
  if (file?.type?.startsWith('image/')) {
    return { contentType: file.type };
  }

  const normalizedExt = (extension || '').toLowerCase();
  const inferredType = IMAGE_CONTENT_TYPE_MAP[normalizedExt];

  if (inferredType) {
    return { contentType: inferredType };
  }

  // Fallback to a safe default that still satisfies storage rules
  return { contentType: 'image/jpeg' };
};

/**
 * Convert a File/Blob to a base64 data URL.
 * Allows storing images directly with Firestore when Storage isn't available.
 */
export const fileToDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => resolve(event.target?.result || '');
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
};

/**
 * Upload a file to Firebase Storage
 * @param {File} file - File to upload
 * @param {string} path - Storage path (e.g., 'listings/images/')
 * @param {string} fileName - Optional custom file name
 * @returns {Promise<string>} Download URL
 */
export const uploadFile = async (file, path, fileName = null) => {
  try {
    const fileExtension = file.name.split('.').pop();
    const name = fileName || `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const storageRef = ref(storage, `${path}${name}`);
    const metadata = buildUploadMetadata(file, fileExtension);

    await uploadBytes(storageRef, file, metadata);
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Upload file with progress tracking
 * @param {File} file - File to upload
 * @param {string} path - Storage path
 * @param {string} fileName - Optional custom file name
 * @param {Function} onProgress - Progress callback (progress: number)
 * @returns {Promise<string>} Download URL
 */
export const uploadFileWithProgress = async (file, path, fileName = null, onProgress = null) => {
  try {
    const fileExtension = file.name.split('.').pop();
    const name = fileName || `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const storageRef = ref(storage, `${path}${name}`);
    const metadata = buildUploadMetadata(file, fileExtension);

    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Track upload progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          // Upload completed
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error uploading file with progress:', error);
    throw error;
  }
};

/**
 * Upload multiple files
 * @param {Array<File>} files - Array of files to upload
 * @param {string} path - Storage path
 * @returns {Promise<Array<string>>} Array of download URLs
 */
export const uploadMultipleFiles = async (files, path) => {
  try {
    const uploadPromises = files.map(file => uploadFile(file, path));
    const downloadURLs = await Promise.all(uploadPromises);
    return downloadURLs;
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    throw error;
  }
};

/**
 * Delete a file from Storage
 * @param {string} filePath - Full path to the file in Storage
 * @returns {Promise<void>}
 */
export const deleteFile = async (filePath) => {
  try {
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Get download URL for a file
 * @param {string} filePath - Full path to the file in Storage
 * @returns {Promise<string>} Download URL
 */
export const getFileURL = async (filePath) => {
  try {
    const storageRef = ref(storage, filePath);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw error;
  }
};

/**
 * List all files in a directory
 * @param {string} path - Storage path
 * @returns {Promise<Array>} Array of file references
 */
export const listFiles = async (path) => {
  try {
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);
    
    const files = await Promise.all(
      result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        const metadata = await getMetadata(itemRef);
        return {
          name: itemRef.name,
          fullPath: itemRef.fullPath,
          url,
          size: metadata.size,
          contentType: metadata.contentType,
          timeCreated: metadata.timeCreated
        };
      })
    );

    return files;
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
};

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @param {Object} options - Validation options { maxSize, allowedTypes }
 * @returns {Object} { valid: boolean, error: string }
 */
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  return { valid: true, error: null };
};

/**
 * Compress image before upload (client-side)
 * @param {File} file - Image file
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<File>} Compressed file
 */
export const compressImage = (file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };

      img.onerror = reject;
      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
















