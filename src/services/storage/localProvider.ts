import { Attachment } from '../../types';
import { StorageProvider } from './storageProvider';

/**
 * LocalProvider implements StorageProvider for the Local First MVP phase.
 * It uses FileReader to convert files to Base64 strings and stores them 
 * in localStorage (or IndexedDB if we were fully expanding it).
 * For now, this meets the requirement without integrating cloud storage.
 */
export class LocalProvider implements StorageProvider {
  async uploadFile(file: File, uploadedBy: string, documentType: Attachment['type']): Promise<Attachment> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const base64String = reader.result as string;
        const attachmentId = `loc_${Date.now()}_${crypto.randomUUID().split('-')[0]}`;
        
        // In a true local-first PWA we'd use IndexedDB (e.g., localforage).
        // For this MVP, we simulate it by returning the data URI directly 
        // as the URL, which the browser can natively render or download.
        // If files are large, we'd strictly need IndexedDB to bypass localStorage quotas.
        
        const attachment: Attachment = {
          id: attachmentId,
          fileName: file.name,
          url: base64String, // Base64 data URI acts as the URL locally
          type: documentType,
          uploadedDate: new Date().toISOString(),
          uploadedBy,
          size: file.size,
        };

        resolve(attachment);
      };

      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsDataURL(file);
    });
  }

  async getFileUrl(attachment: Attachment): Promise<string> {
    // Since the URL is a data URI in the local provider, just return it.
    return attachment.url;
  }

  async deleteFile(attachment: Attachment): Promise<void> {
    // In this mock, there's nothing to delete since the data URI is 
    // stored directly in the database record of RateHistoryEntry.
    return Promise.resolve();
  }
}

export const storage = new LocalProvider();
